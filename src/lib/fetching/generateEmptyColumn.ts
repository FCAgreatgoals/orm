import { ColumnData } from '../types/Column'

export default function generateEmptyColumn(columnName: string): Partial<ColumnData> {
	return {
		name: columnName,
		default_value: null,
		max_length: null,
		numeric_precision: null,
		numeric_scale: null,
		is_nullable: true,
		is_unique: false,
		is_primary_key: false,
		has_auto_increment: false,
		is_unsigned: false,
	}
}
