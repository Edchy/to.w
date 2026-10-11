// A 3D replica of the bark ring, built from its product cutout alone (bark looks the same all the
// way round). Writes public/models/bark-replica.glb. Run: node scripts/make-bark-replica.mjs
//
// 1. Shape: measured off the cutout's outline. The photo is a near-orthographic view from ~30° above;
//    the outer width, the hole and the overall height give the ring's outer and inner radius, its
//    band height and the camera's elevation (numbers below, in cutout pixels).
// 2. Hammered facets: flat planes cut into the outside and the edges, ~24 round, in three rows.
// 3. Surface: every point is projected back into the cutout the way it was photographed (the back
//    half mirrored onto the front, the inner wall onto the visible back wall), and takes the photo's
//    light and dark there as its vertex colour, so recesses stay dark and facets bright.
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { writeGlb } from "./write-glb.mjs";

const SRC = new URL("../src/content/jewelry/bark/bark-cutout.png", import.meta.url);
const OUT = new URL("../public/models/bark-replica.glb", import.meta.url);

// ─── Measurements from the cutout (px) ─────────────────────────────────────────
// Outline 153–1108 × 374–929; the hole at its widest 288–976; centre column opaque 374–527 and
// 782–929. Solving outer extent 2R·sinφ + h·cosφ = 555 and hole 2r·sinφ − h·cosφ = 255:
const R = 477.5; // outer radius
const r = 344; // inner radius
const sinPhi = 0.493; // camera elevation ≈ 29.5°
const cosPhi = Math.sqrt(1 - sinPhi * sinPhi);
const h = 96.8; // band height along the finger axis
const CX = 630.5; // ring centre in the cutout
const CY = 651.5;
const MM = 11 / R; // outer radius 11 mm

// ─── Seeded randomness so every run gives the same ring ───────────────────────
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ─── The cross-section: a rounded rectangle in (radius ρ, height y) ───────────
function section(M) {
  const cOut = 0.36 * h; // outer corners: soft and round
  const cIn = 0.18 * h;
  const segs = [
    // [start ρ, start y, end ρ, end y] straight runs and [centre ρ, centre y, radius, a0, a1] arcs
    { line: [r + cIn, -h / 2, R - cOut, -h / 2] }, // bottom face
    { arc: [R - cOut, -h / 2 + cOut, cOut, -Math.PI / 2, 0] },
    { line: [R, -h / 2 + cOut, R, h / 2 - cOut] }, // outer wall
    { arc: [R - cOut, h / 2 - cOut, cOut, 0, Math.PI / 2] },
    { line: [R - cOut, h / 2, r + cIn, h / 2] }, // top face
    { arc: [r + cIn, h / 2 - cIn, cIn, Math.PI / 2, Math.PI] },
    { line: [r, h / 2 - cIn, r, -h / 2 + cIn] }, // inner wall
    { arc: [r + cIn, -h / 2 + cIn, cIn, Math.PI, (3 * Math.PI) / 2] },
  ];
  const len = (s) => (s.line ? Math.hypot(s.line[2] - s.line[0], s.line[3] - s.line[1]) : s.arc[2] * Math.abs(s.arc[4] - s.arc[3]));
  const total = segs.reduce((t, s) => t + len(s), 0);
  const pts = [];
  for (let j = 0; j < M; j++) {
    let d = (j / M) * total;
    for (const s of segs) {
      const L = len(s);
      if (d > L) { d -= L; continue; }
      const t = d / L;
      if (s.line) {
        const [a, b, c, e] = s.line;
        const dx = c - a, dy = e - b, l = Math.hypot(dx, dy);
        pts.push({ rho: a + dx * t, y: b + dy * t, nr: dy / l, ny: -dx / l });
      } else {
        const [cr, cy, rad, a0, a1] = s.arc;
        const a = a0 + (a1 - a0) * t;
        pts.push({ rho: cr + rad * Math.cos(a), y: cy + rad * Math.sin(a), nr: Math.cos(a), ny: Math.sin(a) });
      }
      break;
    }
  }
  return pts;
}

// ─── Hammered facets: planes cut into the outside, in three rows (down, level, up) ─
const facets = [];
const K = 24;
for (const [row, tilt] of [[-1, -0.62], [0, 0], [1, 0.62]]) {
  for (let k = 0; k < K; k++) {
    const theta = ((k + (row === 0 ? 0.5 : 0) + (rand() - 0.5) * 0.6) / K) * Math.PI * 2;
    const a = tilt + (rand() - 0.5) * 0.25;
    const n = [Math.cos(a) * Math.cos(theta), Math.sin(a), Math.cos(a) * Math.sin(theta)];
    // Where the unfaceted surface faces this way, then set the plane a little inside it.
    const c = 0.36 * h;
    const ref = row === 0 ? [R, 0] : [R - c + c * Math.cos(a), Math.sign(a) * (h / 2 - c) + c * Math.sin(a)];
    const p = [ref[0] * Math.cos(theta), ref[1], ref[0] * Math.sin(theta)];
    const depth = (row === 0 ? 0.035 : 0.05) * R * (0.45 + rand());
    facets.push({ n, d: n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - depth, theta });
  }
}

