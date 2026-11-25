import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist-server');

fs.mkdirSync(OUT_DIR, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(ROOT, 'server.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: path.join(OUT_DIR, 'server.cjs'),
  // Vite is only imported dynamically when NODE_ENV !== 'production'; keep it external so the standalone desktop bundle stays compact
  external: ['vite'],
  define: {
    'process.env.TLGS_BUNDLED_CJS': '"true"',
  },
  sourcemap: false,
  minify: false,
});

console.log('Bundled standalone ERP server to dist-server/server.cjs');
