import { TableData } from '../decorators/Table'
import { ColumnData } from '../types/Column'
import { TableSchema } from '../types/Table'

export default function translateTable(table: TableData): TableSchema {
	const schema: TableSchema = { name: table.name as string, columns: [], uniqueColumns: [], joins: table.joins }
	if (table.referencedTables)
		schema.referencedTables = table.referencedTables
	for (const column in table.columns) {
		schema.columns.push(table.columns[column] as ColumnData)
		if (table.columns[column].is_unique)
			schema.uniqueColumns?.push(table.columns[column].name as string)
	}
	return schema
}
