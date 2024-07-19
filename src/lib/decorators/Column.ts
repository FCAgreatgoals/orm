import 'reflect-metadata'
import { knexTypes, postgreKnexTypes } from '../classes/KnexMigrationBuilder'
import { TableData } from './Table'
import { Knex } from 'knex'
import Value = Knex.Value
import EnumOptions = Knex.EnumOptions
import generateEmptyColumn from '../fetching/generateEmptyColumn'
import { DecoratorFunction } from '../types/Decorator'
import { fetchKnexConfig } from '../../utils/files/knexConfig'

export default class Column {

    private static createDecorator(type: string, ...args: Array<any>) {
        return async (target: any, propertyKey: string) => {
            const cfg = await fetchKnexConfig()
            const isPostgre = ['pg', 'postgresql'].includes(cfg.client)

			const data: TableData = Reflect.getMetadata('table:data', target.constructor) || {}
            const columns = data.columns || {}

			if (!columns[propertyKey]) columns[propertyKey] = generateEmptyColumn(propertyKey)

            columns[propertyKey].data_type = isPostgre ? postgreKnexTypes[type as keyof typeof postgreKnexTypes] : knexTypes[type as keyof typeof knexTypes]

			switch (type) {

                case 'increment': {
                    if (!isPostgre && columns[propertyKey].name !== 'id') {
                        throw new Error('Cannot create another `increment` column in MySQL.')
                    }
					columns[propertyKey].has_auto_increment = true
                    columns[propertyKey].numeric_scale = 0
                    columns[propertyKey].is_nullable = false
					columns[propertyKey].data_type = 'integer'
                    if (args[0]?.primaryKey) columns[propertyKey].is_primary_key = args[0].primaryKey
					break
				}

				case 'integer':
                case 'tinyint':
                case 'smallint':
                case 'mediumint': {
					columns[propertyKey].numeric_scale = 0
					if (args[0])
						columns[propertyKey].max_length = args[0]
					break
                }

                case 'binary': {
					if (args[0])
						columns[propertyKey].max_length = args[0]
					break
                }

				case 'varchar': {
					if (args[0])
						columns[propertyKey].max_length = args[0]
					else columns[propertyKey].max_length = 255
					break
                }

                case 'bigint': {
                    columns[propertyKey].numeric_scale = 0
                    columns[propertyKey].numeric_precision = isPostgre ? 64 : 19
                    break
                }

				case 'float': {
                    columns[propertyKey].numeric_precision = args[0] ?? isPostgre ? 24 : 8
					columns[propertyKey].numeric_scale = args[1] ?? isPostgre ? null : 2
					break
                }

                case 'double': {
					columns[propertyKey].numeric_precision = args[0] ?? isPostgre ? 53 : 22
					columns[propertyKey].numeric_scale = args[1] ?? isPostgre ? null : 2
					break
                }

                case 'decimal': {
                    columns[propertyKey].numeric_precision = args[0] ?? 8
                    columns[propertyKey].numeric_scale = args[1] ?? 2
                    break
                }

				case 'datetime':
				case 'timestamp': {
					if (args[0]?.useTz) columns[propertyKey].useTz = args[0].useTz
					if (args[0]?.precision) columns[propertyKey].numeric_precision = args[0].precision
					break
				}

				case 'enum': {
					columns[propertyKey].enum_values = args[0]
					break
				}

				case 'uuid': {
					if (args[0]?.useBinaryUuid) columns[propertyKey].binaryUuid = args[0].useBinaryUuid
					if (args[0]?.primaryKey) columns[propertyKey].is_primary_key = args[0].primaryKey
                }

            }

            Reflect.defineMetadata('table:data', { ...data, columns }, target.constructor)
        }
    }

    public static Increment(options?: { primaryKey?: boolean }): DecoratorFunction {
        return Column.createDecorator('increment', options)
    }

    public static Integer(length?: number): DecoratorFunction {
        return Column.createDecorator('integer', length)
    }

    public static Tinyint(length?: number): DecoratorFunction {
        return Column.createDecorator('tinyint', length)
    }

    public static Smallint(): DecoratorFunction {
        return Column.createDecorator('smallint')
    }

    public static Mediumint(): DecoratorFunction {
        return Column.createDecorator('mediumint')
    }

    public static Bigint(): DecoratorFunction {
        return Column.createDecorator('bigint')
    }

    public static BigInteger(): DecoratorFunction {
        return Column.createDecorator('bigint')
    }

    public static Text(textType?: 'longtext' | 'mediumtext' | 'text'): DecoratorFunction {
        return Column.createDecorator('text', textType)
    }

    public static String(length?: number): DecoratorFunction {
        return Column.createDecorator('varchar', length)
    }

    public static Float(precision?: number, scale?: number): DecoratorFunction {
        return Column.createDecorator('float', precision, scale)
    }

    public static Double(precision?: number, scale?: number): DecoratorFunction {
        return Column.createDecorator('double', precision, scale)
    }

    public static Decimal(precision?: number, scale?: number): DecoratorFunction {
        return Column.createDecorator('decimal', precision, scale)
    }

    public static Boolean(): DecoratorFunction {
        return Column.createDecorator('boolean')
    }

    public static Date(): DecoratorFunction {
        return Column.createDecorator('date')
    }

    public static DateTime(options?: Readonly<{ useTz?: boolean; precision?: number }>): DecoratorFunction {
        return Column.createDecorator((options?.useTz) ? 'datetime' : 'timestamp', options)
    }

    public static Time(): DecoratorFunction {
        return Column.createDecorator('time')
    }

    public static Timestamp(options?: Readonly<{ useTz?: boolean; precision?: number }>): DecoratorFunction {
        return Column.createDecorator('timestamp', options)
    }

    public static Point(): DecoratorFunction {
        return Column.createDecorator('point')
    }

    public static Binary(length?: number): DecoratorFunction {
        return Column.createDecorator('binary', length)
    }

    public static Enum(values?: Readonly<Array<Value>> | null, options?: EnumOptions): DecoratorFunction {
        return Column.createDecorator('enum', values, options)
    }

    public static Enu(values?: Readonly<Array<Value>> | null, options?: EnumOptions): DecoratorFunction {
        return Column.createDecorator('enum', values, options)
    }

    public static Json(): DecoratorFunction {
        return Column.createDecorator('json')
    }

    public static Jsonb(): DecoratorFunction {
        return Column.createDecorator('jsonb')
    }

    public static Uuid(options?: Readonly<{ useBinaryUuid?: boolean; primaryKey?: boolean }>): DecoratorFunction {
        return Column.createDecorator('uuid', options)
    }

}
