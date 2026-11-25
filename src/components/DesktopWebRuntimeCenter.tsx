import React, { useEffect, useState } from 'react';
import {
  Monitor,
  Globe,
  CheckCircle2,
  Download,
  Server,
  RefreshCw,
  FolderOpen,
  Printer,
  FileDown,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  Wifi,
  WifiOff,
  Laptop,
  HardDrive,
} from 'lucide-react';
import {
  checkErpServerHealth,
  detectBrowserName,
  detectOperatingSystem,
  DesktopPrinterInfo,
  getConfiguredApiBaseUrl,
  getDesktopBridge,
  getRuntimeMode,
  normalizeServerBaseUrl,
  ServerHealthResult,
  setConfiguredApiBaseUrl,
} from '../utils/platformRuntime';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './Common/PWAInstallControls';

export const DesktopWebRuntimeCenter: React.FC = () => {
  const runtimeMode = getRuntimeMode();
  const desktopBridge = getDesktopBridge();
  const isOnline = useOnlineStatus();
  const browserName = detectBrowserName();
  const osName = detectOperatingSystem();

  const [connectionMode, setConnectionMode] = useState<'local' | 'remote'>(
    getConfiguredApiBaseUrl() ? 'remote' : 'local'
  );
  const [serverUrlInput, setServerUrlInput] = useState<string>(getConfiguredApiBaseUrl());
  const [activeBaseUrl, setActiveBaseUrl] = useState<string>(
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [desktopDataDir, setDesktopDataDir] = useState<string>('');
  const [printers, setPrinters] = useState<DesktopPrinterInfo[]>([]);
  const [health, setHealth] = useState<ServerHealthResult | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const runHealthCheck = async (urlOverride?: string) => {
    setCheckingHealth(true);
    try {
      const result = await checkErpServerHealth(urlOverride);
      setHealth(result);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    if (desktopBridge) {
      desktopBridge
        .getConfig()
        .then((cfg) => {
          setConnectionMode(cfg.mode);
          setServerUrlInput(cfg.serverUrl || '');
          setActiveBaseUrl(cfg.activeBaseUrl || window.location.origin);
          setDesktopDataDir(cfg.dataDir || '');
        })
        .catch(() => {});
      desktopBridge
        .getPrinters()
        .then((list) => setPrinters(list))
        .catch(() => {});
    }
  }, [desktopBridge]);

  const handleSaveServerSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (connectionMode === 'remote') {
      const normalized = normalizeServerBaseUrl(serverUrlInput);
      if (!normalized) {
        setStatusMessage({
          type: 'error',
          text: 'Enter a valid http:// or https:// central TLGS-ERP server URL.',
        });
        return;
      }

      setSavingConfig(true);
      try {
        const testResult = await checkErpServerHealth(normalized);
        setHealth(testResult);
        if (!testResult.ok) {
          setStatusMessage({
            type: 'error',
            text: `Server health check failed for ${normalized} (${testResult.error || 'Unreachable'}).`,
          });
          return;
        }

        if (desktopBridge) {
          const res = await desktopBridge.setServerConfig({
            mode: 'remote',
            serverUrl: normalized,
          });
          if (!res.success) {
            setStatusMessage({
              type: 'error',
              text: res.error || 'Could not switch desktop server configuration.',
            });
            return;
          }
          setActiveBaseUrl(res.activeBaseUrl || normalized);
        } else {
          setConfiguredApiBaseUrl(normalized);
          setActiveBaseUrl(normalized);
        }

        setStatusMessage({
          type: 'success',
          text: `Connected to central TLGS-ERP server (${normalized}). Both Web and Windows Desktop now share this backend.`,
        });
      } finally {
        setSavingConfig(false);
      }
      return;
    }

    // Local / Same-Origin mode
    setSavingConfig(true);
    try {
      if (desktopBridge) {
        const res = await desktopBridge.setServerConfig({
          mode: 'local',
          serverUrl: '',
        });
        if (!res.success) {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Could not switch to Local Standalone Server mode.',
          });
          return;
        }
        setActiveBaseUrl(res.activeBaseUrl || window.location.origin);
      } else {
        setConfiguredApiBaseUrl('');
        setActiveBaseUrl(window.location.origin);
      }
      await runHealthCheck('');
      setStatusMessage({
        type: 'success',
        text: desktopBridge
          ? 'Switched to Standalone Local Windows Server mode.'
          : 'Switched to Same-Origin Web Server mode.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyCommand = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleDesktopExportPdf = async () => {
    if (!desktopBridge) {
      window.print();
      return;
    }
    const res = await desktopBridge.exportPdf('TLGS-ERP-Snapshot.pdf');
    if (res.success && res.filePath) {
      setStatusMessage({
        type: 'success',
        text: `PDF exported cleanly to ${res.filePath}`,
      });
    } else if (!res.canceled && res.error) {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  const handleDesktopPrint = async () => {
    if (!desktopBridge) {
      window.print();
      return;
    }
    const res = await desktopBridge.printCurrentPage({ silent: false });
    if (!res.success && res.error && res.error !== 'Print canceled') {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  const runtimeLabel =
    runtimeMode === 'windows-desktop-exe'
      ? 'Windows 11 Standalone Desktop (.exe)'
      : runtimeMode === 'pwa-standalone'
      ? `Installed Desktop Web App (${browserName})`
      : `Web Browser (${browserName})`;

  return (
    <div className="space-y-6">
      {/* Unified Runtime Status Banner */}
      <div className="bg-[#0B1F3A] text-white rounded-xl p-6 border border-[#D4AF37]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            {runtimeMode === 'windows-desktop-exe' ? (
              <Monitor className="w-6 h-6 text-[#D4AF37]" />
            ) : (
              <Globe className="w-6 h-6 text-[#D4AF37]" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              Unified Dual-Format ERP Runtime
            </p>
            <h2 className="text-lg font-bold mt-0.5">{runtimeLabel}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              TLGS-ERP operates from a single shared codebase and backend API across both{' '}
              <strong>Chrome / Microsoft Edge Web</strong> and the{' '}
              <strong>Standalone Windows 11 Desktop (.exe)</strong> application.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              isOnline && health?.ok
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-amber-500/15 border-amber-400/40 text-amber-200'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>
              {health?.ok
                ? `ERP Server Online (${health.latencyMs}ms)`
                : checkingHealth
                ? 'Checking Server...'
                : 'Server Unreachable'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => runHealthCheck()}
            disabled={checkingHealth}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Test Sync</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Two Supported Distribution Formats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format 1: Web Application (Chrome & Microsoft Edge) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    1. Web Application (Chrome &amp; Edge)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Browser-native ERP + installable Desktop Web App (PWA)
                  </p>
                </div>
              </div>
              {runtimeMode !== 'windows-desktop-exe' && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  Active Now
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 rounded-lg p-3 border border-slate-200/80">
              <div>
                <span className="text-[10.5px] text-slate-500 block">Detected Browser</span>
                <span className="font-semibold text-[#0B1F3A]">{browserName}</span>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-500 block">Operating System</span>
                <span className="font-semibold text-[#0B1F3A]">{osName}</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Full compatibility with Google Chrome &amp; Microsoft Edge on Windows 11.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Web App Manifest &amp; Service Worker enabled for instant standalone window launch.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero client installation required for staff, parents, and branch offices.</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <PWAInstallButton variant="button" />
            <span className="text-[11px] text-slate-500">
              Or use Chrome/Edge address bar &rarr; <strong>Install TLGS-ERP</strong>
            </span>
          </div>
        </div>

        {/* Format 2: Standalone Windows 11 Desktop Application (.exe) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#0B1F3A]/10 border border-[#0B1F3A]/20 flex items-center justify-center text-[#0B1F3A]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">
                    2. Standalone Windows 11 Desktop (.exe)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Installable NSIS Setup (.exe) &amp; Portable Windows 11 x64 Executable
                  </p>
                </div>
              </div>
              {runtimeMode === 'windows-desktop-exe' && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  Running Native EXE
                </span>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Windows 11 Start Menu, Desktop Shortcut, Taskbar Pinning &amp; Uninstaller.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Works Standalone (embedded local ERP server) OR synced to Central School Server.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hardened Electron runtime (contextIsolation, sandbox, native printing &amp; A4 PDF export).</span>
              </li>
            </ul>
          </div>

          {desktopBridge ? (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDesktopPrint}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#15315B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Native Print</span>
              </button>
              <button
                type="button"
                onClick={handleDesktopExportPdf}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export A4 PDF</span>
              </button>
              <button
                type="button"
                onClick={() => desktopBridge.openDataFolder()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Data Folder</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
              <span>Output artifacts: <code className="text-[#0B1F3A] font-semibold">release/TLGS-ERP-nsis-1.0.0-win-x64.exe</code></span>
            </div>
          )}
        </div>
      </div>

      {/* Shared Server Sync Configuration (Unifies Web + Windows Desktop EXE) */}
      <form
        onSubmit={handleSaveServerSync}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                Shared ERP Backend &amp; Database Connection
              </h3>
              <p className="text-xs text-slate-500">
                Point both Chrome/Edge Web users and Windows 11 Desktop EXE workstations to the same TLGS-ERP server for real-time shared data.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 truncate max-w-[260px]">
            {activeBaseUrl || 'Same-Origin'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
              connectionMode === 'local'
                ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="erpConnectionMode"
              checked={connectionMode === 'local'}
              onChange={() => setConnectionMode('local')}
              className="mt-0.5 accent-[#0B1F3A]"
            />
            <div>
              <span className="text-xs font-bold text-[#0B1F3A] block">
                {desktopBridge ? 'Standalone Local Server (Offline Ready)' : 'Default Same-Origin ERP Server'}
              </span>
              <span className="text-[11px] text-slate-500">
                {desktopBridge
                  ? `Runs embedded ERP server locally on 127.0.0.1 (${desktopDataDir || '%APPDATA%\\TLGS-ERP\\data'}).`
                  : 'Uses the active web host origin automatically with zero extra configuration.'}
              </span>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${
              connectionMode === 'remote'
                ? 'border-[#0B1F3A] bg-[#0B1F3A]/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="erpConnectionMode"
              checked={connectionMode === 'remote'}
              onChange={() => setConnectionMode('remote')}
              className="mt-0.5 accent-[#0B1F3A]"
            />
            <div>
              <span className="text-xs font-bold text-[#0B1F3A] block">
                Connected Central School Server (Multi-Workstation Sync)
              </span>
              <span className="text-[11px] text-slate-500">
                Connects this client to your central cloud or campus LAN TLGS-ERP server URL.
              </span>
            </div>
          </label>
        </div>

        {connectionMode === 'remote' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Central TLGS-ERP Server Base URL (HTTPS or Campus LAN HTTP)
            </label>
            <input
              type="url"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="https://erp.yourschool.edu.in  or  http://192.168.1.50:3000"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/15"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bearer session tokens remain memory-scoped; HTTPS recommended for remote production servers.</span>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#15315B] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
            <span>Verify &amp; Save Server Mode</span>
          </button>
        </div>
      </form>

      {/* Native Windows 11 Printers (Shown when running in Desktop EXE) */}
      {desktopBridge && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#0B1F3A]" />
            <h3 className="text-sm font-bold text-[#0B1F3A]">
              Detected Windows 11 Printers ({printers.length})
            </h3>
          </div>
          {printers.length === 0 ? (
            <p className="text-xs text-slate-500">No Windows printers detected on this workstation.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {printers.map((p) => (
                <div
                  key={p.name}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B1F3A] truncate">{p.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.name}</p>
                  </div>
                  {p.isDefault && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Windows 11 Installable EXE Build & Distribution Commands */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F3A]">
              Build Windows 11 Installable EXE Package
            </h3>
            <p className="text-xs text-slate-500">
              Generate the standalone Windows 11 x64 NSIS Installer (.exe) and Portable (.exe) locally on Windows 11 or via the included GitHub Actions workflow.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'npm-win',
              title: '1. One-Command Windows 11 EXE Build (Node 20+)',
              cmd: 'npm run desktop:build:win',
              desc: 'Builds Web UI, bundles embedded ERP server, and outputs NSIS Installer + Portable .exe in release/.',
            },
            {
              id: 'ps1-win',
              title: '2. Windows 11 PowerShell Automated Builder',
              cmd: 'powershell -ExecutionPolicy Bypass -File scripts/build-windows-exe.ps1',
              desc: 'Installs dependencies and compiles both Windows 11 .exe installers automatically.',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0B1F3A]">{item.title}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCommand(item.id, item.cmd)}
                  className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-[#0B1F3A] text-amber-200 px-3 py-2 rounded-md overflow-x-auto">
                {item.cmd}
              </pre>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 px-4 py-3 text-xs text-slate-700">
          <strong className="text-[#0B1F3A]">Cloud CI Build Ready:</strong> Trigger{' '}
          <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-blue-200">
            .github/workflows/build-windows-exe.yml
          </code>{' '}
          from GitHub Actions (&ldquo;Run workflow&rdquo;) to compile and download signed-ready Windows 11{' '}
          <code>.exe</code> installers without needing a local Windows build machine.
        </div>
      </div>
    </div>
  );
};
