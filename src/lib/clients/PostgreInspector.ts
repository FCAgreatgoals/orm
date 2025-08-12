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

import { Knex } from 'knex'
import { Table } from '../types/Table'
import { ColumnData } from '../types/Column'
import { RawSQLResult, SQLResult } from '../types/SQLResult'
import Inspector, { ClientType } from './Inspector'
import { postgreKnexTypes } from '../classes/KnexMigrationBuilder'

function isInt(type: string): boolean {
	return type.includes('int') || type.includes('bigint') || type.includes('tinyint') || type.includes('mediumint')
}

function parseInExpression(expression: string): string[] {
	const valuesRegex: RegExp = /'([^']+)'/gi
	const matches: Array<RegExpMatchArray> = [...expression.matchAll(valuesRegex)]

	const values: string[] = []

	for (const match of matches) {
		const value: string = match[1].replace('\\', '')
		values.push(value)
	}

	return values
}

function parseBetweenExpression(expression: string): Array<Array<number> | number> {
	const ranges: Array<Array<number> | number> = []

	const regex: RegExp = /\(\w+ [><=]{1,2} (\d+)\) AND \(\w+ [><=]{1,2} (\d+)\)/g
	let match

	while ((match = regex.exec(expression))) {
		const min: number = parseInt(match[1])
		const max: number = parseInt(match[2])

		ranges.push([min, max])
	}

	return (ranges.length > 1) ? ranges : (ranges[0] || []) as Array<number>
}

export default class PostgreInspector extends Inspector {

	private knex: Knex
	public client_type: ClientType = 'postgres'

	constructor(knex: Knex) {
		super()
		this.knex = knex
	}

	private async parseEnum(enumType: string): Promise<Array<string>> {
		const result: SQLResult = await this.knex
			.select(
				'enumlabel'
			)
			.from('pg_enum')
			.where({
				enumtypid: this.knex.raw(`'${enumType}'::regtype`)
			}).catch((err: Error) => { throw err })

		return result.map((row: RawSQLResult) => row.enumlabel)
	}

	public async tables(): Promise<Array<string>> {
		const records: SQLResult = await this.knex
		.select<{ table_name: string }[]>('table_name')
		.from('information_schema.tables')
		.where({
			table_type: 'BASE TABLE',
			table_schema: 'public'
		}).catch((err: Error) => { throw err })
		return records.map((record: RawSQLResult) => record.table_name)
	}

	private async fetchReference(table: Table, name: string, deferred?: boolean): Promise<void> {
		const reference: SQLResult = await this.knex
			.select(this.knex.raw('(SELECT relname FROM pg_catalog.pg_class WHERE oid = pgc.confrelid) as foreign_table'), 'rc.update_rule', 'rc.delete_rule', 'a1.attname as foreign_column')
			.from('pg_catalog.pg_constraint as pgc')
			.leftJoin('information_schema.referential_constraints as rc', function () {
				this.on('rc.constraint_name', '=', 'pgc.conname')
			})
			.leftJoin('pg_catalog.pg_attribute as a1', function () {
				this.on('a1.attrelid', '=', 'pgc.confrelid')
				.andOn('a1.attnum', '=', 'pgc.confkey[1]')
			})
			.where({
				'pgc.conname': name,
			}).catch((err: Error) => { throw err })

		const ref: RawSQLResult = reference[0]
		table.references[name] = {
			refTable: ref.foreign_table,
			refColumn: ref.foreign_column,
			onUpdate: ref.update_rule,
			onDelete: ref.delete_rule,
			column: table.constraints[name].column,
			deferrable: deferred
		}
	}

