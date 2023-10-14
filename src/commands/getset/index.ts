import { Command, Flags } from '@oclif/core'
import rewriteQueryRowClass from '@utils/files/rewriteQueryRowClass'
import { searchProject } from '@utils/files/searchProject'

export default class GetsetCommand extends Command {

	static description = 'Generate getter and setter functions for a queryrow class'

	static examples = [
		'$ orm getset',
	];

	static args = {}

	static flags = {
		project: Flags.directory({ char: 'p', description: 'Project directory', required: false, default: process.cwd()+ '/src' }),
		file: Flags.string({ char: 'f', description: 'File to add functions to', required: false }),
	}

	public modifiedFilesNumber: number = 0

	async run(): Promise<void> {
		const { flags } = await this.parse(GetsetCommand)

		if (!flags.file) {
			const queryrows: Array<string> = await searchProject(flags.project)
			for (const file of queryrows) {
				await rewriteQueryRowClass(file, this)
			}
		} else await rewriteQueryRowClass(`${flags.project}/${flags.file}${(flags.file.includes('.ts')) ? '' : '.ts'}`, this)

		if (this.modifiedFilesNumber === 0)
			this.log('No queryrow classes changed')
		else
			this.log(`Modified ${this.modifiedFilesNumber} queryrow classes`)

	}
}

