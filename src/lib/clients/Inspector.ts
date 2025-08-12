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

export type ClientType = 'mysql' | 'postgres'

export default abstract class Inspector {

	public abstract client_type: ClientType

	abstract tables(): Promise<string[]>
	abstract tables(schemaName: string): Promise<string[]>

	abstract tableInfo(tableName: string): Promise<any>
	abstract tableInfo(tableName: string, schemaName: string): Promise<any>

	abstract columnInfo(tableName: string): Promise<any>
	abstract columnInfo(tableName: string, schemaName: string): Promise<any>

}
