'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
} = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const os = require('os');
const path = require('path');

// Windows 11 AppUserModelID for native Start Menu, Taskbar pinning & notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tlgserp.desktop');
}

const isDev = process.env.TLGS_ELECTRON_DEV === 'true';
const APP_NAME = 'TLGS-ERP';

let mainWindow = null;
let embeddedServerProcess = null;
let activeLocalBaseUrl = '';

function getUserDataPaths() {
  const userDataDir = app.getPath('userData');
  // Strictly isolated local standalone store — never collides with shared production DB
  const dataDir = path.join(userDataDir, 'local-standalone-data');
  const backupDir = path.join(userDataDir, 'local-standalone-backups');
  const configPath = path.join(userDataDir, 'desktop-config.json');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  return { userDataDir, dataDir, backupDir, configPath };
}

function validateHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
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

function loadDesktopConfig() {
  const { configPath } = getUserDataPaths();
  const envRemoteUrl = validateHttpUrl(process.env.TLGS_REMOTE_SERVER_URL || '');
  const defaultConfig = {
    mode: envRemoteUrl ? 'remote' : 'local',
    serverUrl: envRemoteUrl,
    windowBounds: { width: 1380, height: 860 },
  };

  try {
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const validUrl = validateHttpUrl(parsed.serverUrl || '');
      return {
        mode: parsed.mode === 'remote' && validUrl ? 'remote' : 'local',
        serverUrl: validUrl,
        windowBounds: parsed.windowBounds || defaultConfig.windowBounds,
      };
    }
  } catch (err) {
    console.error('[TLGS-Desktop] Failed to read desktop-config.json:', err);
  }
  return defaultConfig;
}

function saveDesktopConfig(nextConfig) {
  const { configPath } = getUserDataPaths();
  const current = loadDesktopConfig();
  const merged = {
    ...current,
    ...nextConfig,
  };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function findAvailablePort(preferredPort = 3410) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.on('error', reject);
      fallback.listen(0, '127.0.0.1', () => {
        const addr = fallback.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3411;
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferredPort, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : preferredPort;
      server.close(() => resolve(port));
    });
  });
}

function checkUrlHealth(targetUrl, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const valid = validateHttpUrl(targetUrl);
    if (!valid) {
      resolve({ ok: false, error: 'Invalid HTTP/HTTPS URL' });
      return;
    }

    const startedAt = Date.now();
    const parsed = new URL(valid);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      valid,
      { timeout: timeoutMs },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const latencyMs = Date.now() - startedAt;
          let json = {};
          try {
            json = JSON.parse(body);
          } catch {
            // Non-JSON response
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            latencyMs,
            app: json.app || APP_NAME,
            version: json.version || app.getVersion(),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Connection timed out' });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
  });
}

