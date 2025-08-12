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

import { ClientType } from 'lib/clients/Inspector'
import { ColumnData } from '../types/Column'
import { DiffResult } from '../types/DiffResult'

export default function compareColumnData(obj1: Partial<ColumnData>, obj2: ColumnData, type: ClientType): DiffResult | null {
	const keys1: Array<string> = Object.keys(obj1)
	const keys2: Array<string> = Object.keys(obj2)

	const addedKeys: Array<string> = keys2.filter(key => !keys1.includes(key))
	const modifiedKeys: Array<string> = keys2.filter(key => keys1.includes(key) &&
		obj1[key as keyof ColumnData] !== obj2[key as keyof ColumnData] &&
		((key !== 'enum_values' && key !== 'checkIn') || JSON.stringify(obj1[key as keyof ColumnData]) !== JSON.stringify(obj2[key as keyof ColumnData])))
	const deletedKeys: Array<string> = keys1.filter(key => !keys2.includes(key))

	if (addedKeys.length + modifiedKeys.length + deletedKeys.length === 0)
		return null

	const result: DiffResult = {}

	addedKeys.forEach(key => {
		result[key] = {
			newValue: obj2[key as keyof ColumnData],
			type: 'added'
		}
	})

	modifiedKeys.forEach(key => {
		if (key === 'numeric_precision' && obj2[key as keyof ColumnData] === null) return

		if (key === 'max_length' && type === 'mysql' && obj2[key as keyof ColumnData] === null) return

		if (key === 'is_unsigned' && type !== 'mysql') return

		if (key === 'numeric_precision' && obj2.data_type === 'boolean') return

		if (key === 'numeric_scale' && obj2.data_type === 'boolean') return

		if (key === 'default_value' && obj2.data_type === 'text') return

		if (key === 'default_value' && type === 'mysql' && obj2[key as keyof ColumnData] === null && obj1[key as keyof ColumnData] === 'NOW' && obj2.data_type === 'timestamp') return

		result[key] = {
			newValue: obj2[key as keyof ColumnData],
			type: 'modified'
		}
	})

	deletedKeys.forEach(key => {
		if (key === 'collation') return

		if (key === 'onUpdate' && type === 'mysql' && obj1[key as keyof ColumnData] === 'RESTRICT' && obj2.data_type === 'integer') return

		result[key] = {
			newValue: null,
			type: 'deleted'
		}
	})

	return (Object.keys(result).length > 0) ? result : null
}
