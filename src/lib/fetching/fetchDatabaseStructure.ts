import { Knex } from 'knex'
import KnexInspector from '@lib/fetching/KnexInspector'
import { DatabaseSchema } from '@lib/types/Schema'
import { ColumnData } from '@lib/types/Column'
import { CheckConstraint, ConstraintType, ReferenceConstraint, Table } from '@lib/types/Table'
import Inspector from '@lib/clients/Inspector'

function handleCheckConstraint(constraint: string, table: Table, schema: DatabaseSchema, tableIndex: number): void {
	const data: CheckConstraint = table.checks[constraint]
	const column: ColumnData = schema[tableIndex - 1].columns.find(column => column.name === data.column) as ColumnData

	if (data.deferrable)
		column.constraintDeferred = true

	switch (data.type) {

		case 'numeral': {
			column.checkNumeral = `${data.numeralSymbol} ${data.numeralValue}`
			break
		}

		case 'positive': {
			column.checkPositive = true
			break
		}

		case 'negative': {
			column.checkNegative = true
			break
		}

		case 'between': {
			column.checkBetween = data.betweenValues
			break
		}

		case 'in': {
			column.checkIn = data.inclusionValues
			break
		}

		case 'not in': {
			column.checkNotIn = data.inclusionValues
			break
		}

		case 'regexp': {
			column.checkRegexp = data.regexp
			break
		}

	}

}

function handleForeignKeyConstraint(constraint: string, table: Table, schema: DatabaseSchema, tableIndex: number, inspector: Inspector): void {
	const data: ReferenceConstraint = table.references[constraint]
	const column: ColumnData = schema[tableIndex - 1].columns.find(column => column.name === data.column) as ColumnData
	column.foreign_key_table = data.refTable
	column.foreign_key_column = data.refColumn
	if (data.onUpdate && data.onUpdate !== 'NO ACTION')
		column.onUpdate = data.onUpdate
	if (data.onDelete && data.onDelete !== 'NO ACTION')
		column.onDelete = data.onDelete
	if (data.deferrable && inspector.client_type === 'postgres')
		column.constraintDeferred = true
}

function parseConstraints(tableInfo: Table, schema: DatabaseSchema, tableIndex: number, inspector: Inspector) {

	if (Object.keys(tableInfo.constraints).length === 0)
		return
	(schema[tableIndex - 1].columns.find(column => column.name === tableInfo.primary) as ColumnData).is_primary_key = true

	for (const uniqueColumn of tableInfo.uniques || [])
		(schema[tableIndex - 1].columns.find(column => column.name === uniqueColumn) as ColumnData).is_unique = true

	for (const constraints in tableInfo.constraints || []) {
		const type: ConstraintType = (tableInfo.constraints[constraints]).type as ConstraintType
		if (type == 'UNIQUE' || type == 'PRIMARY KEY')
			continue

		switch (type) {

			case 'FOREIGN KEY': {
				handleForeignKeyConstraint(constraints, tableInfo, schema, tableIndex, inspector)
				break
			}

			case 'CHECK': {
				handleCheckConstraint(constraints, tableInfo, schema, tableIndex)
				break
			}

		}

	}
}

export default async function fetchDatabaseStructure(database: Knex, includeKnexTables = false): Promise<DatabaseSchema> {
	const inspector: Inspector | null = KnexInspector(database)
	if (!inspector)
		throw new Error(`KnexInspector: Unsupported database client: ${database.client.config.client}`)

	const schema: DatabaseSchema = []

	const tables: Array<string> = await inspector.tables()
	for (const table of tables) {
		if (['knex_migrations', 'knex_migrations_lock'].includes(table) && !includeKnexTables)
			continue
		const tableIndex: number = schema.push({ name: table, columns: [] })
		const columns: Array<ColumnData> = await inspector.columnInfo(table)

		const tableColumns: Array<string> = []
		for (const column of columns) {
			tableColumns.push(column.name)
			schema[tableIndex - 1].columns.push(column)
		}

		const tableInfo: Table = await inspector.tableInfo(table)

		parseConstraints(tableInfo, schema, tableIndex, inspector)
	}

	return schema
}
