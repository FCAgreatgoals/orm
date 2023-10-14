import { Knex } from 'knex'
import Inspector from '@lib/clients/Inspector'
import MySQLInspector from '@lib/clients/MySQLInspector'
import PostgreInspector from '@lib/clients/PostgreInspector'

export default function KnexInspector(database: Knex): Inspector | null {

	switch (database.client.config.client) {
		case 'Client_MySQL':
		case 'Client_MySQL2':
		case 'mysql': {
			return new MySQLInspector(database)
		}

		case 'Client_PG':
		case 'postgresql': {
			return new PostgreInspector(database)
		}

		default: {
			throw new Error(`KnexInspector: Unsupported database client: ${database.client.config.client}`)
		}

	}

}
