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
