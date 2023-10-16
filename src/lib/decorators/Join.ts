import 'reflect-metadata'
import QueryRow from '../classes/QueryRow'
import { TableData } from '../decorators/Table'

type JoinOptions = {
	type?: 'INNER' | 'LEFT' | 'RIGHT' | 'LEFT OUTER' | 'RIGHT OUTER',
	alias?: string,
	operator?: string,
	references?: string,
}

export type Join = {
	propertyKey: string,
	type: JoinOptions['type'],
	table: {
		name: string,
		ref: typeof QueryRow
	},
	alias?: JoinOptions['alias'],
	column: string,
	operator?: JoinOptions['operator'],
	references?: JoinOptions['references'],
}

export default function Join(table: typeof QueryRow, key: string, options?: JoinOptions): any
export default function Join(table: typeof QueryRow, options?: JoinOptions): any
export default function Join(table: typeof QueryRow, keyOrOptions: string | JoinOptions = {}, options: JoinOptions = {}): any {
    return (target: any, propertyKey: string) => {
        const data: TableData = Reflect.getMetadata('table:data', target.constructor)
        const joins = data?.joins || []

        const key = typeof keyOrOptions === 'string' ? keyOrOptions : `${propertyKey}_id`
        const opt = typeof keyOrOptions === 'object' ? keyOrOptions : options

        const joinTableData: TableData = Reflect.getMetadata('table:data', table)
        joins.push({
			propertyKey,
            type: opt.type || 'INNER',
            table: {
                name: joinTableData.name as string,
                ref: table
            },
            ...(opt.alias ? { alias: opt.alias } : {}),
            column: key,
            ...(opt.operator ? { operator: opt.operator } : {}),
            ...(opt.references ? { references: opt.references } : {}),
        })

        Reflect.defineMetadata('table:data', {...data, joins}, target.constructor)
    }
}
