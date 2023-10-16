import { mkdir, writeFile } from 'fs/promises'
import KnexMigrationBuilder, { KnexMigration } from '../classes/KnexMigrationBuilder'
import { TableDiff } from '../types/Table'
import { Diff } from '../types/DiffResult'
import { KnexProfile, fetchKnexConfig } from '../../utils/files/knexConfig'
import { existsSync } from 'fs'

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

	if (!existsSync(outdir))
		await mkdir(outdir)

	for (const migration of migrations) {
		if (!migration.content || migration.content.length === 0)
			continue

		const changes: Array<ChangeType> = getChangeType(migration.diff as TableDiff)
		const fileName: string = `${dateToString(delay)}_${changes.join('-')}_${migration.name}.js`

		await writeFile(`${outdir}/${fileName}`, migration.content)
		delay++
	}

}
