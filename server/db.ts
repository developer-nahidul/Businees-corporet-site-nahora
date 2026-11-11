import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { Pool, type PoolClient } from 'pg'

export type DbRow = Record<string, unknown>
export type DbResult = { changes: number }
export interface DbExecutor {
  get<T = DbRow>(sql: string, ...parameters: unknown[]): Promise<T | undefined>
  all<T = DbRow>(sql: string, ...parameters: unknown[]): Promise<T[]>
  run(sql: string, ...parameters: unknown[]): Promise<DbResult>
}
export interface AppDatabase extends DbExecutor {
  readonly dialect: 'sqlite' | 'postgres'
  transaction<T>(callback: (database: DbExecutor) => Promise<T>): Promise<T>
  close(): Promise<void>
}

const schema = `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'merchant', 'admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE merchant_stores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX products_status_merchant_idx ON products(status, merchant_id);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  postal_code TEXT NOT NULL DEFAULT '',
  delivery_speed TEXT NOT NULL CHECK (delivery_speed IN ('standard', 'priority')),
  payment_method TEXT NOT NULL CHECK (payment_method = 'cod'),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  delivery_fee INTEGER NOT NULL CHECK (delivery_fee >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX orders_customer_idx ON orders(customer_id, created_at);

CREATE TABLE merchant_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  merchant_id TEXT NOT NULL REFERENCES users(id),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  delivery_fee INTEGER NOT NULL CHECK (delivery_fee >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(order_id, merchant_id)
);
CREATE INDEX merchant_orders_owner_idx ON merchant_orders(merchant_id, created_at);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  merchant_order_id TEXT NOT NULL REFERENCES merchant_orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_events_created_idx ON audit_events(created_at);
`

const migrationVersion = 1
const postgresNow = `to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`

class AsyncMutex {
  private tail: Promise<void> = Promise.resolve()

  async run<T>(callback: () => Promise<T>): Promise<T> {
    const previous = this.tail
    let release!: () => void
    this.tail = new Promise<void>((resolvePromise) => { release = resolvePromise })
    await previous
    try {
      return await callback()
    } finally {
      release()
    }
  }
}

class SqliteExecutor implements DbExecutor {
  constructor(protected readonly database: Database.Database) {}

  async get<T = DbRow>(sql: string, ...parameters: unknown[]) {
    return this.database.prepare(sql).get(...parameters) as T | undefined
  }

  async all<T = DbRow>(sql: string, ...parameters: unknown[]) {
    return this.database.prepare(sql).all(...parameters) as T[]
  }

  async run(sql: string, ...parameters: unknown[]) {
    const result = this.database.prepare(sql).run(...parameters)
    return { changes: result.changes }
  }
}

class SqliteAppDatabase extends SqliteExecutor implements AppDatabase {
  readonly dialect = 'sqlite' as const
  private readonly mutex = new AsyncMutex()

  override get<T = DbRow>(sql: string, ...parameters: unknown[]) {
    return this.mutex.run(() => super.get<T>(sql, ...parameters))
  }

  override all<T = DbRow>(sql: string, ...parameters: unknown[]) {
    return this.mutex.run(() => super.all<T>(sql, ...parameters))
  }

  override run(sql: string, ...parameters: unknown[]) {
    return this.mutex.run(() => super.run(sql, ...parameters))
  }

  transaction<T>(callback: (database: DbExecutor) => Promise<T>) {
    return this.mutex.run(async () => {
      this.database.exec('BEGIN IMMEDIATE')
      try {
        const result = await callback(new SqliteExecutor(this.database))
        this.database.exec('COMMIT')
        return result
      } catch (error) {
        this.database.exec('ROLLBACK')
        throw error
      }
    })
  }

  async close() {
    this.database.close()
  }
}

class PostgresExecutor implements DbExecutor {
  constructor(protected readonly client: Pool | PoolClient) {}

  async get<T = DbRow>(sql: string, ...parameters: unknown[]) {
    const result = await this.client.query(toPostgresSql(sql), parameters)
    return result.rows[0] as T | undefined
  }

  async all<T = DbRow>(sql: string, ...parameters: unknown[]) {
    const result = await this.client.query(toPostgresSql(sql), parameters)
    return result.rows as T[]
  }

  async run(sql: string, ...parameters: unknown[]) {
    const result = await this.client.query(toPostgresSql(sql), parameters)
    return { changes: result.rowCount ?? 0 }
  }
}

class PostgresAppDatabase extends PostgresExecutor implements AppDatabase {
  readonly dialect = 'postgres' as const
  private readonly pool: Pool

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString })
    super(pool)
    this.pool = pool
  }

  async transaction<T>(callback: (database: DbExecutor) => Promise<T>) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(new PostgresExecutor(client))
      await client.query('COMMIT')
      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to roll back database transaction:', rollbackError)
      }
      throw error
    } finally {
      client.release()
    }
  }

  async close() {
    await this.pool.end()
  }
}

function toPostgresSql(sql: string) {
  let index = 0
  return sql
    .replace(/strftime\('%Y-%m-%dT%H:%M:%fZ',\s*'now'\)/g, postgresNow)
    .replace(/\?/g, () => `$${++index}`)
}

export function initializeSqliteDatabase(database: Database.Database) {
  const version = Number(database.pragma('user_version', { simple: true }))
  if (version > migrationVersion) throw new Error(`Database version ${version} is newer than this application supports.`)
  database.pragma('foreign_keys = ON')
  database.pragma('journal_mode = WAL')
  database.pragma('busy_timeout = 5000')
  if (version === 0) {
    const migrate = database.transaction(() => {
      database.exec(schema)
      database.pragma(`user_version = ${migrationVersion}`)
    })
    migrate()
  }
}

export async function initializePostgresDatabase(database: AppDatabase) {
  await database.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (${postgresNow})
    )
  `)
  const applied = await database.get<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1')
  const version = applied?.version ?? 0
  if (version > migrationVersion) throw new Error(`Database version ${version} is newer than this application supports.`)
  if (version === 0) {
    await database.transaction(async (transaction) => {
      const postgresSchema = schema.replace(/strftime\('%Y-%m-%dT%H:%M:%fZ',\s*'now'\)/g, postgresNow)
      for (const statement of postgresSchema.split(';').map((part) => part.trim()).filter(Boolean)) {
        await transaction.run(statement)
      }
      await transaction.run('INSERT INTO schema_migrations (version) VALUES (?)', migrationVersion)
    })
  }
}

export function createSqliteAppDatabase(database: Database.Database): AppDatabase {
  return new SqliteAppDatabase(database)
}

export async function createPostgresDatabase(connectionString: string): Promise<AppDatabase> {
  const database = new PostgresAppDatabase(connectionString)
  try {
    await initializePostgresDatabase(database)
    return database
  } catch (error) {
    await database.close()
    throw error
  }
}

export async function createDatabase(path = process.env.DATABASE_PATH || '.data/nahora.sqlite'): Promise<AppDatabase> {
  const connectionString = process.env.DATABASE_URL
  if (connectionString) return createPostgresDatabase(connectionString)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production; SQLite is supported only for local development and tests.')
  }
  const absolutePath = resolve(path)
  mkdirSync(dirname(absolutePath), { recursive: true })
  const database = new Database(absolutePath)
  initializeSqliteDatabase(database)
  return createSqliteAppDatabase(database)
}
