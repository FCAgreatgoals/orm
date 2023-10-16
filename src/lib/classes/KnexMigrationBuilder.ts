import { ColumnData } from '../types/Column'
import { DiffResult } from '../types/DiffResult'
import { DatabaseSchema, SchemaDiff } from '../types/Schema'
import { TableDiff } from '../types/Table'

const defaultLines = {
	EXPORT_UP: 'exports.up = knex =>',
	EXPORT_DOWN: 'exports.down = knex =>',
	CLOSING_BRACKET: '\t})',
	UPDATE_TABLE: '\tknex.schema.table(tableName, table => {',
	CREATE_TABLE: '\tknex.schema.createTableIfNotExists(tableName, table => {',
	DELETE_TABLE: '\tknex.schema.dropTableIfExists(tableName)'
}

export const knexTypes = {
	'integer': 'integer',
	'int unsigned': 'integer',
	'int': 'integer',
	'bigint': 'bigInteger',
	'bigint unsigned': 'bigInteger',
	'tinyint unsigned': 'tinyint',
	'tinyint': 'tinyint',
	'mediumint unsigned': 'mediumint',
	'mediumint': 'mediumint',
	'float': 'float',
	'double': 'double',
	'decimal': 'decimal',
	'boolean': 'boolean',
	'varchar': 'string',
	'character varying': 'string',
	'text': 'text',
	'date': 'date',
	'datetime': 'datetime',
	'timestamp': 'timestamp',
	'time': 'time',
	'time with time zone': 'time',
	'time without time zone': 'time',
	'timestamp with time zone': 'timestamp',
	'timestamp without time zone': 'timestamp',
	'binary': 'binary',
	'json': 'json',
	'jsonb': 'jsonb',
	'uuid': 'uuid',
	'enum': 'enum',
}

export type KnexMigration = {
	name: string
	content: string
	diff?: TableDiff
}

export default class KnexMigrationBuilder {

	private diff: SchemaDiff = []
	private schema: DatabaseSchema = []
	private migrations: Array<KnexMigration> = []
	private oldSchema: DatabaseSchema = []
	private database: 'mysql' | 'postgres'

	constructor (diff: SchemaDiff, schema: DatabaseSchema, old: DatabaseSchema, database: 'mysql' | 'postgres') {
		this.diff = diff
		this.schema = schema
		this.oldSchema = old
		this.database = database

		for (const table of this.diff) {
			this.migrations.push({ name: table.name, content: this.build(table.name), diff: table })
		}
	}

	private generateColumnInitializer(column: ColumnData): string {
		let string: string = `${(column.has_auto_increment) ? 'increments' : column.data_type}('${column.name}'`

		if (['string', 'integer', 'tinyint', 'binary'].includes(column.data_type as never) && column.max_length && !(column.data_type === 'string' && column.max_length === 255)) {
			string += `, ${column.max_length}`
		} else if (['float', 'double', 'decimal'].includes(column.data_type as never) && column.numeric_precision) {
			string += `, ${column.numeric_precision}`
			if (column.numeric_scale)
				string += `, ${column.numeric_scale}`
		} else if (['datetime', 'timestamp'].includes(column.data_type as never) && column.useTz) {
			string += ', { useTz: true }'
		} else if (column.data_type === 'enum' && column.enum_values) {
			string += `, ['${column.enum_values.join('\', \'')}'], { useNative: true, enumName: '${column.table}_${column.name}' }`
		} else if (column.data_type === 'uuid' && column.binaryUuid) {
			string += ', { binaryUuid: true }'
		}

		string += ')'
		return string
	}

