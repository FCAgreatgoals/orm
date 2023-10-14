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
