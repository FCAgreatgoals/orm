import { Knex } from 'knex'
import { ColumnData } from '@lib/types/Column'
import { DiffResult, DiffType } from '@lib/types/DiffResult'
import { Join } from '@lib/decorators/Join'

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
