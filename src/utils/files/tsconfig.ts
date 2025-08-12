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

import { readFile } from 'fs/promises'

type TSConfig = {
	compilerOptions: {
		baseUrl: string
		paths: Record<string, Array<string>>
		outDir: string
		rootDir: string
	},
	include: Array<string>
	files: Array<string>
}

export async function fetchConfig(): Promise<TSConfig> {
	const configFile = (await readFile('./tsconfig.json', 'utf-8')).replace(/\n/g, '')
	if (!configFile)
		throw new Error('tsconfig.json not found')
	return JSON.parse(configFile) as TSConfig
}
