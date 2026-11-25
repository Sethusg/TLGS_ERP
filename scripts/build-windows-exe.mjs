import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.join(ROOT, 'desktop');

const targetArg = process.argv[2] || 'win';
const scriptMap = {
  win: 'build:win',
  nsis: 'build:win-nsis',
  portable: 'build:win-portable',
  dev: 'start',
};
const desktopScript = scriptMap[targetArg] || 'build:win';

function run(cmd, cwd = ROOT, env = process.env) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env });
}

// 1. Ensure crisp Web + Windows 11 icons exist
run('node scripts/generate-brand-icons.mjs', ROOT);

// 2. Build the shared React + Vite production frontend (dist/)
run('npm run build', ROOT);

// 3. Bundle the shared TLGS-ERP Node/Express backend (dist-server/server.cjs)
run('node scripts/build-desktop-server.mjs', ROOT);

// 4. Ensure Electron + electron-builder are installed in desktop/
if (!fs.existsSync(path.join(DESKTOP_DIR, 'node_modules', 'electron'))) {
  console.log('\nInstalling Electron & electron-builder inside desktop/ ...');
  run('npm install', DESKTOP_DIR);
}

// 5. Launch or package the Windows 11 Desktop .exe
if (targetArg === 'dev') {
  run('npx electron ../electron/main.cjs', DESKTOP_DIR, {
    ...process.env,
    TLGS_ELECTRON_DEV: 'true',
  });
} else {
  run(`npm run ${desktopScript}`, DESKTOP_DIR);
  console.log('\nWindows 11 Desktop EXE artifacts generated in ./release/');
}
