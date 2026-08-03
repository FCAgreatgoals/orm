/**
 * This file is part of @fca.gg/orm (https://github.com/FCAgreatgoals/orm).
 *
 * Copyright (C) 2026 SAS French Community Agency
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
 *
 * Additional permission under the AGPL-3.0 section 7:
 * You may use this library as a dependency in your own application without
 * your application being subject to the AGPL-3.0. Only modifications to
 * @fca.gg/orm itself must be made publicly available. See LINKING_EXCEPTION.md
 * for full details.
 */

import { Knex } from 'knex'
import { ColumnData } from './Column'
import { DiffResult, DiffType } from './DiffResult'
import { Join } from '../decorators/Join'

export type CheckType = 'regexp' | 'numeral' | 'positive' | 'negative' | 'between' | 'in' | 'not in'
export type CheckConstraint = {
	type?: CheckType
	regexp?: string
	numeralSymbol?: Knex.lengthOperator
	numeralValue?: number
	betweenValues?: Array<number | Array<number>>
	inclusionValues?: Array<string | number>
	column: string,
	deferrable?: boolean
}

export type ReferenceConstraint = {
	refTable: string
	refColumn: string
	onUpdate?: string
	onDelete?: string
	column: string,
	deferrable?: boolean
}

export type ConstraintType = 'UNIQUE' | 'FOREIGN KEY' | 'PRIMARY KEY' | 'CHECK'
export type Constraint = {
	type: ConstraintType
	column: string,
	deferrable?: boolean
}

export type Table = {
	name: string
	constraints: Record<string, Constraint>
	references:Record<string, ReferenceConstraint>
	checks: Record<string, CheckConstraint>
	indexes: Record<string, string>
	uniques: Array<string>
	primary: string

	// Not supported in SQLite + comment in mssql
	comment?: string | null
	schema?: string

	// MySQL Only
	collation?: string
	engine?: string

	// Postgres Only
	owner?: string

	// SQLite Only
	sql?: string

	//MSSQL only
	catalog?: string
}

export type TableSchema = {
	name: string
	columns: Array<ColumnData>
	uniqueColumns?: Array<string>
	joins?: Array<Join>,
	referencedTables?: Array<string>
}

export type TableDiff = {
	name: string
	columns: Record<string, DiffResult>
	type: DiffType
	deletedColumns: Array<string>
	uniqueUpdated?: boolean
}
