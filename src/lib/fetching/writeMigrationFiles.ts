import { writeFile } from 'fs/promises'
import KnexMigrationBuilder, { KnexMigration } from '@lib/classes/KnexMigrationBuilder'
import { TableDiff } from '@lib/types/Table'
import { Diff } from '@lib/types/DiffResult'

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

	changes.filter((value, index, self) => self.indexOf(value) === index)

	return changes
}

export async function writeMigrationFiles(builder: KnexMigrationBuilder, outdir: string = './migrations'): Promise<void> {
	const migrations: Array<KnexMigration> = builder.getMigrations()
	let delay: number = 0

	for (const migration of migrations) {
		if (!migration.content || migration.content.length === 0)
			continue

		const changes: Array<ChangeType> = getChangeType(migration.diff as TableDiff)
		const fileName: string = `${dateToString(delay)}_${changes.join('-')}_${migration.name}.js`

		await writeFile(`${outdir}/${fileName}`, migration.content)
		delay++
	}
}
