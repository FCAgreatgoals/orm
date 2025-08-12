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
