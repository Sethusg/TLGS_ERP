export type ErpRuntimeMode = 'windows-desktop-exe' | 'pwa-standalone' | 'web-browser';

export interface DesktopServerConfig {
  mode: 'local' | 'remote';
  serverUrl: string;
}

export interface DesktopPrinterInfo {
  name: string;
  displayName: string;
  description?: string;
  status?: number;
  isDefault: boolean;
}

export interface TlgsDesktopBridge {
  isDesktop: true;
  platform: string;
  arch: string;
  appVersion: string;
  electronVersion: string;
  osRelease?: string;
  getConfig: () => Promise<DesktopServerConfig & { activeBaseUrl: string; dataDir: string }>;
  setServerConfig: (config: DesktopServerConfig) => Promise<{
    success: boolean;
    error?: string;
    activeBaseUrl?: string;
  }>;
  getPrinters: () => Promise<DesktopPrinterInfo[]>;
  printCurrentPage: (options?: {
    silent?: boolean;
    deviceName?: string;
    landscape?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  exportPdf: (suggestedFileName?: string) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  openDataFolder: () => Promise<{ success: boolean }>;
  relaunch: () => Promise<void>;
  checkServerHealth: (targetUrl: string) => Promise<{
    ok: boolean;
    status?: number;
    latencyMs?: number;
    app?: string;
    version?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    tlgsDesktop?: TlgsDesktopBridge;
  }
}

const REMOTE_SERVER_STORAGE_KEY = 'tlgs_erp_remote_server_url';

export function getDesktopBridge(): TlgsDesktopBridge | null {
  if (typeof window === 'undefined') return null;
  return window.tlgsDesktop && window.tlgsDesktop.isDesktop ? window.tlgsDesktop : null;
}

export function isWindowsDesktopApp(): boolean {
  return Boolean(getDesktopBridge());
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined' || isWindowsDesktopApp()) return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function getRuntimeMode(): ErpRuntimeMode {
  if (isWindowsDesktopApp()) return 'windows-desktop-exe';
  if (isPwaStandalone()) return 'pwa-standalone';
  return 'web-browser';
}

export function detectBrowserName(): string {
  if (isWindowsDesktopApp()) return 'TLGS-ERP Desktop (Chromium / Electron)';
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return 'Google Chrome';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Apple Safari';
  return 'Web Browser';
}

export function detectOperatingSystem(): string {
  if (typeof navigator === 'undefined') return 'Unknown OS';
  const ua = navigator.userAgent;
  if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10 / Windows 11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  return 'Desktop / Web';
}

export function normalizeServerBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export function getConfiguredApiBaseUrl(): string {
  // 1. Optional build-time environment variable (e.g. VITE_API_BASE_URL)
  const envBase =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
      ? normalizeServerBaseUrl(String((import.meta as any).env.VITE_API_BASE_URL))
      : '';

  if (typeof window === 'undefined') return envBase;

  // 2. Runtime custom remote server override (used when connecting to central Django/Express ERP server)
  try {
    const stored = window.localStorage.getItem(REMOTE_SERVER_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeServerBaseUrl(stored);
      if (normalized) return normalized;
    }
  } catch {
    // Ignore storage restriction
  }

  return envBase;
}

export function setConfiguredApiBaseUrl(rawUrl: string): string {
  const normalized = normalizeServerBaseUrl(rawUrl);
  if (typeof window !== 'undefined') {
    try {
      if (normalized) {
        window.localStorage.setItem(REMOTE_SERVER_STORAGE_KEY, normalized);
      } else {
        window.localStorage.removeItem(REMOTE_SERVER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage restriction
    }
  }
  return normalized;
}

/**
 * Resolves relative `/api/...` paths against the active ERP server base URL so that
 * both Web (Chrome/Edge) and Windows 11 Desktop EXE talk to the exact same backend.
 */
export function resolveApiUrl(endpointPath: string): string {
  if (/^https?:\/\//i.test(endpointPath)) {
    return endpointPath;
  }
  const base = getConfiguredApiBaseUrl();
  const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export interface ServerHealthResult {
  ok: boolean;
  targetUrl: string;
  latencyMs: number;
  status?: number;
  app?: string;
  version?: string;
  mode?: string;
  profile?: string;
  backendMode?: 'central-server' | 'local-standalone';
  dbEngine?: 'mysql' | 'local-file';
  dataIsolationLabel?: string;
  dataRevision?: number;
  error?: string;
}

export async function checkErpServerHealth(customBaseUrl?: string): Promise<ServerHealthResult> {
  const desktop = getDesktopBridge();
  const base = customBaseUrl !== undefined ? normalizeServerBaseUrl(customBaseUrl) : getConfiguredApiBaseUrl();
  const targetUrl = base
    ? `${base}/api/v1/health`
    : typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/health`
    : '/api/v1/health';

  const startedAt = performance.now();

  if (desktop && base) {
    const res = await desktop.checkServerHealth(targetUrl);
    return {
      ok: res.ok,
      targetUrl,
      latencyMs: res.latencyMs ?? Math.round(performance.now() - startedAt),
      status: res.status,
      app: res.app,
      version: res.version,
      error: res.error,
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      targetUrl,
      latencyMs,
      status: response.status,
      app: data?.app || 'TLGS-ERP',
      version: data?.version,
      mode: data?.mode || data?.runtimeFormat,
      profile: data?.profile,
      backendMode: data?.backendMode,
      dbEngine: data?.dbEngine,
      dataIsolationLabel: data?.dataIsolationLabel,
      dataRevision: data?.dataRevision,
      error: response.ok ? undefined : data?.error || `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      targetUrl,
      latencyMs: Math.round(performance.now() - startedAt),
      error: err instanceof Error ? err.message : 'Unable to reach ERP server',
    };
  }
}

export function subscribeToErpSyncEvents(
  token: string,
  onSync: (payload: { revision: number; reason?: string; timestamp?: string }) => void
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined' || !token) {
    return () => {};
  }
  const url = `${resolveApiUrl('/api/v1/events/sync')}?token=${encodeURIComponent(token)}`;
  const source = new EventSource(url);
  const handleSync = (evt: MessageEvent) => {
    try {
      const parsed = JSON.parse(evt.data);
      if (parsed && typeof parsed.revision === 'number') {
        onSync(parsed);
      }
    } catch {
      // Ignore malformed heartbeat
    }
  };
  source.addEventListener('sync', handleSync as EventListener);
  return () => {
    source.removeEventListener('sync', handleSync as EventListener);
    source.close();
  };
}
