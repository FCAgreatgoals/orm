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
