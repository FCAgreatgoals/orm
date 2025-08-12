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

import { Args, Command, Flags } from '@oclif/core'
import createNewClass from '../../utils/files/createNewClass'

export default class Table extends Command {

	static description = 'Create a new table'

	static examples = [
		'$ orm queryrow',
	];

	static args = {
		name: Args.string({ description: 'Table name', required: true })
	}

	static flags = {
		project: Flags.string({ char: 'p', description: 'Directory to create the new table inside', required: false, default: `${process.cwd()}/src` }),
	}

	async run(): Promise<void> {
		const { args, flags } = await this.parse(Table)

		await createNewClass({ args, flags }, 'queryrow', this)

	}
}

