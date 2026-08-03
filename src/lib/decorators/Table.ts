/**
 * This file is part of @fca.gg/orm (https://github.com/FCAgreatgoals/orm).
 *
 * Copyright (C) 2026 SAS French Community Agency
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
 *
 * Additional permission under the AGPL-3.0 section 7:
 * You may use this library as a dependency in your own application without
 * your application being subject to the AGPL-3.0. Only modifications to
 * @fca.gg/orm itself must be made publicly available. See LINKING_EXCEPTION.md
 * for full details.
 */

import 'reflect-metadata'
import { Join } from './Join'
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
