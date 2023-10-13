import 'reflect-metadata'
import { TableData } from '@lib/decorators/Table'
import { Knex } from 'knex'
import deferrableType = Knex.deferrableType
import generateEmptyColumn from '@lib/fetching/generateEmptyColumn'
import { DecoratorFunction } from '@lib/types/Decorator'

export default class ReferenceOption {

    private static createDecorator(option: string, ...args: Array<any>) {
        return (target: any, propertyKey: string) => {
			const data: TableData = Reflect.getMetadata('table:data', target.constructor) || {}
			const columns = data.columns || {}
			if (!columns[propertyKey]) columns[propertyKey] = generateEmptyColumn(propertyKey)

			switch (option) {

				case 'inTable': {
					columns[propertyKey].foreign_key_table = args[0]
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
