'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('tlgsDesktop', Object.freeze({
  isDesktop: true,
  platform: process.platform,
  arch: process.arch,
  appVersion: process.env.npm_package_version || '1.0.0',
  electronVersion: process.versions.electron || '',
  osRelease: os.release(),
  getConfig: () => ipcRenderer.invoke('tlgs:getConfig'),
  setServerConfig: (config) => ipcRenderer.invoke('tlgs:setServerConfig', config),
  getPrinters: () => ipcRenderer.invoke('tlgs:getPrinters'),
  printCurrentPage: (options) => ipcRenderer.invoke('tlgs:printCurrentPage', options),
  exportPdf: (suggestedFileName) => ipcRenderer.invoke('tlgs:exportPdf', suggestedFileName),
  openDataFolder: () => ipcRenderer.invoke('tlgs:openDataFolder'),
  relaunch: () => ipcRenderer.invoke('tlgs:relaunch'),
  checkServerHealth: (targetUrl) => ipcRenderer.invoke('tlgs:checkServerHealth', targetUrl),
}));
