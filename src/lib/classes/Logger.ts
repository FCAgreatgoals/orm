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
