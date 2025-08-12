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

import 'reflect-metadata'
import { TableData } from './Table'
import { Knex } from 'knex'
import DefaultToOptions = Knex.DefaultToOptions
import deferrableType = Knex.deferrableType
import Value = Knex.Value
import lengthOperator = Knex.lengthOperator
import generateEmptyColumn from '../fetching/generateEmptyColumn'
import { DecoratorFunction } from '../types/Decorator'

export default class ColumnOption {

    private static createDecorator(option: string, ...args: Array<any>) {
		return (target: any, propertyKey: string) => {
			const data: TableData = Reflect.getMetadata('table:data', target.constructor) || {}
			const columns = data.columns || {}
			if (!columns[propertyKey]) columns[propertyKey] = generateEmptyColumn(propertyKey)

			switch (option) {

				case 'index': {
					columns[propertyKey].customIndex = args[0]
					break
				}

				case 'primary': {
					columns[propertyKey].is_primary_key = true
					break
				}

				case 'unique': {
					if (args[0])
						columns[propertyKey].customIndex = args[0]
					columns[propertyKey].is_unique = true
					break
				}

				case 'references': {
					columns[propertyKey].foreign_key_column = args[0]
					break
				}

				case 'defaultTo': {
					columns[propertyKey].default_value = args[0]
					break
				}

				case 'unsigned': {
					columns[propertyKey].is_unsigned = true
					break
				}

				case 'nullable': {
					columns[propertyKey].is_nullable = true
					break
				}

				case 'notNullable': {
					columns[propertyKey].is_nullable = false
					break
				}

				case 'comment': {
					columns[propertyKey].comment = args[0]
					break
				}

				case 'checkPositive':
				case 'checkNegative': {
					if (option === 'checkPositive')
						columns[propertyKey].checkPositive = true
					if (option === 'checkNegative')
						columns[propertyKey].checkNegative = true
					break
				}

				case 'checkIn': {
					if (args[1])
						columns[propertyKey].checkInCustom = args[1]
					columns[propertyKey].checkIn = args[0]
					break
				}
				case 'checkNotIn': {
					if (args[1])
						columns[propertyKey].checkNotInCustom = args[1]
					columns[propertyKey].checkNotIn = args[0]
					break
				}
				case 'checkBetween': {
					if (args[1])
						columns[propertyKey].checkBetweenCustom = args[1]
					columns[propertyKey].checkBetween = args[0]
					break
				}

				case 'checkLength': {
					if (args[2])
						columns[propertyKey].checkNumeralCustom = args[2]
					columns[propertyKey].checkNumeral = `${args[0]} ${args[1]}`
					break
				}

				case 'checkRegex': {
					if (args[1])
						columns[propertyKey].checkRegexpCustom = args[1]
					columns[propertyKey].checkRegexp = args[0]
					break
				}

				case 'collate': {
					columns[propertyKey].collation = args[0]
					break
				}

			}

			Reflect.defineMetadata('table:data', {...data, columns}, target.constructor)
        }
    }

    public static Index(indexName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('index', indexName)
    }

    public static Primary(options?: Readonly<{ constraintName?: string, deferrable?: deferrableType }>): DecoratorFunction {
        return ColumnOption.createDecorator('primary', options)
    }

    public static Unique(options?: Readonly<{ indexName?: string, deferrable?: deferrableType }>): DecoratorFunction {
        return ColumnOption.createDecorator('unique', options)
    }

    public static References(columnName: string): DecoratorFunction {
        return ColumnOption.createDecorator('references', columnName)
    }

    public static DefaultTo(value: Value | null, options?: DefaultToOptions): DecoratorFunction {
        return ColumnOption.createDecorator('defaultTo', value, options)
    }

    public static Unsigned(): DecoratorFunction {
        return ColumnOption.createDecorator('unsigned')
    }

    public static NotNullable(): DecoratorFunction {
        return ColumnOption.createDecorator('notNullable')
    }

    public static Nullable(): DecoratorFunction {
        return ColumnOption.createDecorator('nullable')
    }

    public static Comment(value: string): DecoratorFunction {
        return ColumnOption.createDecorator('comment', value)
    }

    public static CheckPositive(constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkPositive', constraintName)
    }

    public static CheckNegative(constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkNegative', constraintName)
    }

    public static CheckIn(values: string[], constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkIn', values, constraintName)
    }

    public static CheckNotIn(values: string[], constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkNotIn', values, constraintName)
    }

    public static CheckBetween(values: any[] | any[][], constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkBetween', values, constraintName)
    }

    public static CheckLength(operator: lengthOperator, length: number, constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkLength', operator, length, constraintName)
    }

    public static CheckRegex(regex: string, constraintName?: string): DecoratorFunction {
        return ColumnOption.createDecorator('checkRegex', regex, constraintName)
    }

    public static Collate(collation: string): DecoratorFunction {
        return ColumnOption.createDecorator('collate', collation)
    }
}
