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
import deferrableType = Knex.deferrableType
import generateEmptyColumn from '../fetching/generateEmptyColumn'
import { DecoratorFunction } from '../types/Decorator'

export default class ReferenceOption {

    private static createDecorator(option: string, ...args: Array<any>) {
        return (target: any, propertyKey: string) => {
			const data: TableData = Reflect.getMetadata('table:data', target.constructor) || {}
			const columns = data.columns || {}
			if (!columns[propertyKey]) columns[propertyKey] = generateEmptyColumn(propertyKey)

			switch (option) {

				case 'inTable': {
					columns[propertyKey].foreign_key_table = args[0]
					if (!data.referencedTables) data.referencedTables = []
					
					data.referencedTables.push(args[0])
					break
				}

				case 'deferrable': {
					columns[propertyKey].constraintDeferred = true
					break
				}

				case 'withKeyName': {
					columns[propertyKey].foreign_key_column = args[0]
					break
				}

				case 'onDelete': {
					columns[propertyKey].onDelete = args[0]
					break
				}

				case 'onUpdate': {
					columns[propertyKey].onUpdate = args[0]
					break
				}

			}


			Reflect.defineMetadata('table:data', {...data, columns}, target.constructor)
        }
    }

    public static InTable(tableName: string): DecoratorFunction {
        return ReferenceOption.createDecorator('inTable', tableName)
    }

    public static Deferrable(deferrable: deferrableType): DecoratorFunction {
        return ReferenceOption.createDecorator('deferrable', deferrable)
    }

    public static WithKeyName(keyName: string): DecoratorFunction {
        return ReferenceOption.createDecorator('withKeyName', keyName)
    }

    public static OnDelete(command: string): DecoratorFunction {
        return ReferenceOption.createDecorator('onDelete', command)
    }

    public static OnUpdate(command: string): DecoratorFunction {
        return ReferenceOption.createDecorator('onUpdate', command)
    }

}
