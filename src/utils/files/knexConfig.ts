import { Command } from '@oclif/core'

export type KnexProfile = {
	client: string,
	connection: {
		host: string,
		user: string,
		password: string,
		database: string,
	},
	pool?: {
		min: number,
		max: number,
	},
	migrations: {
		tableName: string,
		directory?: string,
	},
}

export async function fetchKnexConfig(ctx?: Command): Promise<KnexProfile> {

	const knexConfig: any = await import(`${process.cwd()}/knexfile.js`)
		.catch((err) => {
			if (ctx)
				ctx.error('Could not find knexfile.js in the current directory')
			else throw err
		})

	return knexConfig.default as KnexProfile
}
