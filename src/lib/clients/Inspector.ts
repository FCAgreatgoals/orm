export default abstract class Inspector {

	public abstract client_type: 'mysql' | 'postgres'

	abstract tables(): Promise<string[]>
	abstract tables(schemaName: string): Promise<string[]>

	abstract tableInfo(tableName: string): Promise<any>
	abstract tableInfo(tableName: string, schemaName: string): Promise<any>

	abstract columnInfo(tableName: string): Promise<any>
	abstract columnInfo(tableName: string, schemaName: string): Promise<any>

}