	private generateColumnInstructions(column: DiffResult, data: ColumnData): string {
		const lines: Array<string> = ['\t\ttable.']
		lines.push(this.generateColumnInitializer(data))
		if (data.is_unsigned)
			lines.push('.unsigned()')
		if (data.is_nullable)
			lines.push('.nullable()')
		if (data.is_nullable === false)
			lines.push('.notNullable()')
		if (data.is_primary_key)
			lines.push('.primary()')
		if (data.is_unique)
			lines.push('.unique()')
		if (data.default_value !== null) {
			const defaultValueLine = data.default_value.constructor === String
				? `.defaultTo('${data.default_value}')`
				: `.defaultTo(${data.default_value})`

			if (['timestamp', 'datetime', 'date', 'time'].includes(data.data_type as never) && data.default_value === 'NOW')
				lines.push((['date', 'time'].includes(data.data_type as never) && this.database !== 'postgres') ? '.defaultTo(knex.raw(\'(CURRENT_DATE())\'))' : '.defaultTo(knex.fn.now())')
			else lines.push(defaultValueLine)
		}
		if (data.foreign_key_table && data.foreign_key_column)
			lines.push(`.references('${data.foreign_key_column}').inTable('${data.foreign_key_table}')`)
		if (data.onUpdate)
			lines.push(`.onUpdate('${data.onUpdate}')`)
		if (data.onDelete)
			lines.push(`.onDelete('${data.onDelete}')`)
		if (data.constraintDeferred)
			lines.push('.deferrable()')
		if (data.checkIn)
			lines.push(`.checkIn([${data.checkIn.map(value => `'${value}'`).join(', ')}]${(data.checkInCustom) ? `, '${data.checkInCustom}'` : ''})`)
		if (data.checkNotIn)
			lines.push(`.checkNotIn([${data.checkNotIn.map(value => `'${value}'`).join(', ')}]${(data.checkNotInCustom) ? `, '${data.checkNotInCustom}'` : ''})`)
		if (data.checkBetween)
			lines.push(`.checkBetween([${data.checkBetween.map(value => `'${value}'`).join(', ')}]${(data.checkBetweenCustom) ? `, '${data.checkBetweenCustom}'` : ''})`)
		if (data.checkRegexp)
			lines.push(`.checkRegex('${data.checkRegexp.replace(/\\/g, '\\\\')}'${(data.checkRegexpCustom) ? `, '${data.checkRegexpCustom}'` : ''})`)
		if (data.checkNumeral)
			lines.push(`.checkLength('${data.checkNumeral.split(' ')[0]}', ${parseInt(data.checkNumeral.split(' ')[1])}${(data.checkNumeralCustom) ? `, '${data.checkNumeralCustom}'` : ''})`)
		if (data.checkPositive)
			lines.push('.checkPositive()')
		if (data.checkNegative)
			lines.push('.checkNegative()')
		if (data.comment)
			lines.push(`.comment('${data.comment}')`)
		if (column.name?.type !== 'added')
			lines.push('.alter()')

		return lines.join('')
	}

	private generateReverseColumnInstructions(column: DiffResult, data: ColumnData, isTableDeleted: boolean): string {
		if (column.name?.type === 'added')
			return `\t\ttable.dropColumn('${column.name?.newValue}')`
		const lines: Array<string> = ['\t\ttable.']
		lines.push(this.generateColumnInitializer(data))
		if (data.is_unsigned)
			lines.push('.unsigned()')
		if (data.is_nullable)
			lines.push('.nullable()')
		if (data.is_nullable === false)
			lines.push('.notNullable()')
		if (data.default_value !== null) {
			const defaultValueLine = data.default_value.constructor === String
				? `.defaultTo('${data.default_value}')`
				: `.defaultTo(${data.default_value})`

			if (['timestamp', 'datetime', 'date'].includes(data.data_type as never) && data.default_value === 'NOW')
				lines.push((data.data_type === 'date') ? '.defaultTo(knex.raw(\'(CURRENT_DATE())\'))' : '.defaultTo(knex.fn.now())')
			else lines.push(defaultValueLine)
		}
		if (data.is_primary_key)
			lines.push('.primary()')
		if (data.is_unique)
			lines.push('.unique()')
		if (data.foreign_key_table && data.foreign_key_column)
			lines.push(`.references('${data.foreign_key_column}').inTable('${data.foreign_key_table}')`)
		if (data.onUpdate)
			lines.push(`.onUpdate('${data.onUpdate}')`)
		if (data.onDelete)
			lines.push(`.onDelete('${data.onDelete}')`)
		if (data.constraintDeferred)
			lines.push('.deferrable()')
		if (data.checkIn)
			lines.push(`.checkIn([${data.checkIn.map(value => `'${value}'`).join(', ')}]${(data.checkInCustom) ? `, '${data.checkInCustom}'` : ''})`)
		if (data.checkNotIn)
			lines.push(`.checkNotIn([${data.checkNotIn.map(value => `'${value}'`).join(', ')}]${(data.checkNotInCustom) ? `, '${data.checkNotInCustom}'` : ''})`)
		if (data.checkBetween)
			lines.push(`.checkBetween([${data.checkBetween.map(value => `'${value}'`).join(', ')}]${(data.checkBetweenCustom) ? `, '${data.checkBetweenCustom}'` : ''})`)
		if (data.checkRegexp)
			lines.push(`.checkRegex('${data.checkRegexp.replace(/\\/g, '\\\\')}'${(data.checkRegexpCustom) ? `, '${data.checkRegexpCustom}'` : ''})`)
		if (data.checkNumeral)
			lines.push(`.checkLength('${data.checkNumeral.split(' ')[0]}', ${parseInt(data.checkNumeral.split(' ')[1])}${(data.checkNumeralCustom) ? `, '${data.checkNumeralCustom}'` : ''})`)
		if (data.checkPositive)
			lines.push('.checkPositive()')
		if (data.checkNegative)
			lines.push('.checkNegative()')
		if (data.comment)
			lines.push(`.comment('${data.comment}')`)
		if (!isTableDeleted)
			lines.push('.alter()')
		return lines.join('')
	}

