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

export enum Colors {
	Reset = '\x1b[0m',

	// Dim
	Black = '\x1b[30m',
	red = '\x1b[31m',
	Green = '\x1b[32m',
	Yellow = '\x1b[33m',
	Blue = '\x1b[34m',
	Magenta = '\x1b[35m',
	Cyan = '\x1b[36m',
	White = '\x1b[37m',

	// Bright
	BrightBlack = '\x1b[90;1m',
	BrightRed = '\x1b[91;1m',
	BrightGreen = '\x1b[92;1m',
	BrightYellow = '\x1b[93;1m',
	BrightBlue = '\x1b[94;1m',
	BrightMagenta = '\x1b[95;1m',
	BrightCyan = '\x1b[96;1m',
	BrightWhite = '\x1b[97;1m',

	// Background
	BackgroundBlack = '\x1b[40m',
	BackgroundRed = '\x1b[41m',
	BackgroundGreen = '\x1b[42m',
	BackgroundYellow = '\x1b[43m',
	BackgroundBlue = '\x1b[44m',
	BackgroundMagenta = '\x1b[45m',
	BackgroundCyan = '\x1b[46m',
	BackgroundWhite = '\x1b[47m',

	// Bright Background
	BrightBackgroundBlack = '\x1b[100;1m',
	BrightBackgroundRed = '\x1b[101;1m',
	BrightBackgroundGreen = '\x1b[102;1m',
	BrightBackgroundYellow = '\x1b[103;1m',
	BrightBackgroundBlue = '\x1b[104;1m',
	BrightBackgroundMagenta = '\x1b[105;1m',
	BrightBackgroundCyan = '\x1b[106;1m',
	BrightBackgroundWhite = '\x1b[107;1m',

	// Special
	Warning = '\x1b[38;5;16m\x1b[48;5;214mWARN\x1b[0m \x1b[38;5;214m',
}

export const colorize = (color: Colors, text: string | number): string => { return `${color}${text}${Colors.Reset}` }

export const red = (string: string | number): string => colorize(Colors.red, string)
export const green = (string: string | number): string => colorize(Colors.Green, string)
export const yellow = (string: string | number): string => colorize(Colors.Yellow, string)
export const blue = (string: string | number): string => colorize(Colors.Blue, string)
export const magenta = (string: string | number): string => colorize(Colors.Magenta, string)
export const cyan = (string: string | number): string => colorize(Colors.Cyan, string)
export const white = (string: string | number): string => colorize(Colors.White, string)

export const brightRed = (string: string | number): string => colorize(Colors.BrightRed, string)
export const brightGreen = (string: string | number): string => colorize(Colors.BrightGreen, string)
export const brightYellow = (string: string | number): string => colorize(Colors.BrightYellow, string)
export const brightBlue = (string: string | number): string => colorize(Colors.BrightBlue, string)
export const brightMagenta = (string: string | number): string => colorize(Colors.BrightMagenta, string)
export const brightCyan = (string: string | number): string => colorize(Colors.BrightCyan, string)
export const brightWhite = (string: string | number): string => colorize(Colors.BrightWhite, string)

export const bgRed = (string: string | number): string => colorize(Colors.BackgroundRed, string)
export const bgGreen = (string: string | number): string => colorize(Colors.BackgroundGreen, string)
export const bgYellow = (string: string | number): string => colorize(Colors.BackgroundYellow, string)
export const bgBlue = (string: string | number): string => colorize(Colors.BackgroundBlue, string)
export const bgMagenta = (string: string | number): string => colorize(Colors.BackgroundMagenta, string)
export const bgCyan = (string: string | number): string => colorize(Colors.BackgroundCyan, string)
export const bgWhite = (string: string | number): string => colorize(Colors.BackgroundWhite, string)

export const bgBrightRed = (string: string | number): string => colorize(Colors.BrightBackgroundRed, string)
export const bgBrightGreen = (string: string | number): string => colorize(Colors.BrightBackgroundGreen, string)
export const bgBrightYellow = (string: string | number): string => colorize(Colors.BrightBackgroundYellow, string)
export const bgBrightBlue = (string: string | number): string => colorize(Colors.BrightBackgroundBlue, string)
export const bgBrightMagenta = (string: string | number): string => colorize(Colors.BrightBackgroundMagenta, string)
export const bgBrightCyan = (string: string | number): string => colorize(Colors.BrightBackgroundCyan, string)
export const bgBrightWhite = (string: string | number): string => colorize(Colors.BrightBackgroundWhite, string)

export const Warning = (string: string | number): string => colorize(Colors.Warning, string)

