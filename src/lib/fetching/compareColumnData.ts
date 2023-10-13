import { ColumnData } from '@lib/types/Column'
import { DiffResult } from '@lib/types/DiffResult'

export default function compareColumnData(obj1: Partial<ColumnData>, obj2: ColumnData, isMySQL?: boolean): DiffResult | null {
	const keys1: Array<string> = Object.keys(obj1)
	const keys2: Array<string> = Object.keys(obj2)

	const addedKeys: Array<string> = keys2.filter(key => !keys1.includes(key))
	const modifiedKeys: Array<string> = keys2.filter(key => keys1.includes(key) &&
		obj1[key as keyof ColumnData] !== obj2[key as keyof ColumnData] &&
		(key !== 'enum_values' || JSON.stringify(obj1[key as keyof ColumnData]) !== JSON.stringify(obj2[key as keyof ColumnData])))
	const deletedKeys: Array<string> = keys1.filter(key => !keys2.includes(key))

	if (addedKeys.length + modifiedKeys.length + deletedKeys.length === 0)
		return null

	const result: DiffResult = {}

	addedKeys.forEach(key => {
		result[key] = {
			newValue: obj2[key as keyof ColumnData],
			type: 'added'
		}
	})

	modifiedKeys.forEach(key => {
		if (key === 'numeric_precision' && obj2[key as keyof ColumnData] === null)
			return
		if (key === 'max_length' && isMySQL && obj2[key as keyof ColumnData] === null)
			return
		if (key === 'is_unsigned' && !isMySQL)
			return
		result[key] = {
			newValue: obj2[key as keyof ColumnData],
			type: 'modified'
		}
	})

	deletedKeys.forEach(key => {
		if (key === 'collation')
			return
		result[key] = {
			newValue: null,
			type: 'deleted'
		}
	})

	return (Object.keys(result).length > 0) ? result : null
}
