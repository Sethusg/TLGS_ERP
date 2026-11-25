# TLGS-ERP – Dual Format Deployment Guide (Web Chrome/Edge + Windows 11 Desktop EXE)

TLGS-ERP runs from **one unified codebase** in two supported formats that share the exact same UI, RBAC permissions, multi-school architecture, and backend APIs:

1. **Web Application (Google Chrome & Microsoft Edge)** — Includes full Progressive Web App (PWA) support with in-app installation (`Install App`), offline indicator, and standalone app window launch.
2. **Standalone Windows 11 Desktop Application (.exe)** — Built with Electron + `electron-builder` (NSIS Installer + Portable `.exe`) bundling both the shared frontend and embedded TLGS-ERP server, with one-click switching between **Standalone Local Mode** and **Connected Central Server Mode**.

---

## Option A: Run as Web Application (Chrome & Edge)

```bash
npm install
npm run build
NODE_ENV=production npm start
```

Open `http://localhost:3000` (or your HTTPS school domain) in **Google Chrome** or **Microsoft Edge**. Users can click **Install App** inside the top bar or System Settings to pin TLGS-ERP as a standalone Windows 11 Web App.

---

## Option B: Build Standalone Windows 11 Installable EXE (Locally on Windows 11)

**Requirements:** Windows 11 (64-bit) and Node.js 20+.

### One-Command Build
```powershell
npm install
npm run desktop:build:win
```

Or run the automated PowerShell builder:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows-exe.ps1
```

### Generated Windows 11 Executables (in `./release/`)
- `TLGS-ERP-nsis-1.0.0-win-x64.exe` — Full Windows 11 Installer (custom install folder, Desktop shortcut, Start Menu entry, Windows Apps & Features uninstaller).
- `TLGS-ERP-Portable-1.0.0-win-x64.exe` — Zero-install standalone executable.

---

## Option C: Build Windows 11 EXE via GitHub Actions (No Windows PC Required)

1. Push this repository to GitHub.
2. Go to **Actions → Build TLGS-ERP Windows 11 Installer (.exe) → Run workflow**.
3. Download the **`TLGS-ERP-Windows11-EXE`** artifact containing the ready-to-install `.exe` files.

---

## Operating Both Formats as the Same ERP System

- **Central Server Sync Mode**: Open **System Settings → Web & Windows Desktop**, select **Connected Central School Server**, and enter your central TLGS-ERP URL (e.g. `https://erp.yourschool.edu.in` or `http://192.168.1.50:3000`). Both Chrome/Edge web users and Windows 11 `.exe` workstations will operate on the exact same live database.
- **Standalone Local Mode (Windows 11 EXE)**: Out of the box, double-clicking the installed Windows 11 app automatically starts the embedded TLGS-ERP server on `127.0.0.1` and persists data securely inside `%APPDATA%\TLGS-ERP\data\tlgs_erp_store.json`.
