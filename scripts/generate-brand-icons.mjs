import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BUILD_DIR = path.join(ROOT, 'build');

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Pure Node CRC32 for valid PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // None filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Rasterize crisp TLGS-ERP brand emblem (Navy #0B1F3A + Royal Gradient + Gold #D4AF37 shield & monogram)
function renderBrandRgba(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  // Safe zone scaling: maskable icons keep emblem well inside central 72%
  const scale = maskable ? 0.68 : 0.84;
  const radius = maskable ? 0 : size * 0.2;

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const idx = (y * size + x) * 4;
    if (a === 255) {
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
      return;
    }
    const alpha = a / 255;
    const inv = 1 - alpha;
    buf[idx] = Math.round(r * alpha + buf[idx] * inv);
    buf[idx + 1] = Math.round(g * alpha + buf[idx + 1] * inv);
    buf[idx + 2] = Math.round(b * alpha + buf[idx + 2] * inv);
    buf[idx + 3] = Math.min(255, Math.round(a + buf[idx + 3] * inv));
  };

  // Rounded-rect SDF
  const inRoundedRect = (px, py, rx, ry, rw, rh, rad) => {
    const qx = Math.abs(px - (rx + rw / 2)) - (rw / 2 - rad);
    const qy = Math.abs(py - (ry + rh / 2)) - (rh / 2 - rad);
    const dx = Math.max(qx, 0);
    const dy = Math.max(qy, 0);
    return Math.hypot(dx, dy) + Math.min(Math.max(qx, qy), 0) <= rad;
  };

  // 1. Background (Deep Navy to Indigo Enterprise Gradient)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!maskable && !inRoundedRect(x, y, 0, 0, size, size, radius)) {
        continue;
      }
      const t = (x * 0.45 + y * 0.55) / size;
      const r = Math.round(11 + t * 24); // #0B1F3A -> #233368
      const g = Math.round(31 + t * 18);
      const b = Math.round(58 + t * 56);
      setPixel(x, y, r, g, b, 255);
    }
  }

  // 2. Gold Outer Ring + Inner Crest Shield
  const outerR = (size * 0.44) * scale;
  const ringThick = Math.max(2, size * 0.036 * scale);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= outerR && dist >= outerR - ringThick) {
        // Metallic gold gradient
        const gt = (x + y) / (size * 2);
        setPixel(
          x,
          y,
          Math.round(212 + gt * 34),
          Math.round(175 + gt * 30),
          Math.round(55 + gt * 28),
          255
        );
      } else if (dist < outerR - ringThick) {
        // Subtle inner navy medallion sheen
        const sheen = Math.max(0, 1 - dist / outerR);
        setPixel(
          x,
          y,
          Math.round(18 + sheen * 22),
          Math.round(43 + sheen * 32),
          Math.round(84 + sheen * 44),
          255
        );
      }
    }
  }

  // 3. Crisp Geometric Gold "TL" Monogram + Graduation Cap Accent inside safe zone
  const drawRectNorm = (nx, ny, nw, nh, col) => {
    const x0 = Math.round(cx + (nx - 0.5) * size * scale);
    const y0 = Math.round(cy + (ny - 0.5) * size * scale);
    const x1 = Math.round(cx + (nx + nw - 0.5) * size * scale);
    const y1 = Math.round(cy + (ny + nh - 0.5) * size * scale);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        setPixel(x, y, col[0], col[1], col[2], 255);
      }
    }
  };

  const gold = [232, 194, 82];
  const white = [255, 255, 255];

  // Top gold crown bar (academic cap)
  drawRectNorm(0.32, 0.24, 0.36, 0.055, gold);
  drawRectNorm(0.45, 0.19, 0.1, 0.055, gold);

  // "T" in crisp white
  drawRectNorm(0.24, 0.36, 0.24, 0.075, white);
  drawRectNorm(0.325, 0.36, 0.075, 0.36, white);

  // "L" in bright gold
  drawRectNorm(0.54, 0.36, 0.075, 0.36, gold);
  drawRectNorm(0.54, 0.645, 0.22, 0.075, gold);

  // Accent bar underneath
  drawRectNorm(0.34, 0.77, 0.32, 0.032, [111, 168, 255]);

  return buf;
}

function buildWindowsIco(pngEntries) {
  // ICONDIR header (6 bytes) + ICONDIRENTRY (16 bytes * N) + PNG payloads
  const count = pngEntries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = 1 (ICO)
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  const payloads = [];

  for (const { size, png } of pngEntries) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // palette colors
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

// 1. Write crisp SVG brand icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="tlgsBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1F3A" />
      <stop offset="55%" stop-color="#1A2E66" />
      <stop offset="100%" stop-color="#5B21B6" />
    </linearGradient>
    <linearGradient id="tlgsGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F6D365" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="104" fill="url(#tlgsBg)" />
  <circle cx="256" cy="256" r="190" fill="#10254A" stroke="url(#tlgsGold)" stroke-width="18" />
  <path d="M170 156 L256 120 L342 156 L256 188 Z" fill="url(#tlgsGold)" />
  <rect x="134" y="210" width="112" height="34" rx="8" fill="#FFFFFF" />
  <rect x="173" y="210" width="34" height="156" rx="8" fill="#FFFFFF" />
  <rect x="278" y="210" width="34" height="156" rx="8" fill="url(#tlgsGold)" />
  <rect x="278" y="332" width="102" height="34" rx="8" fill="url(#tlgsGold)" />
  <rect x="186" y="394" width="140" height="12" rx="6" fill="#60A5FA" />
</svg>
`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgContent, 'utf8');

// 2. Write PWA PNG icons + Apple Touch Icon + Electron Window Icon
const png192 = encodePng(192, 192, renderBrandRgba(192, { maskable: false }));
const png512 = encodePng(512, 512, renderBrandRgba(512, { maskable: false }));
const pngMaskable512 = encodePng(512, 512, renderBrandRgba(512, { maskable: true }));
const pngApple180 = encodePng(180, 180, renderBrandRgba(180, { maskable: true }));

fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), pngMaskable512);
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), pngApple180);
fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), png512);

// 3. Write Multi-Resolution Windows 11 .ico (16, 32, 48, 256)
const icoSizes = [16, 32, 48, 256];
const icoEntries = icoSizes.map((size) => ({
  size,
  png: encodePng(size, size, renderBrandRgba(size, { maskable: false })),
}));
const icoBuf = buildWindowsIco(icoEntries);
fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), icoBuf);
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuf);

console.log('Generated TLGS-ERP Web PWA PNGs, SVG, favicon.ico, and Windows 11 build/icon.ico successfully.');
