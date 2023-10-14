import { Knex } from 'knex'
import Logger from '@lib/classes/Logger'
import { Join } from '@lib/decorators/Join'
import { TableData } from '@lib/decorators/Table'
import KnexInstance from '@lib/classes/KnexInstance'
import { WhereObject, FindAllOptions, OrderBy } from '../types/QueryRow'

export default class QueryRow {

    protected static getLogger(tableName: string): Logger {
        return new Logger(`[ORM] [${tableName}]`)
    }

    protected static buildJoin<T extends typeof QueryRow>(this: T, knex: Knex.QueryBuilder): Knex.QueryBuilder {
        const data: Required<TableData> = Reflect.getMetadata('table:data', this)
        if (data.joins.length > 0) knex.options({ nestTables: true })

        data.joins.forEach((join: Join) => knex.joinRaw([
            `${join.type} JOIN ${join.table.name}${join.alias ? ` as ${join.alias}` : ''}`,
            `ON ${data.name}.${join.column} ${join.operator || '='}`,
            `${join.alias || join.table.name}.${join.references || 'id'}`
        ].join(' ')))

        return knex
    }

    protected static buildWhere(knex: Knex.QueryBuilder, whereObject: WhereObject): Knex.QueryBuilder {
        return knex.where(builder => {
            Object.entries(whereObject).forEach(([column, data]) => {
                const operator = Array.isArray(data) ? data[0] : '='
                const value = Array.isArray(data) ? (data[1] || null) : data

                builder.where(column, operator, value)
            })
        })
    }

	protected static buildOrderBy(knex: Knex.QueryBuilder, orderBy: OrderBy): Knex.QueryBuilder {
		return knex.orderBy(Object.entries(orderBy).map(([column, data]) => ({
			column,
			order: Array.isArray(data) ? data[0] : data,
			...(Array.isArray(data) ? { nulls: data[1] } : {})
		})))
	}

    public static findOneBy<T extends typeof QueryRow>(this: T, whereObject: WhereObject): Promise<InstanceType<T> | void> {
		return this.findAllBy(whereObject, { limit: 1 }) as Promise<InstanceType<T> | void>
	}

    public static findOneById<T extends typeof QueryRow>(this: T, id: number): Promise<InstanceType<T> | void> {
        return this.findOneBy({ id })
    }

    public static findAllBy<T extends typeof QueryRow>(this: T, whereObject: WhereObject, options?: FindAllOptions): Promise<Array<InstanceType<T>> | void> {
        const data: Required<TableData> = Reflect.getMetadata('table:data', this)
        let request = KnexInstance.get()(data.name).select('*')

		if (options) {
			if (options.limit) request.limit(options.limit)
			if (options.offset) request.offset(options.offset)
			if (options.orderBy) request = this.buildOrderBy(request, options.orderBy)
		}

        return this.buildJoin(this.buildWhere(request, whereObject))
            .then((data: Array<any>) => this.hydrate(data, options?.limit === undefined || options.limit > 1))
            .catch(QueryRow.getLogger(data.name).catch('ESQL-F'))
    }

    public static search<T extends typeof QueryRow>(this: T, whereObject: WhereObject, options?: FindAllOptions): Promise<Array<InstanceType<T>> | void> {
        return this.findAllBy(whereObject, options)
    }

    public static findAll<T extends typeof QueryRow>(this: T, options?: FindAllOptions): Promise<Array<InstanceType<T>> | void> {
        return this.findAllBy({}, options)
    }

	public static countBy<T extends typeof QueryRow>(this: T, whereObject: WhereObject): Promise<number | void> {
		const data: Required<TableData> = Reflect.getMetadata('table:data', this)
		const request = KnexInstance.get()(data.name).count('*')

		return this.buildWhere(request, whereObject)
			.then((count: number) => count)
			.catch(QueryRow.getLogger(data.name).catch('ESQL-C'))
	}

	public static count<T extends typeof QueryRow>(this: T): Promise<number | void> {
		return this.countBy({})
	}

    public static new<T extends QueryRow>(this: new () => T): T {
        return new this()
    }

    private static hydrate(data: Array<any>, forceArray: boolean = false): Array<any> | any | void {
        if (data.length === 0 && !forceArray) return
        if (data.length === 0 && forceArray) return []
        if (data.length === 1 && !forceArray) return this.new().hydrate(data[0])

        return data.map(d => this.new().hydrate(d))
    }

    public getId(): number {
        throw new Error('getId method wasn\'t implemented yet')
    }

    public create(): Promise<this | void> {
        const data: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)

        return KnexInstance.get()(data.name)
            .insert(this.deHydrate())
            .then(([id]: Array<number>) => (this.constructor as typeof QueryRow).findOneById(id) as Promise<this | void>)
            .catch(QueryRow.getLogger(data.name).catch('ESQL-C'))
    }

    public update(): Promise<this | void> {
        const data: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)

        return KnexInstance.get()(data.name)
            .update(this.deHydrate())
            .where('id', this.getId())
            .then(() => (this.constructor as typeof QueryRow).findOneById(this.getId()) as Promise<this | void>)
            .catch(QueryRow.getLogger(data.name).catch('ESQL-U'))
    }

    public createOrUpdate(): Promise<this | void> {
        if (this.getId() !== undefined) return this.update()

        return this.create()
    }

    public delete(): Promise<boolean | void> {
        const data: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)

        return KnexInstance.get()(data.name)
            .delete()
            .where('id', this.getId())
            .then(() => true)
            .catch(QueryRow.getLogger(data.name).catch('ESQL-D'))
    }

    private hydrate(hydrateData: Record<string, any>): this {
        const { name, joins, hydrate }: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)
        Object.keys(joins.length > 0 ? hydrateData[name] : hydrateData).forEach(key => {
            const hydrateOptions = hydrate ? hydrate[key] : undefined

            if (hydrateOptions && hydrateOptions.propertyKey) {
                (this as any)[hydrateOptions.propertyKey] = hydrateOptions.fn(hydrateData[key])
            }

            (this as any)[key] = hydrateOptions && !hydrateOptions.propertyKey ? hydrateOptions.fn(hydrateData[key]) : hydrateData[key]
        })

        joins.forEach((join: Join) => {
            (this as any)[join.propertyKey] = join.table.ref.new().hydrate(hydrateData[join.alias || join.table.name])
        })

        return this
    }

    public deHydrate(): Record<string, any> {
        const { columns, dehydrate }: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)

        return Object.keys(columns).reduce((obj: any, column: string) => {
            const dehydrateOptions = dehydrate ? dehydrate[column] : undefined
            obj[column] = dehydrateOptions ? dehydrateOptions.fn((this as any)[dehydrateOptions.propertyKey || column]) : (this as any)[column]
            return obj
        }, {})
    }

}
