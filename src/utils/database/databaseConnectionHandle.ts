import fetchDatabaseStructure from '@lib/fetching/fetchDatabaseStructure'
import { DatabaseSchema } from '@lib/types/Schema'
import { Command } from '@oclif/core'
import { KnexProfile, fetchKnexConfig } from '@utils/files/knexConfig'
import knex, { Knex } from 'knex'

export default async function databaseConnectionHandle(ctx: Command): Promise<{ schema: DatabaseSchema, isMySQL: boolean }> {
	const knexConfig: KnexProfile = await fetchKnexConfig(ctx)
		.catch((err: Error) => { throw err })

	const knexInstance: Knex = knex(knexConfig)
	const schema: DatabaseSchema = await fetchDatabaseStructure(knexInstance)
		.catch((err: Error) => { throw err })
	knexInstance.destroy()
	return { schema, isMySQL: knexConfig.client === 'mysql' }
}
