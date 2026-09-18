/**
 * Renders the GoSaath mark to PNG and SVG.
 *
 * The mark lives as a React Native component (src/components/wordmark.tsx),
 * which cannot be exported to an image. Rather than redraw it by eye, this
 * reproduces the same geometry from the same ratios, so the icon and the
 * in-app logo can never drift apart.
 *
 * No image dependency: shapes are signed-distance functions sampled with 4x
 * supersampling, and PNG encoding uses Node's own zlib.
 *
 *   node scripts/build-logo.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// --- Brand ----------------------------------------------------------------
const BRAND = [0x0f, 0x6e, 0x5c]; // #0F6E5C
const ON_BRAND = [0xff, 0xff, 0xff];

// --- Geometry, identical to the component ---------------------------------
const RATIO = {
  corner: 0.29,
  dot: 0.17,
  line: 0.055,
  rail: 0.62,
  rotation: -32,
};

const SS = 4; // supersampling factor

function roundedRectSDF(x, y, halfW, halfH, r) {
  const qx = Math.abs(x) - (halfW - r);
  const qy = Math.abs(y) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function circleSDF(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) - r;
}

/** Capsule: the rail line, fully rounded at both ends. */
function capsuleSDF(x, y, ax, ay, bx, by, r) {
  const pax = x - ax;
  const pay = y - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

function render(
  size,
  { fullBleed = false, transparent = false, scale = 1 } = {},
) {
  // Android crops adaptive icons to roughly the inner 66%, so the artwork is
  // scaled down inside a larger canvas rather than filling it.
  const art = size * scale;
  const dot = Math.max(3, art * RATIO.dot);
  const line = Math.max(1.5, art * RATIO.line);
  const railWidth = art * RATIO.rail;
  const corner = art * RATIO.corner;
  const c = size / 2;

  const rad = (RATIO.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Rail endpoints, rotated about the centre.
  const half = railWidth / 2;
  const inset = half - dot / 2;
  const rot = (d) => [c + d * cos, c + d * sin];
  // A capsule extends its radius beyond each endpoint, where the component
  // draws a rounded rect that stops at the rail edge. Pull the endpoints in by
  // the half-thickness so the line ends flush with the dots instead of poking
  // out past them.
  const [lx1, ly1] = rot(-half + line / 2);
  const [lx2, ly2] = rot(half - line / 2);
  const [dx1, dy1] = rot(-inset);
  const [dx2, dy2] = rot(inset);

  const px = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgA = 0;
      let fgA = 0;
      let lineA = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px0 = x + (sx + 0.5) / SS;
          const py0 = y + (sy + 0.5) / SS;

          // Container
          const inside = fullBleed
            ? -1
            : roundedRectSDF(px0 - c, py0 - c, art / 2, art / 2, corner);
          if (inside <= 0) bgA++;

          // The route sits behind the people on it.
          const lineD = capsuleSDF(px0, py0, lx1, ly1, lx2, ly2, line / 2);
          if (lineD <= 0 && inside <= 0) lineA++;

          const d1 = circleSDF(px0, py0, dx1, dy1, dot / 2);
          const d2 = circleSDF(px0, py0, dx2, dy2, dot / 2);
          if ((d1 <= 0 || d2 <= 0) && inside <= 0) fgA++;
        }
      }

      const total = SS * SS;
      const i = (y * size + x) * 4;

      const bg = bgA / total;
      const fg = fgA / total;
      const ln = Math.max(0, lineA / total - fg) * 0.45; // line opacity

      if (transparent) {
        // White mark on transparency, for dark surfaces.
        const a = Math.min(1, fg + ln);
        px[i] = 255;
        px[i + 1] = 255;
        px[i + 2] = 255;
        px[i + 3] = Math.round(a * 255);
      } else {
        const mark = Math.min(1, fg + ln);
        for (let ch = 0; ch < 3; ch++) {
          px[i + ch] = Math.round(BRAND[ch] * (1 - mark) + ON_BRAND[ch] * mark);
        }
        px[i + 3] = Math.round(bg * 255);
      }
    }
  }

  return px;
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(
      raw,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

// --- SVG ------------------------------------------------------------------
function svgMark(size, { fullBleed = false } = {}) {
  const dot = size * RATIO.dot;
  const line = size * RATIO.line;
  const railWidth = size * RATIO.rail;
  const corner = size * RATIO.corner;
  const c = size / 2;
  const half = railWidth / 2;
  const inset = half - dot / 2;
  const r = (n) => Number(n.toFixed(2));

  const backdrop = fullBleed
    ? `<rect width="${size}" height="${size}" fill="#0F6E5C"/>`
    : `<rect width="${size}" height="${size}" rx="${r(corner)}" fill="#0F6E5C"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="GoSaath">
  <title>GoSaath</title>
  ${backdrop}
  <g transform="rotate(${RATIO.rotation} ${c} ${c})">
    <rect x="${r(c - half)}" y="${r(c - line / 2)}" width="${r(railWidth)}" height="${r(line)}" rx="${r(line / 2)}" fill="#FFFFFF" opacity="0.45"/>
    <circle cx="${r(c - inset)}" cy="${c}" r="${r(dot / 2)}" fill="#FFFFFF"/>
    <circle cx="${r(c + inset)}" cy="${c}" r="${r(dot / 2)}" fill="#FFFFFF"/>
  </g>
</svg>
`;
}

/** Horizontal lockup: the login-screen logo, mark plus wordmark. */
function svgLockup(markSize) {
  const gap = markSize * 0.33;
  const fontSize = markSize * 0.78;
  const textWidth = fontSize * 4.45; // measured for Manrope SemiBold "GoSaath"
  const width = markSize + gap + textWidth;
  const height = markSize;
  const inner = svgMark(markSize)
    .split("\n")
    .slice(2, -2)
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="${height}" viewBox="0 0 ${width.toFixed(0)} ${height}" role="img" aria-label="GoSaath">
  <title>GoSaath</title>
${inner}
  <text x="${(markSize + gap).toFixed(0)}" y="${(height / 2).toFixed(0)}"
        font-family="Manrope, 'Manrope SemiBold', 'Segoe UI', system-ui, sans-serif"
        font-size="${fontSize.toFixed(0)}" font-weight="600"
        fill="#14171A" dominant-baseline="central">GoSaath</text>
</svg>
`;
}

// --- Build ----------------------------------------------------------------
const out = path.join(__dirname, "..", "brand");
fs.mkdirSync(out, { recursive: true });

const pngs = [
  ["gosaath-icon-1024.png", 1024, {}],
  ["gosaath-icon-512.png", 512, {}],
  ["gosaath-icon-192.png", 192, {}],
  ["gosaath-icon-fullbleed-1024.png", 1024, { fullBleed: true }],
  ["gosaath-mark-white-1024.png", 1024, { transparent: true }],
  // Android adaptive + splash: white mark on transparency, inset for cropping.
  ["gosaath-adaptive-foreground-1024.png", 1024, { transparent: true, scale: 0.62 }],
  ["gosaath-splash-1024.png", 1024, { transparent: true, scale: 0.55 }],
  ["gosaath-favicon-48.png", 48, {}],
];

for (const [name, size, opts] of pngs) {
  const png = encodePNG(size, size, render(size, opts));
  fs.writeFileSync(path.join(out, name), png);
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}

fs.writeFileSync(path.join(out, "gosaath-mark.svg"), svgMark(1024));
fs.writeFileSync(
  path.join(out, "gosaath-mark-fullbleed.svg"),
  svgMark(1024, { fullBleed: true }),
);
fs.writeFileSync(path.join(out, "gosaath-logo.svg"), svgLockup(96));
console.log("gosaath-mark.svg, gosaath-mark-fullbleed.svg, gosaath-logo.svg");