// ─── Build the mesh ───────────────────────────────────────────────────────────
const U = 480; // steps round the ring
const M = 80; // steps round the cross-section
const sec = section(M);
const pos = [], col = [], idx = [];

const img = await sharp(fileURLToPath(SRC)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = img.info;
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function sample(x, y) {
  const xi = Math.round(x), yi = Math.round(y);
  for (let rad = 0; rad < 24; rad += 3) {
    for (const [dx, dy] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad]]) {
      const px = Math.min(W - 1, Math.max(0, xi + dx)), py = Math.min(H - 1, Math.max(0, yi + dy));
      const o = (py * W + px) * C;
      if (img.data[o + 3] > 200) return (0.2126 * img.data[o] + 0.7152 * img.data[o + 1] + 0.0722 * img.data[o + 2]) / 255;
    }
  }
  return 0.7;
}

for (let i = 0; i < U; i++) {
  const theta = (i / U) * Math.PI * 2;
  const ct = Math.cos(theta), st = Math.sin(theta);
  for (let j = 0; j < M; j++) {
    const s = sec[j];
    let P = [s.rho * ct, s.y, s.rho * st];
    const N = [s.nr * ct, s.ny, s.nr * st];
    // Facets cut the outside and the edges, not the inner wall.
    if (s.nr > -0.3) {
      let cut = 0;
      for (const f of facets) {
        let dt = Math.abs(theta - f.theta);
        if (dt > Math.PI) dt = Math.PI * 2 - dt;
        if (dt > 0.6) continue;
        cut = Math.max(cut, f.n[0] * P[0] + f.n[1] * P[1] + f.n[2] * P[2] - f.d);
      }
      P = P.map((v, k) => v - N[k] * cut);
    }
    pos.push(P[0] * MM, P[1] * MM, P[2] * MM);

    // Where this point was in the photo: the outside and edges on the front half (z toward the
    // camera), the inner wall on the back half, which is the part of it the photo shows.
    const z = s.nr < -0.3 ? -Math.abs(P[2]) : Math.abs(P[2]);
    const lum = sample(CX + P[0], CY - P[1] * cosPhi + z * sinPhi);
    const g = toLinear(0.32 + 0.66 * lum);
    col.push(g, g, g);
  }
}
for (let i = 0; i < U; i++) {
  for (let j = 0; j < M; j++) {
    const a = i * M + j, b = ((i + 1) % U) * M + j;
    const c = ((i + 1) % U) * M + ((j + 1) % M), d = i * M + ((j + 1) % M);
    idx.push(a, d, b, b, d, c);
  }
}

// Normals from the faceted surface, so the cuts catch the light.
const nor = new Float32Array(pos.length);
for (let f = 0; f < idx.length; f += 3) {
  const [a, b, c] = [idx[f] * 3, idx[f + 1] * 3, idx[f + 2] * 3];
  const e1 = [0, 1, 2].map((k) => pos[b + k] - pos[a + k]);
  const e2 = [0, 1, 2].map((k) => pos[c + k] - pos[a + k]);
  const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  for (const v of [a, b, c]) for (let k = 0; k < 3; k++) nor[v + k] += n[k];
}
// The winding above may face inward: check one outer point against its expected normal.
const probe = 0 * M + Math.round(M * 0.25); // a point on the outer wall at θ = 0 (+x)
const flip = nor[probe * 3] < 0 ? -1 : 1;
for (let k = 0; k < nor.length; k += 3) {
  const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1;
  for (let q = 0; q < 3; q++) nor[k + q] = (flip * nor[k + q]) / l;
}
if (flip < 0) for (let f = 0; f < idx.length; f += 3) [idx[f + 1], idx[f + 2]] = [idx[f + 2], idx[f + 1]];

// ─── Write the GLB ────────────────────────────────────────────────────────────
const bytes = writeGlb(OUT, {
  pos,
  nor,
  col,
  idx,
  generator: "to.w make-bark-replica",
  material: { name: "silver-bark", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 1, roughnessFactor: 0.32 } },
});
console.log(`bark-replica.glb ${(bytes / 1024) | 0} KB, ${pos.length / 3} vertices`);
