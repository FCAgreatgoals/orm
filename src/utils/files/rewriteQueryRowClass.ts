import { readFile, writeFile } from 'fs/promises'
import { toFileNameString } from '@utils/files/createNewClass'
import { renderTemplate } from '@utils/files/renderTemplate'
import { blue } from '@utils/strings/colors'
import GetsetCommand from 'commands/getset'

type QueryRowColumn = {
	columnName: string,
	columnNameUpcase: string,
	paramType: string,
}

function functionExists(content: Array<string>, functionName: string): boolean {
	for (const line of content) {
		if (line.includes(`set${functionExists}`) || line.includes(`get${functionName}`)) return true
	}
	return false
}

function extractColumnData(content: Array<string>, lineIndex: number, hydratedProperties: Array<string>): QueryRowColumn | null {
	const line: string = content[lineIndex]
	const prevLine: string = content[lineIndex - 1]

	/* eslint-disable */
	const isHydrated: boolean = lineIndex > 0 && prevLine.match(/@Transform.Hydrate\(\'\w+\',/) !== null
	const data: RegExpMatchArray | null = line.match(/private (\w+)!: ([\w\.]+|(?:"\w+"(?: \| )?)*)/)
	if (!data) return null
	/* eslint-enable */

	const column: QueryRowColumn = {
		columnName: data[1],
		columnNameUpcase: toFileNameString(data[1]).replace('QueryRow', ''),
		paramType: data[2],
	}

	if (hydratedProperties.includes(column.columnName)) return column
	if (isHydrated || !prevLine.includes('@')) return null

	return column
}

function fetchNewColumns(content: Array<string>): Array<QueryRowColumn> {
	const newColumns: Array<QueryRowColumn> = []
	const hydratedProperties: Array<string> = []

	for (const index in content) {
		const line: string = content[parseInt(index)]
		// eslint-disable-next-line no-useless-escape
		const hydrationCheck: RegExpMatchArray | null = line.match(/@Transform.Hydrate\(\'(\w+)\',/)
		if (hydrationCheck) hydratedProperties.push(hydrationCheck[1])

		const column: QueryRowColumn | null = extractColumnData(content, parseInt(index), hydratedProperties)
		if (!column) continue

		if (functionExists(content, column.columnNameUpcase)) continue

		newColumns.push(column)
	}

	return newColumns
}

function checkMethodsHeaders(content: Array<string>): Array<string> {
	let newContent: Array<string> = content
	let setterFunctionsExists: boolean = false
	for (const line of content)
		if (line.includes('// Getter Functions')) setterFunctionsExists = true

	if (!setterFunctionsExists) {
		for (let i = content.length - 1; i >= 0; i--) {
			if (content[i].includes('}')) {
				newContent = [...content.slice(0, i), '\t// Setter Functions', '\n\t// Getter Functions', '\n\t// Additional Functions\n', ...content.slice(i)]
				break
			}
		}
	}

	return newContent
}

async function addFunctions(content: Array<string>, column: QueryRowColumn): Promise<Array<string>> {
	let newContent: Array<string> = content
	const setterFunction: Array<string> = (await renderTemplate('setterfunctions.ejs', column)).replace(/&#34;/g, '"').split('\n')
	const getterFunction: Array<string> = (await renderTemplate('getterfunctions.ejs', column)).replace(/&#34;/g, '"').split('\n')

	newContent = checkMethodsHeaders(newContent)

	const setterFunctionsIndex: number = newContent.indexOf('\n\t// Getter Functions')
	newContent.splice(setterFunctionsIndex, 0, ...setterFunction)

	const getterFunctionsIndex: number = newContent.indexOf('\n\t// Additional Functions\n')
	newContent.splice(getterFunctionsIndex, 0, ...getterFunction)

	return newContent
}

export default async function rewriteQueryRowClass(file: string, ctx: GetsetCommand): Promise<void> {

	const fileContent: string = await readFile(file, 'utf-8')
		.catch(() => ctx.error('Invalid queryrow class'))
	let splitContent: Array<string> = fileContent.split('\n')

	const newQueryRows: Array<QueryRowColumn> = fetchNewColumns(splitContent)
	for (const column of newQueryRows) {
		splitContent = await addFunctions(splitContent, column)
	}

	if (newQueryRows.length == 0)
		return
	ctx.log(`QueryRow class ${blue(file)} updated successfully`)
	ctx.modifiedFilesNumber++

	await writeFile(file, splitContent.join('\n'), 'utf8')
}
