import fetchDatabaseStructure from '../../lib/fetching/fetchDatabaseStructure'
import { DatabaseSchema } from '../../lib/types/Schema'
import { Command } from '@oclif/core'
import { KnexProfile, fetchKnexConfig } from '../files/knexConfig'
import knex, { Knex } from 'knex'
import { ClientType } from 'lib/clients/Inspector'

export default async function databaseConnectionHandle(ctx: Command): Promise<{ schema: DatabaseSchema, type: ClientType }> {
	const knexConfig: KnexProfile = await fetchKnexConfig(ctx)
		.catch((err: Error) => { throw err })

	const knexInstance: Knex = knex(knexConfig)
	const schema: { schema: DatabaseSchema, type: ClientType } = await fetchDatabaseStructure(knexInstance)
		.catch((err: Error) => { throw err })
	knexInstance.destroy()
	return schema
}
