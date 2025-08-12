/**
 * This file is part of @fca.gg/orm (https://github.com/FCAgreatgoals/orm).
 *
 * Copyright (C) 2025 SAS French Community Agency
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import fetchDatabaseStructure from '../../lib/fetching/fetchDatabaseStructure'
import { DatabaseSchema } from '../../lib/types/Schema'
import { Command } from '@oclif/core'
import { KnexProfile, fetchKnexConfig } from '../files/knexConfig'
import knex, { Knex } from 'knex'
import { ClientType } from 'lib/clients/Inspector'

export default async function databaseConnectionHandle(ctx: Command): Promise<{ schema: DatabaseSchema, type: ClientType }> {
	const knexConfig: KnexProfile = await fetchKnexConfig(ctx).catch((err: Error) => { throw err })

	const knexInstance: Knex = knex(knexConfig)
	const schema: { schema: DatabaseSchema, type: ClientType } = await fetchDatabaseStructure(knexInstance).catch((err: Error) => { throw err })

	knexInstance.destroy()

	return schema
}
