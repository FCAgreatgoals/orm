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

import { red, yellow, green, white, cyan } from 'chalk'

function timestamp(): string {
	const date = new Date()
	return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

export default class Logger {

    private readonly title: string
    private readonly colors = {
        log: cyan,
        info: white,
        success: green,
        warn: yellow,
        error: red
    }
    private readonly levels = {
        log: 'LOG',
        info: 'INFO',
        success: 'SUCCESS',
        warn: 'WARN',
        error: 'ERROR'
    }

    constructor(title: string) {
        this.title = title.toUpperCase()
    }

    private output(type: 'log' | 'info' | 'success' | 'warn' | 'error', ...entries: Array<any>): void {
        const color = this.colors[type]
        const level = this.levels[type]
        entries.forEach(entry => {
            if (type === 'error') {
                console.error(color(`[${timestamp()} - ${this.title} - ${level}]:`))
                console.error(entry)
                return
            }

            console.log(
                color(`[${timestamp()} - ${this.title} - ${level}]:`),
                entry
            )
        })
    }

    public log(...entries: Array<any>): void {
        this.output('log', ...entries)
    }

    public info(...entries: Array<any>): void {
        this.output('info', ...entries)
    }

    public success(...entries: Array<any>): void {
        this.output('success', ...entries)
    }

    public warn(...entries: Array<any>): void {
        this.output('warn', ...entries)
    }

    public error(...entries: Array<any>): void {
        this.output('error', ...entries)
    }

    public catch(uid: string): (...entries: Array<any>) => void {
        return (...entries) => {
            this.error(...[uid, ...entries])
        }
    }
}
