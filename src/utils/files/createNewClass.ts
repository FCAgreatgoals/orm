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

import { Command } from '@oclif/core'
import validateNames from '../strings/validateNames'
import upcaseFirst from '../strings/upcase'
import { renderTemplate } from './renderTemplate'
import writeFile from './writeFile'
import { blue } from '../strings/colors'
import { existsSync } from 'fs'

export interface ICreateNewClassParams {
	args: {
		name: string,
	},
	flags: {
		project: string,
	}
}

export type ClassType = 'queryrow'

export function toFileNameString(name: string): string {
	const words = name.split('_')
	const upperWords = words.map(word => upcaseFirst(word))
	upperWords.push('QueryRow')
	return upperWords.join('')
}

export default async function createNewClass(params: ICreateNewClassParams, type: ClassType, ctx: Command): Promise<void> {
	if (validateNames(params.args.name) === false)
		return ctx.error(`Invalid ${type} name (must be all lowercase with underscores)`)
	if (!existsSync(`${process.cwd()}/src`))
		return ctx.error('No src directory found. Please run this command from the root of your project or create a src directory.')

	const tableName = toFileNameString(params.args.name)

	const data = {
		tableName,
		tableId: params.args.name,
	}

	const string = await renderTemplate(`${type}.ts.ejs`, data)

	await writeFile({
		name: tableName,
		data: string,
		path: params.flags.project
	}, ctx)

	ctx.log(`QueryRow ${blue(params.args.name)} created successfully`)

}
