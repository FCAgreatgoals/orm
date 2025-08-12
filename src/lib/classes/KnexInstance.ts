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

import { KnexProfile, fetchKnexConfig } from '../../utils/files/knexConfig'
import knex, { Knex } from 'knex'

export default class KnexInstance {

	private static knex: Knex | undefined

	public static get(): Knex {
		if (!KnexInstance.knex) throw new Error('KnexInstance not initialized')

		return KnexInstance.knex
	}

	public static async init(): Promise<void> {
		if (!KnexInstance.knex)
			await this.spawnKnex()
				.catch((err: Error) => { throw err })
	}

	public static destroy(): void {
		if (KnexInstance.knex) KnexInstance.knex?.destroy()
	}

	private static async spawnKnex(): Promise<void> {
		const knexConfig: KnexProfile = await fetchKnexConfig()
			.catch((err: Error) => { throw err })

		this.knex = knex(knexConfig)
	}

}
