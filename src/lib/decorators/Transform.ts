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

    public static Hydrate(fn: (val: any) => any): any
    public static Hydrate(propertyKey: string, fn: (val: any) => any): any
    public static Hydrate(fnOrPropertyKey: string | ((val: any) => any), fn?: (val: any) => any): any {
        const isFunction = typeof fnOrPropertyKey === 'function'
        const options: TransformDecoratorOptions = {
            propertyKey: isFunction ? undefined : fnOrPropertyKey as string,
            fn: isFunction ? fnOrPropertyKey as (val: any) => any : fn as (val: any) => any
        }

        return Transform.createDecorator('hydrate', options)
    }

    public static DeHydrate(fn: (val: any) => any): any {
        return Transform.createDecorator('dehydrate', { fn })
    }
}
