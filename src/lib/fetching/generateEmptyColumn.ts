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

import { ColumnData } from '../types/Column'

export default function generateEmptyColumn(columnName: string): Partial<ColumnData> {
	return {
		name: columnName,
		default_value: null,
		max_length: null,
		numeric_precision: null,
		numeric_scale: null,
		is_nullable: true,
		is_unique: false,
		is_primary_key: false,
		has_auto_increment: false,
		is_unsigned: false,
	}
}
