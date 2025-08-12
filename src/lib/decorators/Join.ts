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
