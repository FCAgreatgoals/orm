import { KnexProfile, fetchKnexConfig } from '../../utils/files/knexConfig'
import knex, { Knex } from 'knex'

export default class KnexInstance {

	private static knex: Knex | undefined

	public static get(): Knex {
		if (!KnexInstance.knex) throw new Error('KnexInstance not initialized')

		return KnexInstance.knex
	}

	public static async init(): Promise<void> {
		if (!KnexInstance.knex)
			await this.spawnKnex()
				.catch((err: Error) => { throw err })
	}

	public static destroy(): void {
		if (KnexInstance.knex) KnexInstance.knex?.destroy()
	}

	private static async spawnKnex(): Promise<void> {
		const knexConfig: KnexProfile = await fetchKnexConfig()
			.catch((err: Error) => { throw err })

		this.knex = knex(knexConfig)
	}

}
