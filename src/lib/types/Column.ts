export type ColumnData = {
	name: string;
	table: string;
	data_type: string;
	default_value: string | number | null;
	max_length: number | null;
	numeric_precision: number | null;
	numeric_scale: number | null;
	enum_values?: Array<string>;

	binaryUuid?: boolean;
	useTz?: boolean;

	is_unsigned?: boolean;

	is_nullable: boolean;
	is_unique?: boolean;
	is_primary_key?: boolean;
	is_generated?: boolean;
	generation_expression?: string | null;
	has_auto_increment?: boolean;

	foreign_key_table?: string | null;
	foreign_key_column?: string | null;
	onDelete?: string | null;
	onUpdate?: string | null;

	checkIn?: Array<string | number>;
	checkNotIn?: Array<string | number>;
	checkBetween?: Array<number | Array<number>>;
	checkRegexp?: string;
	checkNumeral?: string;
	checkPositive?: boolean;
	checkNegative?: boolean;

	checkInCustom?: string;
	checkNotInCustom?: string;
	checkBetweenCustom?: string;
	checkRegexpCustom?: string;
	checkNumeralCustom?: string;
	checkPositiveCustom?: string;
	checkNegativeCustom?: string;

	customIndex?: string;

	collation?: string | null;

	// Not supported in SQLite or MSSQL
	comment?: string | null;

	// Postgres Only
	schema?: string;
	foreign_key_schema?: string | null;
	constraintDeferred?: boolean;
}