async function waitForLocalServer(baseUrl, retries = 45, delayMs = 250) {
  for (let i = 0; i < retries; i++) {
    const health = await checkUrlHealth(`${baseUrl}/api/v1/health`, 1500);
    if (health.ok) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function resolvePackagedPaths() {
  const rootDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : path.resolve(__dirname, '..');
  const distServerPath = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'server.cjs')
    : path.resolve(__dirname, '..', 'dist-server', 'server.cjs');
  const distWebDir = app.isPackaged
    ? path.join(process.resourcesPath, 'dist')
    : path.resolve(__dirname, '..', 'dist');
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build', 'icon.png')
    : path.resolve(__dirname, '..', 'build', 'icon.png');
  return { rootDir, distServerPath, distWebDir, iconPath };
}

async function startEmbeddedErpServer() {
  if (embeddedServerProcess && activeLocalBaseUrl) {
    return activeLocalBaseUrl;
  }

  if (isDev) {
    activeLocalBaseUrl = process.env.TLGS_DEV_URL || 'http://127.0.0.1:3000';
    return activeLocalBaseUrl;
  }

  const { distServerPath, distWebDir } = resolvePackagedPaths();
  if (!fs.existsSync(distServerPath)) {
    throw new Error(
      `Bundled ERP server missing at ${distServerPath}. Run "npm run desktop:prepare" before launching.`
    );
  }

  const { dataDir, backupDir } = getUserDataPaths();
  const port = await findAvailablePort(3410);
  const baseUrl = `http://127.0.0.1:${port}`;

  // Launch the exact same TLGS-ERP server using Electron's embedded Node runtime (Mode B: Local Standalone)
  embeddedServerProcess = spawn(process.execPath, [distServerPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: String(port),
      TLGS_HOST: '127.0.0.1',
      TLGS_PROFILE: 'local-standalone',
      TLGS_BACKEND_MODE: 'local-standalone',
      TLGS_DATA_DIR: dataDir,
      TLGS_BACKUP_DIR: backupDir,
      TLGS_DIST_DIR: distWebDir,
      TLGS_RUNTIME_MODE: 'windows-desktop-exe',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  embeddedServerProcess.stdout?.on('data', (chunk) => {
    console.log(`[TLGS-Server] ${chunk.toString().trim()}`);
  });
  embeddedServerProcess.stderr?.on('data', (chunk) => {
    console.error(`[TLGS-Server:err] ${chunk.toString().trim()}`);
  });
  embeddedServerProcess.on('exit', (code) => {
    console.log(`[TLGS-Server] Exited with code ${code}`);
    embeddedServerProcess = null;
    activeLocalBaseUrl = '';
  });

  const healthy = await waitForLocalServer(baseUrl);
  if (!healthy) {
    stopEmbeddedErpServer();
    throw new Error('Embedded TLGS-ERP server failed to start within timeout.');
  }

  activeLocalBaseUrl = baseUrl;
  return baseUrl;
}

function stopEmbeddedErpServer() {
  if (embeddedServerProcess) {
    try {
      embeddedServerProcess.kill();
    } catch {
      // Ignore already exited
    }
    embeddedServerProcess = null;
    activeLocalBaseUrl = '';
  }
}

function buildApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Print Current View',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.print({ silent: false, printBackground: true });
          },
        },
        {
          label: 'Export Current View as PDF',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: async () => {
            await exportCurrentWindowToPdf('TLGS-ERP-Document.pdf');
          },
        },
        { type: 'separator' },
        {
          label: 'Open Local Data Folder',
          click: () => {
            const { dataDir } = getUserDataPaths();
            shell.openPath(dataDir);
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit TLGS-ERP' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About TLGS-ERP Desktop',
          click: () => {
            const config = loadDesktopConfig();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TLGS-ERP Desktop',
              message: 'TLGS-ERP – Multi-School Management ERP',
              detail: [
                `Version: ${app.getVersion()}`,
                `Runtime: Standalone Windows 11 Desktop Application`,
                `Mode: ${config.mode === 'remote' ? `Connected Server (${config.serverUrl})` : 'Local Standalone Server'}`,
                `Platform: ${process.platform} (${process.arch})`,
              ].join('\n'),
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function exportCurrentWindowToPdf(suggestedFileName = 'TLGS-ERP-Report.pdf') {
  if (!mainWindow) return { success: false, error: 'Window unavailable' };
  const safeName = String(suggestedFileName || 'TLGS-ERP-Report.pdf')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.pdf$/i, '') + '.pdf';

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export TLGS-ERP PDF',
    defaultPath: path.join(app.getPath('documents'), safeName),
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    const pdfBuffer = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' },
    });
    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'PDF export failed' };
  }
}

async function resolveTargetStartUrl() {
  const config = loadDesktopConfig();
  if (config.mode === 'remote' && config.serverUrl) {
    const health = await checkUrlHealth(`${config.serverUrl}/api/v1/health`, 4000);
    if (health.ok) {
      return config.serverUrl;
    }

    // Strict Safety Rule: NEVER silently fall back from Central Server Mode (Mode A)
    // into Local Standalone Mode (Mode B), which could create split-brain records.
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: [
        'Retry Central Server',
        'Switch to Isolated Local Standalone Mode',
        'Exit TLGS-ERP',
      ],
      defaultId: 0,
      cancelId: 2,
      title: 'Central TLGS-ERP Server Unreachable',
      message: `Cannot reach Central ERP Server: ${config.serverUrl}`,
      detail: [
        `Error: ${health.error || 'Server did not respond'}`,
        '',
        'To protect shared school production records, TLGS-ERP will NOT silently create a separate local database.',
        'Choose "Retry Central Server" once network/VPN is restored, or explicitly switch to Local Standalone Mode (isolated local store).',
      ].join('\n'),
    });

    if (response === 0) {
      return resolveTargetStartUrl();
    }
    if (response === 1) {
      saveDesktopConfig({ mode: 'local', serverUrl: config.serverUrl });
      return startEmbeddedErpServer();
    }
    app.quit();
    return null;
  }
  return startEmbeddedErpServer();
}

