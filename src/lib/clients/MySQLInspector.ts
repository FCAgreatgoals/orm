import { Knex } from 'knex'
import { Constraint, Table } from '../types/Table'
import { ColumnData } from '../types/Column'
import { RawSQLResult, SQLResult } from '../types/SQLResult'
import Inspector from './Inspector'
import { knexTypes } from '../classes/KnexMigrationBuilder'

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

function parseBetweenExpression(expression: string): Array<number | Array<number>> {
	// Utilisez une expression régulière pour extraire les plages de valeurs
	const regex: RegExp = /between\s+(\d+)\s+and\s+(\d+)/gi
	const matches: Array<RegExpMatchArray> = [...expression.matchAll(regex)]

	// Traitez les matches et extrayez les valeurs numériques
	const result: Array<number | Array<number>> = []

	let currentRange: Array<number> = []

	for (const match of matches) {
		const start: number = parseInt(match[1])
		const end: number = parseInt(match[2])

		if (currentRange.length === 0) {
			currentRange = [start, end]
		} else {
			if (start === currentRange[1] + 1) {
				// Étendre la plage actuelle
				currentRange[1] = end
			} else {
				// Nouvelle plage
				result.push(currentRange)
				currentRange = [start, end]
			}
		}
	}

	if (currentRange.length > 0) {
		result.push(currentRange)
	}

	return (result.length > 1) ? result : (result[0] || []) as Array<number>
}

export default class MySQLInspector extends Inspector {

	private knex: Knex
	public client_type: 'mysql' | 'postgres' = 'mysql'

	constructor(knex: Knex) {
		super()
		this.knex = knex
	}

