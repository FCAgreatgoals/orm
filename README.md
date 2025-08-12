# @fca.gg/orm

A TypeScript-based Object-Relational Mapping (ORM) library for Node.js applications, built on top of Knex.js with support for MySQL and PostgreSQL databases.

## Features

- **TypeScript Support**: Full TypeScript integration with decorators and type safety
- **Database Support**: MySQL and PostgreSQL compatibility
- **Migration System**: Automatic database schema migration and synchronization
- **Query Builder**: Intuitive query building with join support
- **CLI Tool**: Command-line interface for database operations
- **Decorators**: Clean decorator-based entity definitions
- **Active Record Pattern**: Simple and familiar database interaction patterns

## Installation

```bash
npm install @fca.gg/orm
```

## Quick Start

### 1. Database Configuration

Create a `knexfile.js` in your project root:

```javascript
// knexfile.js
module.exports = {
  client: 'mysql2', // or 'pg' for PostgreSQL
  connection: {
    host: 'localhost',
    user: 'username',
    password: 'password',
    database: 'database_name'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations'
  }
}
```

Then initialize the ORM in your application:

```typescript
import { KnexInstance } from '@fca.gg/orm'

// Initialize the ORM (reads from knexfile.js automatically)
KnexInstance.init()
```

### 2. Define Entity Models

Use decorators to define your database entities:

```typescript
import { QueryRow, Column, ColumnOption, Table } from '@fca.gg/orm'

@Table('users')
export class User extends QueryRow {
  @Column.Increment()
  @ColumnOption.Primary()
  @ColumnOption.NotNullable()
  @ColumnOption.Unsigned()
  private id!: number

  @Column.String(255)
  @ColumnOption.NotNullable()
  private name: string

  @Column.String(255)
  @ColumnOption.Unique()
  @ColumnOption.NotNullable()
  private email: string

  @Column.Boolean()
  @ColumnOption.NotNullable()
  @ColumnOption.DefaultTo(true)
  private active: boolean

  // Getter methods
  public getId(): number {
    return this.id
  }

  public getName(): string {
    return this.name
  }

  public getEmail(): string {
    return this.email
  }

  public getActive(): boolean {
    return Boolean(this.active)
  }

  // Setter methods
  public setName(name: string): this {
    this.name = name
    return this
  }

  public setEmail(email: string): this {
    this.email = email
    return this
  }

  public setActive(active: boolean): this {
    this.active = active
    return this
  }
}
```

### 3. Database Operations

```typescript
// Create a new user
const user = new User()
user.setName('John Doe')
user.setEmail('john@example.com')
await user.create()

// Find users
const users = await User.findAll()
const user = await User.findById(1)
const userByEmail = await User.findOne({ email: 'john@example.com' })

// Update existing user
user.setName('Jane Doe')
await user.update()

// Create or update (upsert)
await user.createOrUpdate()

// Access data using getter methods
console.log(user.getName()) // 'Jane Doe'
console.log(user.getEmail()) // 'john@example.com'

// Delete
await user.delete()
```

### 4. Relationships and Joins

Define relationships between entities using foreign keys and joins:

```typescript
import { QueryRow, Column, ColumnOption, Table, ReferenceOption, Join } from '@fca.gg/orm'

@Table('posts')
export class Post extends QueryRow {
  @Column.Increment()
  @ColumnOption.Primary()
  @ColumnOption.NotNullable()
  @ColumnOption.Unsigned()
  private id!: number

  @Column.Integer()
  @ColumnOption.NotNullable()
  @ColumnOption.Unsigned()
  @ColumnOption.References('id')
  @ReferenceOption.InTable('users')
  @ReferenceOption.OnDelete('CASCADE')
  private user_id: number

  @Join(User)
  private user: User

  @Column.String(255)
  @ColumnOption.NotNullable()
  private title: string

  // Getter methods
  public getUser(): User {
    return this.user
  }

  public getTitle(): string {
    return this.title
  }

  // Setter methods
  public setUser(user: User): this {
    this.user = user
    return this
  }

  public setTitle(title: string): this {
    this.title = title
    return this
  }
}
```

## CLI Commands

The ORM includes a command-line interface for common database operations:

```bash
# Generate migration files
orm migration generate

# Generate QueryRow classes from database schema
orm queryrow generate

# Generate accessor methods
orm accessor generate
```

## Decorators

### @Table(tableName)
Defines the database table name for the entity.

### Column Decorators
Define column types using static methods:
- `@Column.Increment()`: Auto-increment integer column
- `@Column.Integer()`: Integer column
- `@Column.String(length)`: String/VARCHAR column with specified length
- `@Column.Boolean()`: Boolean column
- `@Column.Enum(values)`: Enum column with array of possible values

### Column Option Decorators
Define column constraints and options:
- `@ColumnOption.Primary()`: Mark as primary key
- `@ColumnOption.NotNullable()`: NOT NULL constraint
- `@ColumnOption.Nullable()`: Allow NULL values
- `@ColumnOption.Unique()`: Unique constraint
- `@ColumnOption.Unsigned()`: Unsigned integer (for numeric types)
- `@ColumnOption.DefaultTo(value)`: Set default value
- `@ColumnOption.References(column)`: Define foreign key reference

### Reference Option Decorators
Define foreign key relationships:
- `@ReferenceOption.InTable(tableName)`: Specify the referenced table
- `@ReferenceOption.OnDelete(action)`: Define cascade action (CASCADE, SET NULL, etc.)
- `@ReferenceOption.OnUpdate(action)`: Define update action

### @Join(EntityClass)
Define table relationships for automatic joins with related entities.

## Advanced Features

### Custom Queries

For custom queries, create static methods in your QueryRow classes:

```typescript
@Table('users')
export class User extends QueryRow {
  // ... column definitions ...

  // Custom query methods
  public static async findActiveUsers(): Promise<User[]> {
    const knex = KnexInstance.getInstance()
    const results = await knex('users').where('active', true)
    return results.map(row => Object.assign(new User(), row))
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const knex = KnexInstance.getInstance()
    const result = await knex('users').where('email', email).first()
    return result ? Object.assign(new User(), result) : null
  }

  public static async countActiveUsers(): Promise<number> {
    const knex = KnexInstance.getInstance()
    const result = await knex('users').where('active', true).count('* as count').first()
    return result ? parseInt(result.count as string) : 0
  }
}
```

### Transactions

```typescript
await KnexInstance.transaction(async (trx) => {
  const user = new User()
  user.setName('John')
  await user.create(trx)
  
  // More operations within transaction
})
```

## Database Support

- **MySQL**: Using `mysql2` driver
- **PostgreSQL**: Using `pg` driver

## License

This project is licensed under the AGPL v3 License - see the [LICENSE](LICENSE) file for details.

> We chose the AGPL to ensure that `@fca.gg/orm` remains truly open source and contributive.
If you use or adapt `@fca.gg/orm`, even over a network, you must share your modifications. That’s the spirit of the project — building useful tools together, in the open.
