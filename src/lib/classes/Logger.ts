import timestamp from 'time-stamp'
import * as chalk from 'chalk'

export default class Logger {

    private readonly title: string
    private readonly colors = {
        log: chalk.cyan,
        info: chalk.white,
        success: chalk.green,
        warn: chalk.yellow,
        error: chalk.red
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
                console.error(color(`${timestamp('[DD/MM/YYYY HH:mm:ss')} - ${this.title} - ${level}]:`))
                console.error(entry)
                return
            }

            console.log(
                color(`${timestamp('[DD/MM/YYYY HH:mm:ss')} - ${this.title} - ${level}]:`),
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
