import { DatabaseSchema } from '../../lib/types/Schema'
import { TSConfig } from '@oclif/core/lib/interfaces'
import { fetchConfig } from '../../utils/files/tsconfig'
import { searchProject } from '../../utils/files/searchProject'
import { Command } from '@oclif/core'
import translateTable from '../../lib/fetching/translateTable'
import { TableSchema } from '../../lib/types/Table'

function sortTableSchemasByReference(tableSchemas: Array<TableSchema>): Array<TableSchema> {
	const visited = new Set<string>()
	const result: Array<TableSchema> = []

	function visit(schema: TableSchema) {
		if (!visited.has(schema.name)) {
			visited.add(schema.name)
			if (schema.referencedTables) {
				schema.referencedTables.forEach(tableName => {
					const referencedSchema = tableSchemas.find(s => s.name === tableName)
					if (referencedSchema) {
						visit(referencedSchema)
					}
				})
			}
			result.push(schema)
		}
	}

	tableSchemas.forEach(visit)

	return result
}

export default async function fetchQueryRows(flags: Record<string, string>, ctx: Command): Promise<DatabaseSchema> {
	const tsconfig: TSConfig = await fetchConfig()
		.catch((err: Error) => { throw err })
	const files: Array<string> = await searchProject(flags.project)
		.catch((err: Error) => { throw err })
	const tables: DatabaseSchema = []

	for (const file of files) {
		const distFile = file.replace(flags.project, `${process.cwd()}/${tsconfig.compilerOptions.outDir}`).replace('.ts', '.js')
		const queryrow = await import(distFile).catch((err: Error) => {
			ctx.error(`There was an error: ${err.message}\nMake sure to build your TS files before running this command`)
		})
		if (queryrow.default === undefined)
			ctx.error(`The file ${file} does not have a default export`)
		tables.push(translateTable(Reflect.getMetadata('table:data', Object.values(queryrow.default)[0] as any)))
	}

	return sortTableSchemasByReference(tables)
}
