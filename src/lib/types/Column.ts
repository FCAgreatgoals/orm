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

export type ColumnData = {
	name: string;
	table: string;
	data_type: string;
	default_value: string | number | boolean | null;
	max_length: number | null;
	numeric_precision: number | null;
	numeric_scale: number | null;
	enum_values?: Array<string>;

	binaryUuid?: boolean;
	useTz?: boolean;

	is_unsigned?: boolean;

	is_nullable: boolean;
	is_unique?: boolean;
	is_primary_key?: boolean;
	is_generated?: boolean;
	generation_expression?: string | null;
	has_auto_increment?: boolean;

	foreign_key_table?: string | null;
	foreign_key_column?: string | null;
	onDelete?: string | null;
	onUpdate?: string | null;

	checkIn?: Array<string | number>;
	checkNotIn?: Array<string | number>;
	checkBetween?: Array<number | Array<number>>;
	checkRegexp?: string;
	checkNumeral?: string;
	checkPositive?: boolean;
	checkNegative?: boolean;

	checkInCustom?: string;
	checkNotInCustom?: string;
	checkBetweenCustom?: string;
	checkRegexpCustom?: string;
	checkNumeralCustom?: string;
	checkPositiveCustom?: string;
	checkNegativeCustom?: string;

	customIndex?: string;

	collation?: string | null;

	// Not supported in SQLite or MSSQL
	comment?: string | null;

	// Postgres Only
	schema?: string;
	foreign_key_schema?: string | null;
	constraintDeferred?: boolean;
}
