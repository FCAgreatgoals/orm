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
