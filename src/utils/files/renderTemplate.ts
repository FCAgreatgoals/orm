import { readFile } from 'fs/promises'
import { render } from 'ejs'
import { getInstalledPath } from 'get-installed-path'

export async function renderTemplate(template: string, data: Record<string, any>): Promise<string> {

	const packagePath = await getInstalledPath('orm-cli')

	const templateContent = await readFile(`${packagePath}/lib/templates/${template}`, 'utf-8')

	return render(templateContent, data)
}
