import 'reflect-metadata'
import { Join } from '@lib/decorators/Join'
import { TransformDecoratorOptions } from './Transform'

export type TableData = {
    name?: string,
    columns?: Record<string, any>,
    joins?: Array<Join>,
	referencedTables: Array<string>,
    hydrate?: Record<string, TransformDecoratorOptions>,
    dehydrate?: Record<string, TransformDecoratorOptions>,
}

export default function Table(name: string) {
    return (target: Record<string, any>): void => {
		const data: TableData = Reflect.getMetadata('table:data', target) || {}
		data.name = name
		data.joins = data.joins || []
		Object.keys(data.columns || {}).forEach(key => {
			(data.columns as Record<string, any>)[key].table = name
		})

		Reflect.defineMetadata('table:data', data, target)
    }
}
