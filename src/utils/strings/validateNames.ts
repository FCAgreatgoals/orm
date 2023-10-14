export default function validateNames(name: string): boolean {
	return name.toLowerCase().match(/^[a-z_]+$/) !== null || name.toLowerCase() !== name
}
