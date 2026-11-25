# TLGS-ERP Windows 11 Standalone EXE Builder
# Run this script in PowerShell on Windows 11 (x64) with Node.js 20+ installed.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " TLGS-ERP - Windows 11 Standalone Installer (.exe) Builder" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 20+ is required. Download from https://nodejs.org/"
    exit 1
}

Write-Host "[1/4] Installing shared TLGS-ERP web dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[2/4] Generating brand icons, building Web UI & bundling embedded ERP server..." -ForegroundColor Yellow
npm run desktop:prepare

Write-Host "[3/4] Installing Windows 11 Electron packaging toolchain..." -ForegroundColor Yellow
Push-Location desktop
npm install
Pop-Location

Write-Host "[4/4] Packaging Windows 11 NSIS Installer (.exe) & Portable (.exe)..." -ForegroundColor Yellow
node scripts/build-windows-exe.mjs win

Write-Host ""
Write-Host "Build complete! Installable Windows 11 .exe files are ready in: .\release\" -ForegroundColor Green
