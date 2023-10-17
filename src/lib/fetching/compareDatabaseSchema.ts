import compareColumnData from './compareColumnData'
import { ColumnData } from '../types/Column'
import { DiffResult } from '../types/DiffResult'
import { DatabaseSchema, SchemaDiff } from '../types/Schema'
import { TableDiff, TableSchema } from '../types/Table'
import { ClientType } from 'lib/clients/Inspector'

function checkAddedTables(schema1: DatabaseSchema, schema2: DatabaseSchema, result: SchemaDiff, type: ClientType): void {

	for (const table in schema2) {
		const table2: TableSchema = schema2[table]
		const table1: TableSchema | undefined = schema1.find(tableData => tableData.name === table2.name)
		if (!table1) {
			const tableDiff: TableDiff = { name: table2.name, columns: {}, deletedColumns: [], type: 'added' }
			for (const column in table2.columns) {
				const columnName: string = table2.columns[column].name
				tableDiff.columns[columnName] = compareColumnData({}, table2.columns[column], type) || {}
			}
			if (table2.uniqueColumns?.length || 0 > 0)
				tableDiff.uniqueUpdated = true
			result.push(tableDiff)
		}
	}
}

function checkAllColumns(schema1: DatabaseSchema, schema2: DatabaseSchema, table: string, tableDiff: TableDiff, type: ClientType): void {
	const oldTable: TableSchema = schema1.find(tableData => tableData.name === table) as TableSchema
	const newTable: TableSchema = schema2.find(tableData => tableData.name === table) as TableSchema

	for (const column in oldTable.columns) {
		const columnName: string = oldTable.columns[column]?.name
		const newColumn: ColumnData | undefined = newTable.columns.find(column => column.name === columnName)
		if (newColumn === undefined) {
			tableDiff.deletedColumns.push(columnName)
			continue
		}

		const columnDiff: DiffResult | null = compareColumnData(oldTable.columns[column], newColumn, type)
		if (columnDiff)
			tableDiff.columns[columnName] = columnDiff
	}
	for (const column in newTable.columns) {
		const columnName: string = newTable.columns[column].name
		if (oldTable.columns.find(column => column.name === columnName) === undefined) {
			tableDiff.columns[columnName] = compareColumnData({}, newTable.columns[column], type) || {}
			continue
		}
	}
}

/**
 * @function compareDatabaseSchema
 * @description Compares two database schemas and returns the differences
 *
 * @param schema1 The first schema to compare (the old one) as a {@link DatabaseSchema} object
 * @param schema2 The second schema to compare (the new one) as a {@link DatabaseSchema} object
 *
 * @returns The differences between the two schemas as a {@link SchemaDiff} object
 */
export default function compareDatabaseSchema(schema1: DatabaseSchema, schema2: DatabaseSchema, type: ClientType): SchemaDiff {
	const result: SchemaDiff = []
	for (const table in schema1) {
		const table1: TableSchema = schema1[table]
		const table2: TableSchema | undefined = schema2.find(tableData => tableData.name === table1.name)
		const tableDiff: TableDiff = { name: table1.name, columns: {}, deletedColumns: [], type: 'modified' }
		if (!table2) {
			tableDiff.type = 'deleted'
			table1.columns.forEach(column => { tableDiff.columns[column.name] = {} })
			result.push(tableDiff)
			continue
		}

		checkAllColumns(schema1, schema2, table1.name, tableDiff, type)

		if (JSON.stringify(table2.uniqueColumns) !== JSON.stringify(table1?.uniqueColumns))
				tableDiff.uniqueUpdated = true
		if (Object.keys(tableDiff.columns).length > 0 || tableDiff.deletedColumns.length > 0)
			result.push(tableDiff)
	}
	checkAddedTables(schema1, schema2, result, type)
	return result
}
