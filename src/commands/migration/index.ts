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

import KnexMigrationBuilder from '../../lib/classes/KnexMigrationBuilder'
import compareDatabaseSchema from '../../lib/fetching/compareDatabaseSchema'
import { DatabaseSchema, SchemaDiff } from '../../lib/types/Schema'
import { writeMigrationFiles } from '../../lib/fetching/writeMigrationFiles'
import { Command, Flags } from '@oclif/core'
import { Warning, blue } from '../../utils/strings/colors'
import databaseConnectionHandle from '../../utils/database/databaseConnectionHandle'
import fetchQueryRows from '../../utils/files/fetchQueryRows'
import prompts = require('prompts') // require because of outdated definition
import { exec } from 'node:child_process'
import checkForUnpushedMigrations from '../../utils/database/checkForUnpushedMigrations'
import * as dotenv from 'dotenv'
import { ClientType } from 'lib/clients/Inspector'

async function execAsync(cmd: string, ctx: Command): Promise<void> {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (stderr) {
				ctx.log(stdout)
				ctx.error(stderr)
			}
			if (error) reject(error)
			resolve()
		})
	})
}

export default class Generate extends Command {

	static description = 'Create a new table'

	static examples = [
		'$ orm migration',
	]

	static args = {}

	static flags = {
		project: Flags.directory({
			char: 'p',
			description: 'Project directory',
			required: false,
			default: `${process.cwd()}/src`
		}),
		runMigration: Flags.boolean({
			aliases: [ 'rm' ],
			description: 'Automatically run the migration files without prompting'
		}),
		authorizeDeletion: Flags.boolean({
			aliases: [ 'ad' ],
			description: 'Automatically authorize deletion of tables without prompting'
		}),
		table: Flags.string({
			char: 't',
			description: 'Generate a migration for a specific queryrow',
			required: false
		}),
	}

	async run(): Promise<void> {
		const { flags } = await this.parse(Generate)
			.catch((err: Error) => this.error(err.message))

		dotenv.config({ path: `${process.cwd()}/.env` })

		if (process.env.ORM_AUTO_BUILD !== 'false') {
			this.log('Building TS files...')
			await execAsync(process.env.ORM_CMD_BUILD || 'tsc', this)
				.catch(() => {
					this.error('Building failed ! Please check your compilation trace before migrating')
				})
		}

		let newSchema: DatabaseSchema = await fetchQueryRows(flags, this).catch((err: Error) => this.error(err.message))
		const oldSchema: {
			schema: DatabaseSchema,
			type: ClientType
		} = await databaseConnectionHandle(this).catch((err: Error) => this.error(err.message))

		if (flags.table) {
			newSchema = newSchema.filter((table) => table.name === flags.table)
			if (newSchema.length === 0)
				this.error(`Could not find the queryrow ${flags.table}`)
			oldSchema.schema = oldSchema.schema.filter((table) => table.name === flags.table)
		}

		const diff: SchemaDiff = compareDatabaseSchema(oldSchema.schema, newSchema, oldSchema.type)

		const deletedTables = diff.filter((table) => table.type === 'deleted')
		if (deletedTables.length > 0 && !flags.authorizeDeletion) {
			const prompt: prompts.Answers<string> = await prompts(
				{
					type: 'select',
					name: 'confirmation',
					message: `The following tables will be deleted:\n${deletedTables.map((table) => `- ${table.name}`).join('\n')}\nDo you want to continue?`,
					choices: [ { title: 'Yes', selected: true, value: true }, { title: 'No', value: false } ]
				})
			if (!prompt.confirmation)
				return
		}

		await checkForUnpushedMigrations(this, flags.table)

		const builder: KnexMigrationBuilder = new KnexMigrationBuilder(diff, newSchema, oldSchema.schema, oldSchema.type)
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
					choices: [ { title: 'Yes', selected: true, value: true }, { title: 'No', value: false } ]
				})
			if (!prompt.confirmation)
				return
		}

		exec('npx knex migrate:latest', (error, stdout: string, stderr: string) => {
			if (stderr) this.error(stderr)
		})

	}
}

