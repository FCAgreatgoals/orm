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

import { writeFile } from 'fs/promises'
import KnexMigrationBuilder, { KnexMigration } from '../classes/KnexMigrationBuilder'
import { TableDiff } from '../types/Table'
import { Diff } from '../types/DiffResult'
import { KnexProfile, fetchKnexConfig } from '../../utils/files/knexConfig'

function dateToString(delayInSeconds: number): string {
	const date: Date = new Date()
	date.setSeconds(date.getSeconds() + delayInSeconds)
	return	date.getFullYear().toString() +
			(date.getMonth() + 1).toString().padStart(2, '0') +
			date.getDate().toString().padStart(2, '0') +
			date.getHours().toString().padStart(2, '0') +
			date.getMinutes().toString().padStart(2, '0') +
			date.getSeconds().toString().padStart(2, '0')
}

enum ChangeType {
	TABLE_CREATION = 'CT',
	TABLE_DELETION = 'DT',
	COLUMN_CREATION = 'CC',
	COLUMN_DELETION = 'DC',
	COLUMN_MODIFICATION = 'CM',
}

function getChangeType(diff: TableDiff): Array<ChangeType> {
	if (diff.type === 'added')
		return [ChangeType.TABLE_CREATION]
	if (diff.type === 'deleted')
		return [ChangeType.TABLE_DELETION]
	const changes: Array<ChangeType> = []

	if (diff.deletedColumns.length > 0)
		changes.push(ChangeType.COLUMN_DELETION)

	for (const column in diff.columns) {
		const updatedProperty: string = Object.keys(diff.columns[column])[0]
		const propertyObject: Diff = diff.columns[column][updatedProperty]
		switch (propertyObject.type) {

			case 'added': {
				changes.push(ChangeType.COLUMN_CREATION)
				break
			}

			case 'deleted':
			case 'modified': {
				changes.push(ChangeType.COLUMN_MODIFICATION)
				break
			}

		}
	}

	return changes.filter((value, index, self) => self.indexOf(value) === index)

}

export async function writeMigrationFiles(builder: KnexMigrationBuilder): Promise<void> {
	const migrations: Array<KnexMigration> = builder.getMigrations()
	let delay: number = 0

	const knexConfig: KnexProfile = await fetchKnexConfig().catch((err: Error) => { throw err })
	const outdir: string = knexConfig.migrations.directory || './migrations'

	for (const migration of migrations) {
		if (!migration.content || migration.content.length === 0)
			continue

		const changes: Array<ChangeType> = getChangeType(migration.diff as TableDiff)
		const fileName: string = `${dateToString(delay)}_${changes.join('-')}_${migration.name}.js`

		await writeFile(`${outdir}/${fileName}`, migration.content)
		delay++
	}

}
