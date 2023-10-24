import { Command } from '@oclif/core'
import { KnexProfile, fetchKnexConfig } from '../files/knexConfig'
import { Warning } from '../strings/colors'
import { rm, access, mkdir } from 'fs/promises'
import knex, { Knex } from 'knex'

async function directoryExists(directory: string): Promise<boolean> {
	return access(directory)
		.then(() => true)
		.catch(() => false)
}

export default async function checkForUnpushedMigrations(ctx: Command, table?: string): Promise<void> {
	const knexConfig: KnexProfile = await fetchKnexConfig(ctx).catch((err: Error) => { throw err })
	const knexInstance: Knex = knex(knexConfig)
	const outdir = knexConfig?.migrations?.directory || './migrations'

	if (!await directoryExists(outdir)) await mkdir(outdir).catch((err: Error) => { throw err })

	const migrations: Array<any> = await knexInstance.migrate.list().catch((err: Error) => { throw err })
	const list = migrations[0].map((migration: any) => migration.name)
	const currentFiles: Array<string> = migrations[1].map((migration: any) => migration.file)

	let diff = currentFiles.filter((file) => !list.includes(file))
	if (table) diff = diff.filter((file) => file.includes(table))

	if (diff.length > 0) {
		ctx.log(Warning('Existing migrations have not been pushed to the database, they have been overwritten'))
		for (const file of diff) {
			await rm(`${outdir}/${file}`)
		}
	}

	return knexInstance.destroy()
}
