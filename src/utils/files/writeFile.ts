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
import { existsSync } from 'fs'
import { writeFile as fsWriteFile } from 'fs/promises'

export default async function writeFile(file: { name: string, data: string, path: string }, ctx: Command): Promise<void> {
	if (!existsSync(file.path))
		ctx.error(`Directory ${file.path} does not exist`)
	if (existsSync(`${file.path}/${file.name}.ts`))
		ctx.error(`File ${file.name}.ts already exists in ${file.path}`)

	const res = await fsWriteFile(`${file.path}/${file.name}.ts`, file.data)
	if (res !== undefined)
		ctx.error(`Error while creating file ${file.name}.ts in ${file.path}`)
}
