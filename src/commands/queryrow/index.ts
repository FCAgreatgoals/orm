import { Args, Command, Flags } from '@oclif/core'
import createNewClass from '@utils/files/createNewClass'

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

