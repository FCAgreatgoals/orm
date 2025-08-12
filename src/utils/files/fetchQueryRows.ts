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

import { DatabaseSchema } from '../../lib/types/Schema'
import { TSConfig } from '@oclif/core/lib/interfaces'
import { fetchConfig } from '../../utils/files/tsconfig'
import { searchProject } from '../../utils/files/searchProject'
import { Command } from '@oclif/core'
import translateTable from '../../lib/fetching/translateTable'
import { TableSchema } from '../../lib/types/Table'

function sortTableSchemasByReference(tableSchemas: Array<TableSchema>): Array<TableSchema> {
	const visited = new Set<string>()
	const result: Array<TableSchema> = []

	function visit(schema: TableSchema) {
		if (!visited.has(schema.name)) {
			visited.add(schema.name)
			if (schema.referencedTables) {
				schema.referencedTables.forEach(tableName => {
					const referencedSchema = tableSchemas.find(s => s.name === tableName)
					if (referencedSchema) {
						visit(referencedSchema)
					}
				})
			}
			result.push(schema)
		}
	}

	tableSchemas.forEach(visit)

	return result
}

export default async function fetchQueryRows(flags: Record<string, string>, ctx: Command): Promise<DatabaseSchema> {
	const tsconfig: TSConfig = await fetchConfig()
		.catch((err: Error) => { throw err })
	const files: Array<string> = await searchProject(flags.project)
		.catch((err: Error) => { throw err })
	const tables: DatabaseSchema = []

	for (const file of files) {
		const distFile = file.replace(flags.project, `${process.cwd()}/${tsconfig.compilerOptions.outDir}`).replace('.ts', '.js')
		const queryrow = await import(distFile).catch((err: Error) => {
			ctx.error(`There was an error: ${err.message}\nMake sure to build your TS files before running this command`)
		})
		if (queryrow.default === undefined)
			ctx.error(`The file ${file} does not have a default export`)
		
		await (new Promise((resolve) => setTimeout(resolve, 200)))

		tables.push(translateTable(Reflect.getMetadata('table:data', queryrow.default.default as any)))
	}

	return sortTableSchemasByReference(tables)
}
