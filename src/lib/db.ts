import { Pool, PoolClient } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

const pool = global._pgPool ?? new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'carbontrack',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
})

if (process.env.NODE_ENV !== 'production') global._pgPool = pool

export default pool

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    client.release()
    return result
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('terminated') || msg.includes('Connection ended')) {
      client.release(err as Error)
      const client2 = await pool.connect()
      try {
        const result = await client2.query(text, params)
        client2.release()
        return result
      } catch (err2) {
        client2.release(err2 as Error)
        throw err2
      }
    }
    client.release(err as Error)
    throw err
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
