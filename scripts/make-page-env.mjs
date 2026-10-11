// Soft studios for the 3D ring, each made of one page's own colours, so the silver reflects what
// surrounds it and almost melts into the page:
//   - the room is the page's paper colour (a little lighter above, a little dimmer below);
//   - two large soft light panels give the long highlights that make it read as metal;
//   - where real silver would show dark (the jeweller's black flags), it reflects a deep shade of the
//     page's accent instead, and a dimmed paper tone.
// Written as equirectangular Radiance .hdr files.
// Writes public/env/page-<name>.hdr. Run: node scripts/make-page-env.mjs
import { writeFileSync } from "node:fs";

// Linear RGB, matched by eye to the tokens: --v-warm-paper, --v-white, --logo-blue, --v-forest.
const WARM = [0.905, 0.863, 0.776];
const WHITE = [0.975, 0.973, 0.965];
const BLUE = [0.0, 0.045, 0.94];
const FOREST = [0.014, 0.082, 0.04];
const STUDIOS = {
  "warm-blue": { paper: WARM, accent: BLUE }, // 16
  "white-blue": { paper: WHITE, accent: BLUE }, // 17, 18
  "warm-forest": { paper: WARM, accent: FOREST }, // 19
};

const W = 512, H = 256;
const deg = Math.PI / 180;
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// A soft-edged panel: centre (azimuth, elevation), size and edge softness in degrees.
const panel = (az, el, w, h, soft) => (phi, theta) => {
  let d = phi - az * deg;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const dx = Math.abs(d) / deg - w / 2, dy = Math.abs(theta - el * deg) / deg - h / 2;
  return 1 - smooth(Math.max(dx, dy) / soft + 0.5);
};
const key = panel(40, 30, 60, 34, 10);
const strip = panel(215, 12, 26, 70, 8);
const flag = panel(125, 5, 50, 70, 26); // reflects a muted, dark shade of the accent
const flag2 = panel(-60, -5, 36, 56, 22); // reflects a dimmed paper tone

function studio({ paper, accent }) {
  const px = new Float32Array(W * H * 3);
  // The accent, muted into a dimmed paper tone: dark enough for contrast, with a hint of the colour.
  const deep = paper.map((c, i) => 0.3 * (0.6 * c + 0.4 * accent[i]));
  for (let y = 0; y < H; y++) {
    const theta = Math.PI / 2 - ((y + 0.5) / H) * Math.PI;
    const up = Math.sin(theta); // -1 below … 1 above
    const room = up > 0 ? 0.85 + 0.2 * up : 0.85 + 0.4 * up;
    for (let x = 0; x < W; x++) {
      const phi = ((x + 0.5) / W) * 2 * Math.PI - Math.PI;
      const f = flag(phi, theta), f2 = flag2(phi, theta);
      const light = 6 * key(phi, theta) + 3.5 * strip(phi, theta);
      for (let c = 0; c < 3; c++) {
        const base = paper[c] * room * (1 - 0.6 * f2);
        px[(y * W + x) * 3 + c] = base * (1 - f) + deep[c] * f + light * paper[c];
      }
    }
  }
  return px;
}

// RGBE encoding, flat (not run-length) scanlines.
function hdr(px) {
  const head = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`, "ascii");
  const body = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const r = px[i * 3], g = px[i * 3 + 1], b = px[i * 3 + 2], v = Math.max(r, g, b);
    if (v < 1e-32) continue;
    const e = Math.ceil(Math.log2(v) + 1e-9), scale = 256 / 2 ** e;
    body[i * 4] = Math.min(255, Math.floor(r * scale));
    body[i * 4 + 1] = Math.min(255, Math.floor(g * scale));
    body[i * 4 + 2] = Math.min(255, Math.floor(b * scale));
    body[i * 4 + 3] = e + 128;
  }
  return Buffer.concat([head, body]);
}

for (const [name, colours] of Object.entries(STUDIOS)) {
  writeFileSync(new URL(`../public/env/page-${name}.hdr`, import.meta.url), hdr(studio(colours)));
  console.log(`page-${name}.hdr ${W}×${H}`);
}
