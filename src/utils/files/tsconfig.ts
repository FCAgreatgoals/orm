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
