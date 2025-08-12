/**
 * This file is part of @fca.gg/orm (https://github.com/FCAgreatgoals/orm).
 *
 * Copyright (C) 2025 SAS French Community Agency
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Knex } from 'knex'
import { WhereObject, FindAllOptions, OrderBy } from '../types/QueryRow'
import Logger from '../classes/Logger'
import { Join } from '../decorators/Join'
import { TableData } from '../decorators/Table'
import KnexInstance from './KnexInstance'
import upcaseFirst from '../../utils/strings/upcase'

export default class QueryRow {

	constructor() {
		return new Proxy(this, {
			get: (target: any, propertyKey: string) => {
				const { joins } = Reflect.getMetadata('table:data', target.constructor)
				if (!joins) return target[propertyKey]

				const join: Join | undefined = joins.find((join: Join) => join.column === propertyKey)
				if (!join) return target[propertyKey]

				return target[join.propertyKey][`get${upcaseFirst(join.references || 'id')}`]()
			}
		})
	}

	protected static getLogger(tableName: string): Logger {
		return new Logger(`[ORM] [${tableName}]`)
	}

	protected static buildJoin<T extends typeof QueryRow>(this: T, knex: Knex.QueryBuilder): Knex.QueryBuilder {
		const data: Required<TableData> = Reflect.getMetadata('table:data', this)
		if (data.joins.length > 0) knex.options({ nestTables: true })

		const build = (name: string, join: Join): void => {
			knex.joinRaw([
				`${join.type} JOIN ${join.table.name}${join.alias ? ` as ${join.alias}` : ''}`,
				`ON ${name}.${join.column} ${join.operator || '='}`,
				`${join.alias || join.table.name}.${join.references || 'id'}`
			].join(' '))

			const data = Reflect.getMetadata('table:data', join.table.ref)

			if (data.joins.length > 0) data.joins.forEach((join: Join) => build(data.name, join))
		}

		data.joins.forEach((join: Join) => build(data.name, join))

		return knex
	}

	protected static buildWhere(knex: Knex.QueryBuilder, whereObject: WhereObject, mainTable: string): Knex.QueryBuilder {
		return knex.where(builder => {
			Object.entries(whereObject).forEach(([ column, data ]) => {
				const operator = Array.isArray(data) ? data[0] : '='
				const value = Array.isArray(data) ? (data[1] || null) : data

				if (value === null) {
					builder.whereRaw(`${mainTable}.${column} ${operator}`)
					return
				}

				builder.where(column === 'id' ? `${mainTable}.${column}` : column, operator, value)
			})
		})
	}

	protected static buildOrderBy(knex: Knex.QueryBuilder, orderBy: OrderBy): Knex.QueryBuilder {
		return knex.orderBy(Object.entries(orderBy).map(([ column, data ]) => ({
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

		return this.buildJoin(this.buildWhere(request, whereObject, data.name))
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

		return this.buildWhere(request, whereObject, data.name)
			.then(([ count ]: Array<any>) => count['count(*)'])
			.catch(QueryRow.getLogger(data.name).catch('ESQL-C'))
	}

	public static count<T extends typeof QueryRow>(this: T): Promise<number | void> {
		return this.countBy({})
	}

	public static new<T extends QueryRow>(this: new () => T): T {
		return new this()
	}

	protected static hydrate(data: Array<any>, forceArray: boolean = false): Array<any> | any | void {
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
			.then(([ id ]: Array<number>) => (this.constructor as typeof QueryRow).findOneById(id) as Promise<this | void>)
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

	protected hydrate(hydrateData: Record<string, any>): this {
		const { name, joins, hydrate }: Required<TableData> = Reflect.getMetadata('table:data', this.constructor)

		Object.keys(joins.length > 0 ? hydrateData[name] : hydrateData).forEach(key => {
			const value = joins.length > 0 ? hydrateData[name][key] : hydrateData[key]
			const hydrateOptions = hydrate ? hydrate[key] : undefined

			if (hydrateOptions && hydrateOptions.propertyKey) {
				(this as any)[hydrateOptions.propertyKey] = hydrateOptions.fn(value)
			}

			(this as any)[key] = hydrateOptions && !hydrateOptions.propertyKey ? hydrateOptions.fn(value) : value
		})

		joins.forEach((join: Join) => {
			const data: Required<TableData> = Reflect.getMetadata('table:data', join.table.ref)
			let joinHydrateData = hydrateData[join.alias || join.table.name]

			if (data.joins.length > 0) {
				joinHydrateData = {
					[join.alias || join.table.name]: hydrateData[join.alias || join.table.name]
				}

				data.joins.forEach((joinData: Join) => {
					joinHydrateData[joinData.alias || joinData.table.name] = hydrateData[joinData.alias || joinData.table.name]
				})

			}

			(this as any)[join.propertyKey] = join.table.ref.new().hydrate(joinHydrateData)
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
