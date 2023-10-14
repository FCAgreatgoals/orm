type Operator =
    | '='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'LIKE'
    | 'NOT LIKE'
    | 'IN'
    | 'NOT IN'

type OperatorWithoutValue = 'IS NULL' | 'IS NOT NULL'

type ValueType = string | number | boolean | Date

type ConditionValue = ValueType | Array<ValueType>

export type WhereObject = { [column: string]: [Operator, ConditionValue] | [OperatorWithoutValue] | ValueType }

type Order = 'asc' | 'desc'
type Nulls = 'first' | 'last'
export type OrderBy = { [column: string]: [Order, Nulls] | Order }

export type FindAllOptions = {
	limit?: number,
	offset?: number,
	orderBy?: OrderBy
}