	private parseEnum(enumType: string): Array<string> {
		// eslint-disable-next-line no-useless-escape
		return enumType.replace(/enum\(|\)|\'/g, '').split(',')
	}

	public async tables(): Promise<Array<string>> {
		const records: SQLResult = await this.knex
		.select<{ TABLE_NAME: string }[]>('TABLE_NAME')
		.from('INFORMATION_SCHEMA.TABLES')
		.where({
			TABLE_TYPE: 'BASE TABLE',
			TABLE_SCHEMA: this.knex.client.database(),
		})
		return records.map((record: RawSQLResult) => record.TABLE_NAME)
	}

	private async fetchReference(table: Table, name: string): Promise<void> {
		const reference: SQLResult = await this.knex
			.select('k.REFERENCED_TABLE_NAME', 'k.REFERENCED_COLUMN_NAME', 'rc.UPDATE_RULE', 'rc.DELETE_RULE')
			.from('INFORMATION_SCHEMA.KEY_COLUMN_USAGE as k')
			.leftJoin('INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS as rc', function () {
				this.on('rc.TABLE_NAME', '=', 'k.TABLE_NAME')
				.andOn('rc.CONSTRAINT_NAME', '=', 'k.CONSTRAINT_NAME')
				.andOn('rc.CONSTRAINT_SCHEMA', '=', 'k.CONSTRAINT_SCHEMA')
			})
			.where({
				'k.CONSTRAINT_NAME': name,
				'k.TABLE_SCHEMA': this.knex.client.database(),
			}).catch((err: Error) => { throw err })

		const ref: RawSQLResult = reference[0]
		table.references[name] = {
			refTable: ref.REFERENCED_TABLE_NAME,
			refColumn: ref.REFERENCED_COLUMN_NAME,
			onUpdate: ref.UPDATE_RULE,
			onDelete: ref.DELETE_RULE,
			column: table.constraints[name].column
		}
	}

	private async fetchCheckConstraint(table: Table, name: string, column: string): Promise<void> {
		const constraint: SQLResult = await this.knex
			.select('CONSTRAINT_NAME', 'CHECK_CLAUSE')
			.from('INFORMATION_SCHEMA.CHECK_CONSTRAINTS')
			.where({
				constraint_name: name,
			}).catch((err: Error) => { throw err })

			if (constraint.length === 0)
				return

			table.checks[name] = { column }

			const check: RawSQLResult = constraint[0]
			if (check.CHECK_CLAUSE.includes('regexp_like')) {
				table.checks[name].type = 'regexp'
				const regexp: string = check.CHECK_CLAUSE.match(/'([^']+)\\'/)
				const result: string = regexp[1].replace(/[\\]{4}/g, '\\').replace(/'/g, '')
				table.checks[name].regexp = result
			}
			else if (check.CHECK_CLAUSE.includes('length')) {
				table.checks[name].type = 'numeral'
				// eslint-disable-next-line no-useless-escape
				table.checks[name].numeralSymbol = check.CHECK_CLAUSE.match(/[\>\<\=]{1,2}/)[0]
				table.checks[name].numeralValue = parseInt(check.CHECK_CLAUSE.match(/\d+/)[0])
			} else if (check.CHECK_CLAUSE.includes('between')) {
				table.checks[name].type = 'between'
				table.checks[name].betweenValues = parseBetweenExpression(check.CHECK_CLAUSE)
			} else if (check.CHECK_CLAUSE.includes('not in')) {
				table.checks[name].type = 'not in'
				table.checks[name].inclusionValues = parseInExpression(check.CHECK_CLAUSE)
			} else if (check.CHECK_CLAUSE.includes('in')) {
				table.checks[name].type = 'in'
				table.checks[name].inclusionValues = parseInExpression(check.CHECK_CLAUSE)
			} else if (check.CHECK_CLAUSE.match(/\(`[a-zA-Z0-9_]+` (<|>) 0\)/))
				table.checks[name].type = check.CHECK_CLAUSE.includes('>') ? 'positive' : 'negative'
			// eslint-disable-next-line no-useless-escape
			table.checks[name].column = check.CHECK_CLAUSE.match(/\`([^\'\`]+)\`/)[0].replaceAll('`', '')

	}

	private async fetchUnique(table: Table, name: string): Promise<void> {
		const result = await this.knex
		.select('COLUMN_NAME')
		.from('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')
		.where({
			CONSTRAINT_NAME: name,
		})

		result.forEach((column: RawSQLResult) => table.uniques.push(column.COLUMN_NAME))
	}

	private async fetchConstraintsData(tableObj: Table): Promise<void> {
		for (const constraint in tableObj.constraints || []) {
			const obj: Constraint = tableObj.constraints[constraint]

			switch (obj.type) {

				case 'UNIQUE': {
					await this.fetchUnique(tableObj, constraint).catch((err: Error) => { throw err })
					break
				}

				case 'FOREIGN KEY': {
					await this.fetchReference(tableObj, constraint).catch((err: Error) => { throw err })
					break
				}

				case 'PRIMARY KEY': {
					tableObj.primary = obj.column
					break
				}

				case 'CHECK': {
					await this.fetchCheckConstraint(tableObj, constraint, obj.column).catch((err: Error) => { throw err })
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
			'TABLE_NAME',
			'ENGINE',
			'TABLE_SCHEMA',
			'TABLE_COLLATION',
			'TABLE_COMMENT'
		)
		.from('information_schema.tables')
		.where({
			table_schema: this.knex.client.database(),
			table_type: 'BASE TABLE',
			table_name: table
		}).catch((err: Error) => { throw err })

		const constraints: SQLResult = await this.knex
		.select('c.CONSTRAINT_NAME', 'c.CONSTRAINT_TYPE', 'k.COLUMN_NAME')
		.from('information_schema.TABLE_CONSTRAINTS as c')
		.leftJoin('INFORMATION_SCHEMA.KEY_COLUMN_USAGE as k', function () {
			this.on('c.CONSTRAINT_NAME', '=', 'k.CONSTRAINT_NAME')
			.andOn('c.TABLE_SCHEMA', '=', 'k.CONSTRAINT_SCHEMA')
		})
		.where({
			'c.table_name': table,
			'c.table_schema': this.knex.client.database(),
		}).catch((err: Error) => { throw err })

		const tableData: RawSQLResult = query[0]
		const tableObj: Table = {
			name: tableData.TABLE_NAME,
			comment: tableData.TABLE_COMMENT,
			schema: tableData.TABLE_SCHEMA,
			collation: tableData.TABLE_COLLATION,
			engine: tableData.ENGINE,
			constraints: {},
			references: {},
			checks: {},
			uniques: [],
			primary: '',
			indexes: {}
		}

		constraints.forEach((result: RawSQLResult) => tableObj.constraints[result.CONSTRAINT_NAME] = { type: result.CONSTRAINT_TYPE, column: result.COLUMN_NAME })

		await this.fetchConstraintsData(tableObj)
					.catch((err: Error) => { throw err })

		return tableObj
	}

	public async columnInfo(table: string): Promise<Array<ColumnData>> {
		const query: Knex.QueryBuilder = this.knex
		.select(
			'c.TABLE_NAME',
			'c.COLUMN_NAME',
			'c.COLUMN_DEFAULT',
			'c.COLUMN_TYPE',
			'c.CHARACTER_MAXIMUM_LENGTH',
			'c.IS_NULLABLE',
			'c.COLUMN_KEY',
			'c.EXTRA',
			'c.COLLATION_NAME',
			'c.COLUMN_COMMENT',
			'c.NUMERIC_PRECISION',
			'c.NUMERIC_SCALE',
			'c.GENERATION_EXPRESSION',
			'fk.REFERENCED_TABLE_NAME',
			'fk.REFERENCED_COLUMN_NAME',
			'fk.CONSTRAINT_NAME',
			'rc.UPDATE_RULE',
			'rc.DELETE_RULE',
			'rc.MATCH_OPTION')
			.from('INFORMATION_SCHEMA.COLUMNS as c')
			.leftJoin('INFORMATION_SCHEMA.KEY_COLUMN_USAGE as fk', function () {
					this.on('c.TABLE_NAME', '=', 'fk.TABLE_NAME')
					.andOn('fk.COLUMN_NAME', '=', 'c.COLUMN_NAME')
					.andOn('fk.CONSTRAINT_SCHEMA', '=', 'c.TABLE_SCHEMA')
			})
			.leftJoin('INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS as rc', function () {
						this.on('rc.TABLE_NAME', '=', 'fk.TABLE_NAME')
						.andOn('rc.CONSTRAINT_NAME', '=', 'fk.CONSTRAINT_NAME')
						.andOn('rc.CONSTRAINT_SCHEMA', '=', 'fk.CONSTRAINT_SCHEMA')
			})
			.where({
				'c.TABLE_SCHEMA': this.knex.client.database(),
			})

		if (table)
			query.andWhere({ 'c.TABLE_NAME': table })

		const columns: SQLResult = await query

		const columnData: Array<ColumnData> = []
		columns.forEach(async (column: RawSQLResult) => {
			const comment: string | undefined = column.COLUMN_COMMENT || undefined
			columnData.push({
				name: column.COLUMN_NAME,
				table: column.TABLE_NAME,
				data_type: (column.COLUMN_TYPE.startsWith('enum') ? 'enum' : knexTypes[column.COLUMN_TYPE as keyof typeof knexTypes] || column.COLUMN_TYPE),
				is_unsigned: column.COLUMN_TYPE.includes('unsigned'),
				default_value: column.COLUMN_DEFAULT,
				max_length: column.CHARACTER_MAXIMUM_LENGTH,
				numeric_precision: column.NUMERIC_PRECISION,
				numeric_scale: column.NUMERIC_SCALE,
				is_nullable: column.IS_NULLABLE === 'YES',
				is_unique: column.COLUMN_KEY === 'UNI',
				is_primary_key: column.CONSTRAINT_NAME === 'PRIMARY' || column.COLUMN_KEY === 'PRI',
				has_auto_increment: column.EXTRA === 'auto_increment',
				...comment && { comment },
			})
			if (column.COLUMN_DEFAULT !== null && isInt(column.COLUMN_TYPE))
				columnData[columnData.length - 1].default_value = parseInt(column.COLUMN_DEFAULT)
			if (column.COLUMN_TYPE.startsWith('enum'))
				columnData[columnData.length - 1].enum_values = this.parseEnum(column.COLUMN_TYPE)
			if (column.COLUMN_TYPE.includes('varchar'))
				columnData[columnData.length - 1].data_type = knexTypes[column.COLUMN_TYPE.replace(/\(\d+\)/g, '') as keyof typeof knexTypes] || column.COLUMN_TYPE.replace(/\(\d+\)/g, '')
			if (['date', 'timestamp', 'datetime'].includes(column.COLUMN_TYPE) && ['CURRENT_TIMESTAMP', 'curdate()'].includes(column.COLUMN_DEFAULT))
				columnData[columnData.length - 1].default_value = 'NOW'
			if (this.knex.client.constructor.name === 'Client_MySQL') {
				const collation: SQLResult = await this.knex.select('COLLATION_NAME').from('INFORMATION_SCHEMA.COLUMNS').where({
					'TABLE_SCHEMA': this.knex.client.database(),
					'TABLE_NAME': column.TABLE_NAME,
					'COLUMN_NAME': column.COLUMN_NAME
				})
				columnData[columnData.length - 1].collation = collation[0].COLLATION_NAME
			}
		})

		return columnData
	}

}