	private buildUp(table: TableDiff, lines: Array<string>): Array<string> {
		const tableName: string = table.name
		if (table?.type == 'deleted') {
			lines.push(defaultLines.DELETE_TABLE, '\n')
			return lines
		}
		if (table?.type == 'added')
			lines.push(defaultLines.CREATE_TABLE)
		else
			lines.push(defaultLines.UPDATE_TABLE)

		for (const column in table?.columns) {
			const columnDiff: DiffResult = table?.columns[column]
			const columnData = this.schema.find(table => table.name === tableName)?.columns.find(columnData => columnData.name === column) as ColumnData

			lines.push(this.generateColumnInstructions(columnDiff, columnData))

		}
		for (const column of table?.deletedColumns) {
			const columnData: ColumnData | undefined = this.oldSchema.find(table => table.name === tableName)?.columns.find(columnData => columnData.name === column)
			if (columnData !== undefined)
				lines.push(`\t\ttable.dropColumn('${columnData.name}')`)

		}

		lines.push(defaultLines.CLOSING_BRACKET, '\n')

		return lines
	}

	private buildDown(table: TableDiff, lines: Array<string>): Array<string> {
		const tableName: string = table.name
		lines.push(defaultLines.EXPORT_DOWN)

		if (table?.type == 'added')
			lines.push(defaultLines.DELETE_TABLE)
		else {
			lines.push((table?.type === 'deleted') ? defaultLines.CREATE_TABLE : defaultLines.UPDATE_TABLE)
			for (const column in table?.columns) {
				const columnDiff: DiffResult = table?.columns[column]
				const columnData: ColumnData | undefined = this.oldSchema.find(table => table.name === tableName)?.columns.find(columnData => columnData.name === column)

				lines.push(this.generateReverseColumnInstructions(columnDiff, columnData as ColumnData, (table?.type === 'deleted')))
			}
			for (const column of table?.deletedColumns) {
				const columnData: ColumnData | undefined = this.oldSchema.find(table => table.name === tableName)?.columns.find(columnData => columnData.name === column)
				if (columnData !== undefined)
					lines.push(this.generateReverseColumnInstructions({ name: { newValue: null, type: 'deleted' } }, columnData, true))

			}
			lines.push(defaultLines.CLOSING_BRACKET)
		}
		return lines
	}

	public build(tableName: string): string {
		const lines: Array<string> = [`const tableName = '${tableName}'\n`, defaultLines.EXPORT_UP]
		const table = this.diff.find(table => table.name === tableName) as TableDiff
		if (table?.columns === undefined)
			return ''

		this.buildUp(table, lines)
		this.buildDown(table, lines)

		return lines.join('\n')
	}

	public getMigrations(): Array<KnexMigration> {
		return this.migrations
	}

	public getMigration(tableName: string): KnexMigration {
		if (!this.migrations.find(migration => migration.content.includes(tableName)))
			throw new Error(`No migration found for table ${tableName}`)
		return this.migrations.find(migration => migration.content.includes(tableName)) as KnexMigration
	}

}
