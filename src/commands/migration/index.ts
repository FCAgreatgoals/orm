import KnexMigrationBuilder from '@lib/classes/KnexMigrationBuilder'
import compareDatabaseSchema from '@lib/fetching/compareDatabaseSchema'
import { DatabaseSchema, SchemaDiff } from '@lib/types/Schema'
import { writeMigrationFiles } from '@lib/fetching/writeMigrationFiles'
import { Command, Flags } from '@oclif/core'
import { Warning, blue } from '@utils/strings/colors'
import databaseConnectionHandle from '@utils/database/databaseConnectionHandle'
import fetchQueryRows from '@utils/files/fetchQueryRows'
import prompts = require('prompts') // require because of outdated definition
import { exec as execSync } from 'child_process'
import checkForUnpushedMigrations from '@utils/database/checkForUnpushedMigrations'
import * as dotenv from 'dotenv'
import { promisify } from 'util'

const exec = promisify(execSync)

export default class Generate extends Command {

	static description = 'Create a new table'

	static examples = [
		'$ orm migration',
	]

	static args = {}

	static flags = {
		project: Flags.directory({ char: 'p', description: 'Project directory', required: false, default: process.cwd()+ '/src' }),
		runMigration: Flags.boolean({ aliases: ['rm'], description: 'Automatically run the migration files without prompting' }),
		authorizeDeletion: Flags.boolean({ aliases: ['ad'], description: 'Automatically authorize deletion of tables without prompting' }),
		table: Flags.string({ char: 't', description: 'Generate a migration for a specific queryrow', required: false }),
	}

	async run(): Promise<void> {
		const { flags } = await this.parse(Generate)
			.catch((err: Error) => this.error(err.message))

		dotenv.config({ path: `${process.cwd()}/.env` })

		if (process.env.ORM_AUTO_BUILD !== 'false') {
			this.log('Building TS files...')
			const result = await exec(process.env.ORM_CMD_BUILD || 'tsc')
			if (result.stderr) this.error(result.stderr)
			if (result.stdout) this.log(result.stdout)
		}

		let newSchema: DatabaseSchema = await fetchQueryRows(flags, this)
			.catch((err: Error) => this.error(err.message))
		const oldSchema: { schema: DatabaseSchema, isMySQL: boolean } = await databaseConnectionHandle(this)
			.catch((err: Error) => this.error(err.message))

		if (flags.table) {
			newSchema = newSchema.filter((table) => table.name === flags.table)
			if (newSchema.length === 0)
				this.error(`Could not find the queryrow ${flags.table}`)
			oldSchema.schema = oldSchema.schema.filter((table) => table.name === flags.table)
		}

		const diff: SchemaDiff = compareDatabaseSchema(oldSchema.schema, newSchema, oldSchema.isMySQL)

		const deletedTables = diff.filter((table) => table.type === 'deleted')
		if (deletedTables.length > 0 && !flags.authorizeDeletion) {
			const prompt: prompts.Answers<string> = await prompts(
				{
					type: 'select',
					name: 'confirmation',
					message: `The following tables will be deleted:\n${deletedTables.map((table) => `- ${table.name}`).join('\n')}\nDo you want to continue?`,
					choices: [{ title: 'Yes', selected: true, value: true }, {title: 'No', value: false }]
				})
			if (!prompt.confirmation)
				return
		}

		await checkForUnpushedMigrations(this, flags.env, flags.out, flags.table)

		const builder: KnexMigrationBuilder = new KnexMigrationBuilder(diff, newSchema, oldSchema.schema)
		await writeMigrationFiles(builder)
			.catch((err: Error) => this.error(err.message))

		if (diff.length === 0) {
			this.log('No changes detected')
			return
		}

		this.log(`Done! Created ${blue(diff.length)} migration files\n${Warning('Don\'t forget to run "knex migrate:latest"')}`)

		if (!flags.runMigration) {
			const prompt: prompts.Answers<string> = await prompts(
				{
					type: 'select',
					name: 'confirmation',
					message: 'Do you want to run "knex migrate:latest" now?',
					choices: [{ title: 'Yes', selected: true, value: true }, {title: 'No', value: false }]
				})
			if (!prompt.confirmation)
				return
		}

		const result = await exec(`NODE_ENV=${flags.env} npx knex migrate:latest`)
		if (result.stderr) this.error(result.stderr)

	}
}

