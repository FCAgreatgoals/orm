import { Command } from '@oclif/core'
import { existsSync } from 'fs'
import { writeFile as fsWriteFile } from 'fs/promises'

export default async function writeFile(file: { name: string, data: string, path: string }, ctx: Command): Promise<void> {
	if (!existsSync(file.path))
		ctx.error(`Directory ${file.path} does not exist`)
	if (existsSync(`${file.path}/${file.name}.ts`))
		ctx.error(`File ${file.name}.ts already exists in ${file.path}`)

	const res = await fsWriteFile(`${file.path}/${file.name}.ts`, file.data)
	if (res !== undefined)
		ctx.error(`Error while creating file ${file.name}.ts in ${file.path}`)
}
