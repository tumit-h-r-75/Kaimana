/**
 * Renders the Kaimana icon set from one source diamond.
 *
 * Everything derives from the same four-facet mark so the favicon, the PWA
 * icons and the social card cannot drift apart. The .ico is assembled by
 * hand because sharp has no ICO encoder — the format allows a PNG payload
 * inside the directory entry, which is what every current browser reads.
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BG = "#0A0B0D";
const ACCENT = "#4FF0C5";
// Defaults to the project root (this file's parent's parent) so the script
// can be run as `node scripts/generate-icons.mjs` from anywhere.
const OUT = process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url));

/** The mark, drawn to fit a `size` box with `pad` breathing room. */
const diamond = (size, stroke) => {
  const c = size / 2, r = size * 0.34;
  const top = c - r, bottom = c + r, left = c - r, right = c + r;
  // The crown line sits 1/3 down; on 45° sides that puts its ends exactly
  // (y - top) away from each side, so it lands on the edges.
  // The sides run at 45°, so `dx` below the apex the outline is exactly `dx`
  // either side of centre — the crown line has to end at c ± dx. Measuring it
  // in from left/right instead is the easy mistake: it halves the line and
  // the cut reads as a narrow wedge rather than a table.
  const y = top + (r * 2) / 3, dx = y - top;
  return `
    <path d="M${c} ${top} ${right} ${c} ${c} ${bottom} ${left} ${c}Z"/>
    <path d="M${c - dx} ${y}H${c + dx}" stroke-opacity=".85"/>
    <path d="M${c - dx} ${y} ${c} ${bottom}" stroke-opacity=".6"/>
    <path d="M${c + dx} ${y} ${c} ${bottom}" stroke-opacity=".6"/>`
    .replace(/<path /g, `<path fill="none" stroke="${ACCENT}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" `);
};

const iconSvg = (size, { radius = size * 0.22, stroke = size * 0.062 } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  ${diamond(size, stroke)}
</svg>`;

const png = (svg) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

/** Minimal single-image ICO wrapping a 32x32 PNG. */
const ico = (pngBuf) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32; entry[1] = 32; entry[2] = 0; entry[3] = 0;
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuf.length, 8); entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuf]);
};

const ogSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <circle cx="980" cy="120" r="300" fill="${ACCENT}" opacity=".06"/>
  <g transform="translate(96,206)">${diamond(218, 11)}</g>
  <text x="362" y="292" fill="#E8EAED" font-family="JetBrains Mono, DejaVu Sans Mono, Consolas, monospace"
        font-size="104" font-weight="700" letter-spacing="-3">Kaimana</text>
  <text x="366" y="366" fill="${ACCENT}" font-family="JetBrains Mono, DejaVu Sans Mono, Consolas, monospace"
        font-size="40" font-weight="500" letter-spacing="7">Earn your edge</text>
  <rect x="96" y="470" width="1008" height="1" fill="#242830"/>
  <text x="96" y="530" fill="#8B929D" font-family="Inter, DejaVu Sans, Segoe UI, sans-serif" font-size="27">
    Real judge · AI coach · live contests
  </text>
</svg>`;

mkdirSync(`${OUT}/public/icons`, { recursive: true });
const write = (p, b) => { writeFileSync(`${OUT}/${p}`, b); console.log(`  ${p}  ${(b.length / 1024).toFixed(1)} KB`); };

write("app/favicon.ico", ico(await png(iconSvg(32, { radius: 6, stroke: 2.6 }))));
write("app/apple-icon.png", await png(iconSvg(180, { radius: 0 })));
write("public/icons/icon-192.png", await png(iconSvg(192)));
write("public/icons/icon-512.png", await png(iconSvg(512)));
write("app/opengraph-image.png", await png(ogSvg()));
console.log("done");