	private async fetchCheckConstraint(table: Table, name: string, column: string, deferred?: boolean): Promise<void> {
		const constraint: SQLResult = await this.knex
			.select('constraint_name', 'check_clause')
			.from('information_schema.check_constraints')
			.where({
				constraint_name: name,
			}).catch((err: Error) => { throw err })

			if (constraint.length === 0)
				return

			table.checks[name] = { column, deferrable: deferred }

			const check: RawSQLResult = constraint[0]

			if (check.check_clause.includes('~')) {
				table.checks[name].type = 'regexp'
				const regexp: string = check.check_clause.match(/~ '([^']+)'::text/)
				const result: string = regexp[1].replace(/[\\]{4}/g, '\\').replace(/'/g, '').replace(/\(\$\d:/g, '(?:')
				table.checks[name].regexp = result
			}
			else if (check.check_clause.includes('length')) {
				table.checks[name].type = 'numeral'
				// eslint-disable-next-line no-useless-escape
				table.checks[name].numeralSymbol = check.check_clause.match(/[\>\<\=]{1,2}/)[0]
				table.checks[name].numeralValue = parseInt(check.check_clause.match(/\d+/)[0])
			} else if (check.check_clause.includes('AND')) {
				table.checks[name].type = 'between'
				table.checks[name].betweenValues = parseBetweenExpression(check.check_clause)
			} else if (check.check_clause.includes('<> ALL')) {
				table.checks[name].type = 'not in'
				table.checks[name].inclusionValues = parseInExpression(check.check_clause)
			} else if (check.check_clause.includes('= ANY')) {
				table.checks[name].type = 'in'
				table.checks[name].inclusionValues = parseInExpression(check.check_clause)
			} else if (check.check_clause.match(/\(\w+ [<>] 0\)/))
				table.checks[name].type = check.check_clause.includes('>') ? 'positive' : 'negative'
				// eslint-disable-next-line no-useless-escape
			const match: RegExpMatchArray = check.check_clause.match(/(?:\(([^\(\)]+)\)::text)|(?:\((\w+) [><=]{1,2} \d+\))|(?:length\(+(\w+)\))/)
			if (match)
				table.checks[name].column = match[1] || match[2] || match[3]
			else
				// eslint-disable-next-line no-useless-escape
				table.checks[name].column = check.check_clause.split(' ')[0].replace(/[\(\)]/g, '')
	}

	private async fetchUnique(table: Table, name: string): Promise<void> {
		const result = await this.knex
		.select('column_name')
		.from('information_schema.key_column_usage')
		.where({
			constraint_name: name,
		})

		result.forEach((column: RawSQLResult) => table.uniques.push(column.column_name))
	}

	private async fetchConstraintsData(tableObj: Table): Promise<void> {
		for (const constraint in tableObj.constraints || []) {
			const obj = tableObj.constraints[constraint]

			switch (obj.type) {

				case 'UNIQUE': {
					await this.fetchUnique(tableObj, constraint).catch((err: Error) => { throw err })
					break
				}

				case 'FOREIGN KEY': {
					await this.fetchReference(tableObj, constraint, obj.deferrable).catch((err: Error) => { throw err })
					break
				}

				case 'PRIMARY KEY': {
					tableObj.primary = obj.column
					break
				}

				case 'CHECK': {
					await this.fetchCheckConstraint(tableObj, constraint, obj.column, obj.deferrable).catch((err: Error) => { throw err })
					break
				}

				default: {
					tableObj.indexes[constraint] = obj.column
					break
				}

			}

		}

	}

	public async tableInfo(table: string): Promise<Table> {
		const query: SQLResult = await this.knex
		.select(
			'table_name',
			'table_schema',
		)
		.from('information_schema.tables')
		.where({
			table_schema: 'public',
			table_type: 'BASE TABLE',
			table_name: table
		}).catch((err: Error) => { throw err })

		const constraints: SQLResult = await this.knex
		.select('c.constraint_name', 'c.constraint_type', 'k.column_name', 'c.is_deferrable')
		.from('information_schema.table_constraints as c')
		.leftJoin('information_schema.key_column_usage as k', function () {
			this.on('c.constraint_name', '=', 'k.constraint_name')
			.andOn('c.table_schema', '=', 'k.constraint_schema')
		})
		.where({
			'c.table_name': table,
			'c.table_schema': 'public',
		}).catch((err: Error) => { throw err })

		const tableData: RawSQLResult = query[0]
		const tableObj: Table = {
			name: tableData.table_name,
			schema: tableData.table_schema,
			constraints: {},
			references: {},
			checks: {},
			uniques: [],
			primary: '',
			indexes: {}
		}

		constraints.forEach((result: RawSQLResult) => tableObj.constraints[result.constraint_name] = { type: result.constraint_type, column: result.column_name, deferrable: result.is_defferable === 'YES' })

		await this.fetchConstraintsData(tableObj)
					.catch((err: Error) => { throw err })

		return tableObj
	}

	public async columnInfo(table: string): Promise<Array<ColumnData>> {
		const query: Promise<SQLResult> = this.knex
		.select(
			'table_name',
			'column_name',
			'column_default',
			'is_nullable',
			'character_maximum_length',
			'numeric_precision',
			'numeric_scale',
			'data_type',
			'udt_name')
		.from('information_schema.columns')
		.where({
			'table_schema': 'public',
			'table_name': table,
		})

		const query_constraint: Promise<SQLResult> = this.knex
			.select(
				'tc.constraint_name',
				'tc.constraint_type',
				'kcu.column_name',
				this.knex.raw('ccu.table_name AS foreign_table_name'),
				this.knex.raw('ccu.column_name AS foreign_column_name'),
				'cc.check_clause'
			)
			.from('information_schema.table_constraints as tc')
			.leftJoin('information_schema.key_column_usage as kcu',
				function () {
					this.on('tc.constraint_name', '=', 'kcu.constraint_name')
						.andOn('tc.table_schema', '=', 'kcu.table_schema')
				}
			)
			.leftJoin('information_schema.constraint_column_usage as ccu',
				function () {
					this.on('tc.constraint_name', '=', 'ccu.constraint_name')
						.andOn('tc.table_schema', '=', 'ccu.table_schema')
				}
			)
			.leftJoin('information_schema.check_constraints as cc',
				function () {
					this.on('tc.constraint_name', '=', 'cc.constraint_name')
						.andOn('tc.table_schema', '=', 'cc.constraint_schema')
				}
			)
			.where({
				'tc.table_schema': 'public',
				'tc.table_name': table,
			})

		const columns: SQLResult = await query.catch((err: Error) => { throw err })
		const columns_constraint: SQLResult = await query_constraint.catch((err: Error) => { throw err })

		const columnData: Array<ColumnData> = []
		columns.forEach(async (column: RawSQLResult) => {
			const constraints = columns_constraint.filter(c => c.column_name === column.column_name)
			columnData.push({
				name: column.column_name,
				table: column.table_name,
				data_type: (column.data_type === 'USER-DEFINED' ? 'enum' : postgreKnexTypes[column.data_type as keyof typeof postgreKnexTypes]),
				default_value: column.column_default?.replace(/::[\w\s]+/, '').replace(/[``]/g, '').replace(/'/g, '') || null,
				max_length: column.character_maximum_length,
				is_unsigned: false,
				numeric_precision: column.numeric_precision,
				numeric_scale: column.numeric_scale,
				is_nullable: column.is_nullable === 'YES',
				is_unique: !!constraints.find(c => c.constraint_type === 'UNIQUE'),
				is_primary_key: !!constraints.find(c => c.constraint_type === 'PRIMARY KEY'),
				has_auto_increment: column.column_default?.includes('nextval') || false,
			})

			const data: ColumnData = columnData[columnData.length - 1]

			if (data.has_auto_increment)
				data.default_value = null
			if (isInt(column.data_type as string) && data.default_value !== null)
				data.default_value = parseInt(data.default_value as string)
			if (column.data_type === 'USER-DEFINED')
				data.enum_values = await this.parseEnum(column.udt_name)
			if (['date', 'timestamp', 'datetime', 'time'].includes(column.data_type) && column.column_default === 'CURRENT_TIMESTAMP')
				columnData[columnData.length - 1].default_value = 'NOW'
			if (column.data_type === undefined)
				throw new Error(`Column ${column.column_name} of table ${column.table_name} has no data_type or is not a valid data_type`)
		})

		return columnData
	}

}
