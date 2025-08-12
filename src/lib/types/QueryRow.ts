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

type Operator =
    | '='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'LIKE'
    | 'NOT LIKE'
    | 'IN'
    | 'NOT IN'

type OperatorWithoutValue = 'IS NULL' | 'IS NOT NULL'

type ValueType = string | number | boolean | Date

type ConditionValue = ValueType | Array<ValueType>

export type WhereObject = { [column: string]: [Operator, ConditionValue] | [OperatorWithoutValue] | ValueType }

type Order = 'asc' | 'desc'
type Nulls = 'first' | 'last'
export type OrderBy = { [column: string]: [Order, Nulls] | Order }

export type FindAllOptions = {
	limit?: number,
	offset?: number,
	orderBy?: OrderBy
}
