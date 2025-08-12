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

import { Stats } from 'fs'
import { readdir, stat } from 'fs/promises'

/**
 * @function searchRecursively
 *
 * @description Search recursively through a directory for QueryRow classes files
 *
 * @param directory Directory to search through
 * @param result Array of paths to QueryRow classes files
 */
async function searchRecursively(directory: string, result: string[]): Promise<void> {
	const files: Array<string> = await readdir(directory).catch((err: Error) => { throw err })

	for (const file of files) {
		const filePath: string = `${directory}/${file}`
		const fileStats: Stats = await stat(filePath).catch((err: Error) => { throw err })

		if (fileStats.isDirectory())
			await searchRecursively(filePath, result)
				.catch((err: Error) => { throw err })
		else if (file.match(/\w+QueryRow\.ts/))
			result.push(filePath)
	}
}

/**
 * @function searchProject
 * @description Search through the whole project for QueryRow classes files
 *
 * @param {string} projectPath Path to the project
 *
 * @returns {Promise<Array<string>>} All paths to the QueryRow files found in the project in order
 */
export async function searchProject(projectPath: string): Promise<Array<string>> {
	const result: Array<string> = []

	await searchRecursively(projectPath, result)
		.catch((err: Error) => { throw err })

	return result

}
