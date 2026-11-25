import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface MySqlHealthStatus {
  configured: boolean;
  connected: boolean;
  database: string;
  host: string;
  port: number;
  mysqlVersion: string | null;
  tableCount: number;
  latencyMs: number;
  error: string | null;
}

let pool: Pool | null = null;
let lastKnownConnected = false;

export function getMySqlEnvConfig() {
  const host = (process.env.DB_HOST || process.env.MYSQL_HOST || '').trim();
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const database = (
    process.env.DB_NAME ||
    process.env.MYSQL_DATABASE ||
    'leaders_multischool_erp'
  ).trim();
  const user = (process.env.DB_USER || process.env.MYSQL_USER || '').trim();
  const password = process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '';
  const configured = Boolean(host && database && user);

  return {
    configured,
    host: host || '127.0.0.1',
    port: Number.isFinite(port) && port > 0 ? port : 3306,
    database,
    user,
    password,
  };
}

/**
 * Returns the shared MySQL 8 connection pool if DB_HOST, DB_NAME, and DB_USER are configured.
 * Strictly server-side. Never creates, alters, drops, or truncates tables automatically.
 */
export function getMySqlPool(): Pool | null {
  const cfg = getMySqlEnvConfig();
  if (!cfg.configured) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      password: cfg.password,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
      queueLimit: 0,
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
      timezone: 'Z',
      dateStrings: true,
      decimalNumbers: true,
    });
  }

  return pool;
}

export function isMySqlConnected(): boolean {
  return lastKnownConnected && Boolean(pool);
}

/**
 * Executes a parameterized SELECT query against leaders_multischool_erp.
 */
export async function queryRows<T extends RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const activePool = getMySqlPool();
  if (!activePool) {
    throw new Error('MySQL connection pool is not configured.');
  }
  const [rows] = await activePool.execute<T>(sql, params);
  return rows;
}

/**
 * Executes a parameterized INSERT/UPDATE/DELETE mutation against leaders_multischool_erp.
 */
export async function executeStatement(
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> {
  const activePool = getMySqlPool();
  if (!activePool) {
    throw new Error('MySQL connection pool is not configured.');
  }
  const [result] = await activePool.execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Runs an atomic MySQL transaction with automatic COMMIT and ROLLBACK on error.
 */
export async function withMySqlTransaction<T>(
  work: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const activePool = getMySqlPool();
  if (!activePool) {
    throw new Error('MySQL connection pool is not configured.');
  }
  const conn = await activePool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // Ignore rollback secondary error
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Non-destructive health check that verifies connectivity to `leaders_multischool_erp`
 * and reports the live table count without exposing credentials.
 */
export async function checkMySqlHealth(): Promise<MySqlHealthStatus> {
  const cfg = getMySqlEnvConfig();
  const startedAt = Date.now();

  if (!cfg.configured) {
    lastKnownConnected = false;
    return {
      configured: false,
      connected: false,
      database: cfg.database,
      host: cfg.host,
      port: cfg.port,
      mysqlVersion: null,
      tableCount: 0,
      latencyMs: Date.now() - startedAt,
      error: 'DB_HOST / DB_USER environment variables not configured; running with local store fallback.',
    };
  }

  try {
    const activePool = getMySqlPool()!;
    const [pingRows] = await activePool.execute<RowDataPacket[]>(
      'SELECT DATABASE() AS db_name, VERSION() AS mysql_version'
    );
    const [tableRows] = await activePool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
      [cfg.database]
    );
    lastKnownConnected = true;
    return {
      configured: true,
      connected: true,
      database: String(pingRows[0]?.db_name || cfg.database),
      host: cfg.host,
      port: cfg.port,
      mysqlVersion: String(pingRows[0]?.mysql_version || ''),
      tableCount: Number(tableRows[0]?.table_count || 0),
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (err) {
    lastKnownConnected = false;
    const rawMsg = err instanceof Error ? err.message : 'MySQL connection failed';
    // Redact any accidental credential substrings from error messages
    const safeError = rawMsg.replace(/password\s*[:=]\s*[^\s,;]+/gi, 'password=[REDACTED]');
    return {
      configured: true,
      connected: false,
      database: cfg.database,
      host: cfg.host,
      port: cfg.port,
      mysqlVersion: null,
      tableCount: 0,
      latencyMs: Date.now() - startedAt,
      error: safeError,
    };
  }
}

export async function closeMySqlPool(): Promise<void> {
  if (pool) {
    const toClose = pool;
    pool = null;
    lastKnownConnected = false;
    await toClose.end();
  }
}
