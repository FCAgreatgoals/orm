import { Command } from '@oclif/core'
import { KnexProfile, fetchKnexConfig } from '@utils/files/knexConfig'
import { Warning } from '@utils/strings/colors'
import { readdir, rm } from 'fs/promises'
import knex, { Knex } from 'knex'

export default async function checkForUnpushedMigrations(ctx: Command, env: string, outdir = './migrations', table?: string): Promise<void> {
	const knexConfig: KnexProfile = await fetchKnexConfig(ctx)
		.catch((err: Error) => { throw err })
	const knexInstance: Knex = knex(knexConfig)

	const migrations: Array<any> = await knexInstance.migrate.list()
		.catch((err: Error) => { throw err })
	const list = migrations[0].map((migration: any) => migration.name)
	const currentFiles: Array<string> = await readdir(outdir, { withFileTypes: false })
		.catch((err: Error) => { throw err })

	let diff = currentFiles.filter((file) => !list.includes(file))
	if (table) diff = diff.filter((file) => file.includes(table))

	if (diff.length > 0) {
		ctx.log(Warning('Existing migrations have not been pushed to the database, they have been overwritten'))
		for (const file of diff) {
			await rm(`${outdir}/${file}`)
		}
	}

	knexInstance.destroy()
}
