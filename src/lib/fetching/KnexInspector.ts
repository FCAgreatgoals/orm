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

import { Knex } from 'knex'
import Inspector from '../clients/Inspector'
import MySQLInspector from '../clients/MySQLInspector'
import PostgreInspector from '../clients/PostgreInspector'

export default function KnexInspector(database: Knex): Inspector | null {

	switch (database.client.config.client) {
		case 'Client_MySQL':
		case 'Client_MySQL2':
		case 'mysql': {
			return new MySQLInspector(database)
		}

		case 'Client_PG':
		case 'postgresql':
		case 'pg': {
			return new PostgreInspector(database)
		}

		default: {
			throw new Error(`KnexInspector: Unsupported database client: ${database.client.config.client}`)
		}

	}

}
