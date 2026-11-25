import path from 'path';

export type RuntimeProfile =
  | 'development'
  | 'web-production'
  | 'desktop-development'
  | 'desktop-production'
  | 'local-standalone';

export type BackendConnectivityMode = 'central-server' | 'local-standalone';
export type DatabaseEngine = 'mysql' | 'local-file';

export interface ServerRuntimeConfig {
  appName: string;
  version: string;
  profile: RuntimeProfile;
  backendMode: BackendConnectivityMode;
  runtimeFormat: 'web' | 'windows-desktop-exe';
  port: number;
  host: string;
  trustProxy: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataDir: string;
  backupDir: string;
  staticDistDir: string;
  allowedCorsOrigins: string[];
  // Server-only database configuration — NEVER serialized to renderer or API clients
  database: {
    engine: DatabaseEngine;
    mysqlHost: string;
    mysqlPort: number;
    mysqlDatabase: string;
    mysqlUser: string;
    mysqlPasswordConfigured: boolean;
  };
}

const VALID_PROFILES = new Set<RuntimeProfile>([
  'development',
  'web-production',
  'desktop-development',
  'desktop-production',
  'local-standalone',
]);

export function loadServerRuntimeConfig(resolvedDirname: string): ServerRuntimeConfig {
  const rawProfile = (process.env.TLGS_PROFILE || '').trim() as RuntimeProfile;
  const runtimeFormat: 'web' | 'windows-desktop-exe' =
    process.env.TLGS_RUNTIME_MODE === 'windows-desktop-exe'
      ? 'windows-desktop-exe'
      : 'web';

  const profile: RuntimeProfile = VALID_PROFILES.has(rawProfile)
    ? rawProfile
    : runtimeFormat === 'windows-desktop-exe'
    ? process.env.TLGS_BACKEND_MODE === 'local-standalone'
      ? 'local-standalone'
      : 'desktop-production'
    : process.env.NODE_ENV === 'production'
    ? 'web-production'
    : 'development';

  const backendMode: BackendConnectivityMode =
    process.env.TLGS_BACKEND_MODE === 'local-standalone' ||
    profile === 'local-standalone'
      ? 'local-standalone'
      : 'central-server';

  // Local standalone mode always uses an explicitly separated directory so it never
  // collides with or silently overwrites shared production data
  const defaultDataFolder =
    backendMode === 'local-standalone' ? '.erp-local-standalone-data' : '.erp-data';

  const dataDir = process.env.TLGS_DATA_DIR
    ? path.resolve(process.env.TLGS_DATA_DIR)
    : path.join(resolvedDirname, defaultDataFolder);

  const backupDir = process.env.TLGS_BACKUP_DIR
    ? path.resolve(process.env.TLGS_BACKUP_DIR)
    : path.join(dataDir, 'backups');

  const staticDistDir = process.env.TLGS_DIST_DIR
    ? path.resolve(process.env.TLGS_DIST_DIR)
    : path.join(resolvedDirname, 'dist');

  const mysqlConfigured = Boolean(
    process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER
  );
  const dbEngine: DatabaseEngine =
    backendMode === 'central-server' &&
    (process.env.TLGS_DB_ENGINE === 'mysql' || mysqlConfigured)
      ? 'mysql'
      : 'local-file';

  const allowedCorsOrigins = (process.env.TLGS_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawLogLevel = (process.env.TLGS_LOG_LEVEL || 'info').toLowerCase();
  const logLevel: ServerRuntimeConfig['logLevel'] =
    rawLogLevel === 'debug' ||
    rawLogLevel === 'warn' ||
    rawLogLevel === 'error'
      ? rawLogLevel
      : 'info';

  return {
    appName: 'TLGS-ERP',
    version: process.env.npm_package_version || '1.0.0',
    profile,
    backendMode,
    runtimeFormat,
    port: Number(process.env.PORT || 3000),
    host:
      process.env.TLGS_HOST ||
      (backendMode === 'local-standalone' ? '127.0.0.1' : '0.0.0.0'),
    trustProxy: process.env.TLGS_TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production',
    logLevel,
    dataDir,
    backupDir,
    staticDistDir,
    allowedCorsOrigins,
    database: {
      engine: dbEngine,
      mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
      mysqlPort: Number(process.env.MYSQL_PORT || 3306),
      mysqlDatabase: process.env.MYSQL_DATABASE || 'tlgs_erp',
      mysqlUser: process.env.MYSQL_USER || '',
      mysqlPasswordConfigured: Boolean(process.env.MYSQL_PASSWORD),
    },
  };
}

/**
 * Returns strictly non-secret runtime metadata safe for browser & Electron renderers.
 * Never exposes database credentials, hostnames, passwords, or session secrets.
 */
export function getPublicRuntimeInfo(
  config: ServerRuntimeConfig,
  dataRevision: number
) {
  return {
    app: config.appName,
    version: config.version,
    profile: config.profile,
    backendMode: config.backendMode,
    runtimeFormat: config.runtimeFormat,
    dbEngine: config.database.engine,
    dataIsolationLabel:
      config.backendMode === 'local-standalone'
        ? 'LOCAL STANDALONE MODE (Isolated Local Store)'
        : config.database.engine === 'mysql'
        ? 'CENTRAL SERVER MODE (Shared Production MySQL)'
        : 'CENTRAL SERVER MODE (Shared Server Store)',
    dataRevision,
    serverTime: new Date().toISOString(),
  };
}
