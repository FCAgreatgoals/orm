import 'reflect-metadata'
import { TableData } from './Table'

export type TransformDecoratorOptions = {
    propertyKey?: string,
    fn: (val: any) => any
}
export default class Transform {

    private static createDecorator(type: 'hydrate' | 'dehydrate', options: TransformDecoratorOptions) {
        return (target: any, propertyKey: string) => {
            const tableData: TableData = Reflect.getMetadata('table:data', target.constructor) || {}
            const data = tableData[type] || {}

            data[propertyKey] = options

            Reflect.defineMetadata('table:data', {...tableData, [type]: data}, target.constructor)
        }
    }

	private static parametersToOptions(fnOrPropertyKey: string | ((val: any) => any), fn?: (val: any) => any): TransformDecoratorOptions {
		const isFunction = typeof fnOrPropertyKey === 'function'
		return {
			propertyKey: isFunction ? undefined : fnOrPropertyKey as string,
			fn: isFunction ? fnOrPropertyKey as (val: any) => any : fn as (val: any) => any
		}
	}

    public static Hydrate(fn: (val: any) => any): any
    public static Hydrate(propertyKey: string, fn: (val: any) => any): any
    public static Hydrate(fnOrPropertyKey: string | ((val: any) => any), fn?: (val: any) => any): any {
		return Transform.createDecorator('hydrate', Transform.parametersToOptions(fnOrPropertyKey, fn))
    }

	public static DeHydrate(fn: (val: any) => any): any
	public static DeHydrate(propertyKey: string, fn: (val: any) => any): any
    public static DeHydrate(fnOrPropertyKey: string | ((val: any) => any), fn?: (val: any) => any): any {
		return Transform.createDecorator('dehydrate', Transform.parametersToOptions(fnOrPropertyKey, fn))
    }
}