async function createMainWindow() {
  const config = loadDesktopConfig();
  const { iconPath } = resolvePackagedPaths();

  mainWindow = new BrowserWindow({
    width: config.windowBounds?.width || 1380,
    height: config.windowBounds?.height || 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'TLGS-ERP – Multi-School Management System',
    backgroundColor: '#0B1F3A',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  // Security: strictly validate popup/external URLs
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const safeUrl = validateHttpUrl(url);
    if (safeUrl) {
      shell.openExternal(safeUrl);
    }
    return { action: 'deny' };
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      const bounds = mainWindow.getBounds();
      saveDesktopConfig({
        windowBounds: { width: bounds.width, height: bounds.height },
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  try {
    const targetUrl = await resolveTargetStartUrl();
    if (targetUrl) {
      await mainWindow.loadURL(targetUrl);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dialog.showErrorBox('TLGS-ERP Startup Error', message);
  }
}

// Register hardened IPC handlers
function registerIpcHandlers() {
  ipcMain.handle('tlgs:getConfig', async () => {
    const config = loadDesktopConfig();
    const { dataDir } = getUserDataPaths();
    return {
      mode: config.mode,
      serverUrl: config.serverUrl,
      activeBaseUrl:
        config.mode === 'remote' && config.serverUrl
          ? config.serverUrl
          : activeLocalBaseUrl,
      dataDir,
    };
  });

  ipcMain.handle('tlgs:setServerConfig', async (_event, payload) => {
    const mode = payload?.mode === 'remote' ? 'remote' : 'local';
    const validUrl = validateHttpUrl(payload?.serverUrl || '');
    if (mode === 'remote' && !validUrl) {
      return {
        success: false,
        error: 'Please enter a valid http:// or https:// TLGS-ERP server URL.',
      };
    }

    if (mode === 'remote') {
      const health = await checkUrlHealth(`${validUrl}/api/v1/health`, 4000);
      if (!health.ok) {
        return {
          success: false,
          error: `Could not reach ${validUrl}/api/v1/health (${health.error || 'Unreachable'}).`,
        };
      }
    }

    saveDesktopConfig({ mode, serverUrl: validUrl });
    const targetUrl =
      mode === 'remote' ? validUrl : await startEmbeddedErpServer();

    if (mainWindow) {
      await mainWindow.loadURL(targetUrl);
    }

    return {
      success: true,
      activeBaseUrl: targetUrl,
    };
  });

  ipcMain.handle('tlgs:getPrinters', async () => {
    if (!mainWindow) return [];
    try {
      const printers = await mainWindow.webContents.getPrintersAsync();
      return printers.map((p) => ({
        name: p.name,
        displayName: p.displayName || p.name,
        description: p.description || '',
        status: p.status,
        isDefault: Boolean(p.isDefault),
      }));
    } catch {
      return [];
    }
  });

  ipcMain.handle('tlgs:printCurrentPage', async (_event, options = {}) => {
    if (!mainWindow) return { success: false, error: 'Window unavailable' };
    return new Promise((resolve) => {
      mainWindow.webContents.print(
        {
          silent: Boolean(options.silent),
          printBackground: true,
          deviceName: typeof options.deviceName === 'string' ? options.deviceName : undefined,
          landscape: Boolean(options.landscape),
        },
        (success, failureReason) => {
          resolve(
            success
              ? { success: true }
              : { success: false, error: failureReason || 'Print canceled' }
          );
        }
      );
    });
  });

  ipcMain.handle('tlgs:exportPdf', async (_event, suggestedFileName) => {
    return exportCurrentWindowToPdf(suggestedFileName);
  });

  ipcMain.handle('tlgs:openDataFolder', async () => {
    const { dataDir } = getUserDataPaths();
    await shell.openPath(dataDir);
    return { success: true };
  });

  ipcMain.handle('tlgs:checkServerHealth', async (_event, targetUrl) => {
    return checkUrlHealth(targetUrl, 4000);
  });

  ipcMain.handle('tlgs:relaunch', async () => {
    stopEmbeddedErpServer();
    app.relaunch();
    app.exit(0);
  });
}

// Enforce single desktop instance on Windows 11
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    registerIpcHandlers();
    buildApplicationMenu();
    await createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('before-quit', () => {
    stopEmbeddedErpServer();
  });

  app.on('window-all-closed', () => {
    stopEmbeddedErpServer();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
