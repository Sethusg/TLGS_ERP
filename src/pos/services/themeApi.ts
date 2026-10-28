import { PosThemeSettings, PosUser } from '../types/pos';
import { DEFAULT_THEME_SETTINGS } from '../utils/themePresets';

const STORAGE_KEY = 'gsr_pos_custom_theme_settings';
const BROADCAST_CHANNEL_NAME = 'gsr_pos_theme_channel';

// Initialize broadcast channel for real-time multi-tab / multi-screen sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel not available in environment
}

/**
 * Apply the 9 theme CSS variables dynamically to the document root
 */
export function applyThemeCssVariables(theme: PosThemeSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--pos-bg', theme.pos_background_color);
  root.style.setProperty('--header-bg', theme.header_background_color);
  root.style.setProperty('--catalogue-bg', theme.catalogue_background_color);
  root.style.setProperty('--product-card-bg', theme.product_card_background_color);
  root.style.setProperty('--order-panel-bg', theme.order_panel_background_color);
  root.style.setProperty('--sidebar-bg', theme.sidebar_background_color);
  root.style.setProperty('--primary-btn-bg', theme.primary_button_color);
  root.style.setProperty('--text-color', theme.text_color);
  root.style.setProperty('--accent-color', theme.accent_color);

  // Helper dynamic borders based on luminosity
  const isLight = isLightColor(theme.pos_background_color);
  root.style.setProperty(
    '--theme-border',
    isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)'
  );
  root.style.setProperty(
    '--theme-muted',
    isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.65)'
  );
}

function isLightColor(hexColor: string): boolean {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  } catch {
    return false;
  }
}

/**
 * Read cached settings from localStorage for instant initial render
 */
export function getStoredThemeSettings(): PosThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_THEME_SETTINGS;
}

/**
 * Fetch persistent theme settings from the backend database API
 */
export async function fetchThemeSettings(): Promise<PosThemeSettings> {
  try {
    const res = await fetch('/api/theme-settings');
    if (res.ok) {
      const data: PosThemeSettings = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyThemeCssVariables(data);
      return data;
    }
  } catch (err) {
    console.warn('Backend API unavailable, using cached theme settings:', err);
  }
  const cached = getStoredThemeSettings();
  applyThemeCssVariables(cached);
  return cached;
}

/**
 * Save theme settings to backend database API with administrator permission check
 */
export async function saveThemeSettings(
  settings: PosThemeSettings,
  currentUser: PosUser | null
): Promise<{ success: boolean; data: PosThemeSettings; error?: string }> {
  // Security role validation on client before sending
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    return {
      success: false,
      data: settings,
      error: 'Permission denied: Only administrators and managers may modify POS appearance settings.',
    };
  }

  const payload: PosThemeSettings = {
    ...settings,
    updated_by: currentUser.fullName || currentUser.username,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/theme-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-name': currentUser.username,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return {
        success: false,
        data: settings,
        error: errorJson.detail || `Server responded with error status ${res.status}`,
      };
    }

    const saved: PosThemeSettings = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    applyThemeCssVariables(saved);

    // Broadcast update to all connected tabs / POS terminals
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'THEME_UPDATED', theme: saved });
    }

    return { success: true, data: saved };
  } catch (err: any) {
    // Fallback save to localStorage if offline/network failure
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    applyThemeCssVariables(payload);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'THEME_UPDATED', theme: payload });
    }
    return {
      success: true,
      data: payload,
      error: 'Saved to local store (Backend API not reachable).',
    };
  }
}

/**
 * Reset theme settings to default Midnight Navy palette
 */
export async function resetThemeSettings(
  currentUser: PosUser | null
): Promise<{ success: boolean; data: PosThemeSettings; error?: string }> {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    return {
      success: false,
      data: DEFAULT_THEME_SETTINGS,
      error: 'Permission denied: Only administrators and managers may reset POS appearance.',
    };
  }

  try {
    const res = await fetch('/api/theme-settings/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ updated_by: currentUser.fullName }),
    });

    if (res.ok) {
      const data: PosThemeSettings = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      applyThemeCssVariables(data);
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'THEME_UPDATED', theme: data });
      }
      return { success: true, data };
    }
  } catch {
    // ignore
  }

  const fallback: PosThemeSettings = {
    ...DEFAULT_THEME_SETTINGS,
    updated_by: currentUser.fullName,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
  applyThemeCssVariables(fallback);
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'THEME_UPDATED', theme: fallback });
  }
  return { success: true, data: fallback };
}

/**
 * Subscribe to real-time theme updates across POS terminal screens
 */
export function subscribeToThemeUpdates(onUpdate: (theme: PosThemeSettings) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'THEME_UPDATED' && event.data?.theme) {
      applyThemeCssVariables(event.data.theme);
      onUpdate(event.data.theme);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handler);
  }

  // Periodic polling every 8s to pick up changes from other machines/users
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/theme-settings');
      if (res.ok) {
        const remote: PosThemeSettings = await res.json();
        const currentRaw = localStorage.getItem(STORAGE_KEY);
        if (currentRaw) {
          const current = JSON.parse(currentRaw);
          if (remote.updated_at && remote.updated_at !== current.updated_at) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            applyThemeCssVariables(remote);
            onUpdate(remote);
          }
        }
      }
    } catch {
      // offline polling silence
    }
  }, 8000);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handler);
    }
    clearInterval(pollInterval);
  };
}
