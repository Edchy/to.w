// Loose 3D stand-ins for the jewelry, built from simple shapes and written as GLB files to
// public/models/<slug>.glb (slug without diacritics: hjärter → hjarter). Not scans: shapes are read
// off the product photos and descriptions. Run: node scripts/make-rings.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/models/", import.meta.url);
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;

// ─── Materials ───────────────────────────────────────────────────────────────
const MAT = {
  polished: { name: "silver-polished", pbrMetallicRoughness: { baseColorFactor: [0.82, 0.81, 0.78, 1], metallicFactor: 1, roughnessFactor: 0.2 } },
  cast: { name: "silver-cast", pbrMetallicRoughness: { baseColorFactor: [0.74, 0.73, 0.7, 1], metallicFactor: 1, roughnessFactor: 0.48 } },
  satin: { name: "silver-satin", pbrMetallicRoughness: { baseColorFactor: [0.78, 0.77, 0.74, 1], metallicFactor: 1, roughnessFactor: 0.38 } },
  face: { name: "silver-worn-face", pbrMetallicRoughness: { baseColorFactor: [0.69, 0.68, 0.65, 1], metallicFactor: 1, roughnessFactor: 0.56 } },
  gold: { name: "gold-18k", pbrMetallicRoughness: { baseColorFactor: [0.9, 0.58, 0.2, 1], metallicFactor: 1, roughnessFactor: 0.24 } },
};

// ─── Mesh helpers (mm; y is the finger axis, the ring's top faces +z) ────────────
const mesh = () => ({ pos: [], nor: [], idx: [] });

function smoothNormals(m) {
  const n = new Array(m.pos.length).fill(0);
  for (let f = 0; f < m.idx.length; f += 3) {
    const [a, b, c] = [m.idx[f] * 3, m.idx[f + 1] * 3, m.idx[f + 2] * 3];
    const e1 = [0, 1, 2].map((k) => m.pos[b + k] - m.pos[a + k]);
    const e2 = [0, 1, 2].map((k) => m.pos[c + k] - m.pos[a + k]);
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) n[v + k] += cr[k];
  }
  for (let k = 0; k < n.length; k += 3) {
    const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1;
    n[k] /= l; n[k + 1] /= l; n[k + 2] /= l;
  }
  m.nor = n;
  return m;
}

// A closed tube swept round the y axis: point(i, j) gives the vertex for ring step i and section step j.
function sweep(U, V, point, outward = [0, 0]) {
  const m = mesh();
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) m.pos.push(...point((i / U) * TAU, (j / V) * TAU));
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a = i * V + j, b = ((i + 1) % U) * V + j, c = ((i + 1) % U) * V + ((j + 1) % V), d = i * V + ((j + 1) % V);
    m.idx.push(a, d, b, b, d, c);
  }
  smoothNormals(m);
  // Make sure normals point out of the tube: compare against the direction from the section centre.
  const [ci, cj] = outward;
  const k = (ci * V + cj) * 3;
  const p = m.pos.slice(k, k + 3), c = point((ci / U) * TAU, -1);
  if ((p[0] - c[0]) * m.nor[k] + (p[1] - c[1]) * m.nor[k + 1] + (p[2] - c[2]) * m.nor[k + 2] < 0) flip(m);
  return m;
}

function flip(m) {
  for (let f = 0; f < m.idx.length; f += 3) [m.idx[f + 1], m.idx[f + 2]] = [m.idx[f + 2], m.idx[f + 1]];
  m.nor = m.nor.map((v) => -v);
}

/*
 * A band round the finger. `shape(a)` returns { w, t, dy, bump(a, v) } for the angle a (a = π/2 is the
 * top): w = width along the finger, t = thickness, dy = sideways shift, bump = outward relief.
 * The cross-section is a rounded rectangle (superellipse, exponent n).
 */
function band({ inner = 8.9, n = 3, U = 200, V = 32, shape }) {
  return sweep(U, V, (a, v) => {
    const { w, t, dy = 0, bump } = shape(a);
    const R = inner + t / 2;
    if (v < 0) return [R * Math.cos(a), dy, R * Math.sin(a)];
    const c = Math.cos(v), s = Math.sin(v);
    const xc = Math.sign(c) * Math.abs(c) ** (2 / n) * (t / 2);
    const yc = Math.sign(s) * Math.abs(s) ** (2 / n) * (w / 2);
    const r = R + xc + (bump ? bump(a, v, yc) * Math.max(0, c) : 0);
    return [r * Math.cos(a), yc + dy, r * Math.sin(a)];
  });
}

// A round wire ring (torus) round the y axis, with optional wobble of the wire's radius.
const wire = ({ R, r, U = 160, V = 20, wobble = () => 0 }) =>
  sweep(U, V, (a, v) => {
    if (v < 0) return [R * Math.cos(a), 0, R * Math.sin(a)];
    const rr = r + wobble(a, v);
    const rad = R + rr * Math.cos(v);
    return [rad * Math.cos(a), rr * Math.sin(v), rad * Math.sin(a)];
  });

// A wire loop in the x/y plane. Used for the two hand-shaped oval links on the Måne pendant.
function ovalLoop({ center = [0, 0, 0], rx, ry, r, angle = 0, lean = 0, U = 96, V = 16 }) {
  const ca = Math.cos(angle), sa = Math.sin(angle), cl = Math.cos(lean), sl = Math.sin(lean);
  const rotate = ([x, y, z]) => {
    const px = x * ca - y * sa, py = x * sa + y * ca;
    return [px, py * cl - z * sl, py * sl + z * cl];
  };
  return sweep(U, V, (a, v) => {
    const c = [rx * Math.cos(a), ry * Math.sin(a), 0];
    if (v < 0) { const p = rotate(c); return p.map((x, i) => x + center[i]); }
    const normal = [Math.cos(a), Math.sin(a), 0];
    const p = [c[0] + r * Math.cos(v) * normal[0], c[1] + r * Math.cos(v) * normal[1], r * Math.sin(v)];
    const q = rotate(p);
    return q.map((x, i) => x + center[i]);
  });
}

function sphere(c, r, seg = 24) {
  const m = mesh();
  for (let i = 0; i <= seg; i++) for (let j = 0; j <= seg; j++) {
    const th = (i / seg) * Math.PI, ph = (j / seg) * TAU;
    const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    m.pos.push(c[0] + r * n[0], c[1] + r * n[1], c[2] + r * n[2]);
    m.nor.push(...n);
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    m.idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  return m;
}

// Triangulates a simple polygon (counter-clockwise) by ear clipping.
function triangulate(pts) {
  const idx = pts.map((_, i) => i), tris = [];
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 100000) {
    let clipped = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const [a, b, c] = [pts[i0], pts[i1], pts[i2]];
      if (cross(a, b, c) <= 0) continue;
      if (idx.some((j) => j !== i0 && j !== i1 && j !== i2 && inside(pts[j], a, b, c))) continue;
      tris.push(i0, i1, i2); idx.splice(k, 1); clipped = true; break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) tris.push(...idx);
  return tris;
}

const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

/*
 * A flat plate: the 2D outline (mm) extruded by `depth`, with a small rounded edge. place(u, v, h)
 * maps outline coordinates and height (0 = back face, depth = front face) into the model.
 */
function plate(outline, depth, place, edge = 0.35, faceTris) {
  const reversed = area(outline) < 0;
  const pts = reversed ? [...outline].reverse() : outline;
  const N = pts.length;
  // Outward 2D normal at each outline point (averaged from its two edges).
  const n2 = pts.map((_, i) => {
    const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
    const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1;
    return [d[1] / l, -d[0] / l];
  });
  const m = mesh();
  const add = (p, n) => { m.pos.push(...p); m.nor.push(...n); return m.pos.length / 3 - 1; };
  const dir = (u, v, h) => { const o = place(0, 0, 0), p = place(u, v, h); return [p[0] - o[0], p[1] - o[1], p[2] - o[2]]; };
  const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
  const up = norm(dir(0, 0, 1));
  // Faces: inset by the edge radius; the side wall is a quarter-round from each face out to the outline.
  const inset = pts.map((p, i) => [p[0] - n2[i][0] * edge, p[1] - n2[i][1] * edge]);
  let tris = faceTris ? faceTris.map((i) => (reversed ? N - 1 - i : i)) : triangulate(inset);
  // Every face triangle counter-clockwise, so both faces point the right way.
  for (let f = 0; f < tris.length; f += 3) {
    const [a, b, c] = [inset[tris[f]], inset[tris[f + 1]], inset[tris[f + 2]]];
    if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0) [tris[f + 1], tris[f + 2]] = [tris[f + 2], tris[f + 1]];
  }
  for (const [h, sign] of [[depth, 1], [0, -1]]) {
    const base = m.pos.length / 3;
    for (const p of inset) add(place(p[0], p[1], h), up.map((x) => x * sign));
    for (let f = 0; f < tris.length; f += 3) {
      const t = sign > 0 ? [tris[f], tris[f + 1], tris[f + 2]] : [tris[f], tris[f + 2], tris[f + 1]];
      m.idx.push(...t.map((x) => x + base));
    }
  }
  // Side wall: profile steps from the front face round to the back face.
  const steps = 8, rows = [];
  for (let s = 0; s <= steps; s++) {
    const phi = (s / steps) * Math.PI; // 0 = front, π = back
    const out = Math.sin(phi) * edge, h = depth / 2 + Math.cos(phi) * (depth / 2);
    const row = [];
    for (let i = 0; i < N; i++) {
      const q = [inset[i][0] + n2[i][0] * out, inset[i][1] + n2[i][1] * out];
      const side = norm(dir(n2[i][0], n2[i][1], 0));
      const nrm = norm(side.map((x, k) => x * Math.sin(phi) + up[k] * Math.cos(phi)));
      row.push(add(place(q[0], q[1], h), nrm));
    }
    rows.push(row);
  }
  for (let s = 0; s < steps; s++) for (let i = 0; i < N; i++) {
    const a = rows[s][i], b = rows[s][(i + 1) % N], c = rows[s + 1][(i + 1) % N], d = rows[s + 1][i];
    m.idx.push(a, d, b, b, d, c);
  }
  return m;
}

// A plate standing on top of a band: outline u runs round the ring (x), v along the finger (y).
const topPlate = (outline, depth, z0) => plate(outline, depth, (u, v, h) => [u, v, z0 + h]);

// ─── Outlines ───────────────────────────────────────────────────────────────────
function heartCrownOutline() {
  let pts = [
    [-5.35, -2.3], [-4.4, -3.25], [-2.2, -3.65], [0, -3.75], [2.2, -3.65], [4.4, -3.25], [5.35, -2.3],
    [5.5, 0.2], [4.9, 2.25], [3.35, 3.35], [1.65, 3.4], [0, 2.45], [-1.65, 3.4],
    [-3.35, 3.35], [-4.9, 2.25], [-5.5, 0.2],
  ];
  for (let pass = 0; pass < 2; pass++) {
    const smooth = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      smooth.push([lerp(a[0], b[0], 0.25), lerp(a[1], b[1], 0.25)]);
      smooth.push([lerp(a[0], b[0], 0.75), lerp(a[1], b[1], 0.75)]);
    }
    pts = smooth;
  }
  return pts;
}

function roundedRect(w, h, r, S = 10) {
  const pts = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
  for (const [cx, cy, q] of corners)
    for (let i = 0; i <= S; i++) { const a = (q + i / S) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}

// A crescent: the big circle minus a smaller one pushed up and right, as in the photo.
function crescentOutline(R1 = 4, c2 = [1.9, 1.3], R2 = 3.5, S = 240) {
  const inC2 = (p) => Math.hypot(p[0] - c2[0], p[1] - c2[1]) < R2;
  const inC1 = (p) => Math.hypot(p[0], p[1]) < R1;
  const outer = [...Array(S)].map((_, i) => { const a = (i / S) * TAU; return [R1 * Math.cos(a), R1 * Math.sin(a)]; });
  const inner = [...Array(S)].map((_, i) => { const a = (i / S) * TAU; return [c2[0] + R2 * Math.cos(a), c2[1] + R2 * Math.sin(a)]; });
  // The outer arc that lies outside the small circle, in order, starting just after the cut.
  const start = outer.findIndex((p, i) => !inC2(p) && inC2(outer[(i + S - 1) % S]));
  const arc1 = [];
  for (let k = 0; k < S; k++) { const p = outer[(start + k) % S]; if (inC2(p)) break; arc1.push(p); }
  // Back along the small circle's arc that lies inside the big one (clockwise, from arc1's end).
  const end = arc1[arc1.length - 1];
  let j = inner.reduce((best, p, i) => (Math.hypot(p[0] - end[0], p[1] - end[1]) < Math.hypot(inner[best][0] - end[0], inner[best][1] - end[1]) ? i : best), 0);
  const arc2 = [];
  for (let k = 0; k < S; k++) { const p = inner[(j - k + S) % S]; if (!inC1(p)) { if (arc2.length) break; continue; } arc2.push(p); }
  // Both arcs resampled to K points, so the face is a strip from one arc to the other.
  const K = 60;
  const outline = [...resample(arc1, K), ...resample(arc2, K)];
  const tris = [];
  for (let i = 0; i < K - 1; i++) {
    const a = i, b = i + 1, c = 2 * K - 2 - i, d = 2 * K - 1 - i;
    tris.push(a, b, c, a, c, d);
  }
  return { outline, tris };
}

// Evenly spaced points along an open polyline.
function resample(line, K) {
  const d = [0];
  for (let i = 1; i < line.length; i++) d.push(d[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const out = [];
  for (let k = 0; k < K; k++) {
    const t = (k / (K - 1)) * d[d.length - 1];
    let i = 1;
    while (i < d.length - 1 && d[i] < t) i++;
    const f = (t - d[i - 1]) / (d[i] - d[i - 1] || 1);
    out.push([lerp(line[i - 1][0], line[i][0], f), lerp(line[i - 1][1], line[i][1], f)]);
  }
  return out;
}

// Smooth periodic value noise for cast textures.
function noise2(cellsA, cellsB, seed) {
  const h = (i, j) => { const x = Math.sin((i % cellsA) * 127.1 + (j % cellsB) * 311.7 + seed * 74.7) * 43758.5453; return x - Math.floor(x); };
  const sm = (t) => t * t * (3 - 2 * t);
  return (a, b) => {
    const x = ((a / TAU) * cellsA + cellsA) % cellsA, y = ((b / TAU) * cellsB + cellsB) % cellsB;
    const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
    const i1 = (i + 1) % cellsA, j1 = (j + 1) % cellsB;
    return lerp(lerp(h(i, j), h(i1, j), fx), lerp(h(i, j1), h(i1, j1), fx), fy);
  };
}

// 0 at the bottom of the ring, 1 at the top (a = π/2).
const topness = (a) => (1 + Math.sin(a)) / 2;

// ─── The pieces ─────────────────────────────────────────────────────────────────
const barkAround = noise2(17, 3, 1), barkFace = noise2(31, 7, 2);
const frostWave = noise2(7, 3, 3);

const pieces = {
  // Bark: a low, wide cast band with an irregular hammered perimeter and softened planes.
  bark: [[MAT.cast, band({ n: 2.2, U: 96, V: 18, shape: (a) => {
    const around = barkAround(a, 0);
    return {
      w: 3.55 + 0.95 * (around - 0.5) + 0.2 * Math.sin(9 * a + 0.4),
      t: 1.95 + 0.55 * (barkAround(a + 0.7, 1.3) - 0.5),
      dy: 0.14 * Math.sin(5 * a),
      bump: (a2, v) => 0.55 * (barkFace(a2, v) - 0.46) + 0.16 * Math.cos(3 * v + 5 * a2),
    };
  } })]],

  // Frost: a substantial, softly flattened organic band rather than a narrow ring with one swollen point.
  frost: [[MAT.satin, band({ n: 2.15, U: 220, V: 36, shape: (a) => {
    const top = topness(a);
    return {
      w: 5.8 + 0.8 * top + 0.18 * Math.sin(3 * a + 0.8),
      t: 2.65 + 0.35 * top + 0.14 * Math.sin(5 * a),
      dy: 0.14 * Math.sin(2 * a + 0.6),
      bump: (a2, v) => 0.16 * (frostWave(a2, v) - 0.5),
    };
  } })]],

  // Glimpse: a continuous pear-shaped crest, broad at the crown and fine at the palm side.
  glimpse: [[MAT.polished, band({ n: 2.1, U: 240, V: 36, shape: (a) => {
    const crown = topness(a) ** 2.8;
    return {
      w: lerp(2.45, 6.7, crown),
      t: lerp(1.45, 3.45, crown),
      dy: 0.34 * crown * Math.cos(a + 0.35),
      bump: (_a, _v, yc) => 0.34 * crown * Math.max(0, 1 - (yc / 3.35) ** 2),
    };
  } })]],

  // 1.5 mm silver wire with a bead of melted gold.
  golden: [
    [MAT.polished, wire({ R: 9.64, r: 0.74, U: 192, V: 22, wobble: (a, v) => 0.025 * Math.sin(5 * a) + 0.018 * Math.sin(9 * a + v) })],
    [MAT.gold, sphere([Math.cos(0.28) * 10.72, 0.06, Math.sin(0.28) * 10.72], 1.12, 28)],
  ],

  // Hjärter: tapered shoulders merge into one shallow crown with a restrained heart notch.
  hjarter: [
    [MAT.cast, band({ n: 2.25, U: 220, V: 36, shape: (a) => {
      const shoulder = topness(a) ** 3.8;
      return { w: lerp(2.45, 6.7, shoulder), t: lerp(1.65, 3.15, shoulder), dy: -0.1 * shoulder };
    } })],
    [MAT.cast, topPlate(heartCrownOutline(), 1.5, 11.65, 0.5)],
  ],

  // Crescent pendant on a jump ring; no chain.
  mane: [
    (() => { const { outline, tris } = crescentOutline(5.25, [2.75, 0.45], 4.85); return [MAT.satin, plate(outline, 2.15, (u, v, h) => [u, v - 3.05, h - 1.08], 0.38, tris)]; })(),
    [MAT.cast, ovalLoop({ center: [-0.45, 2.8, 0.12], rx: 1.5, ry: 2.0, r: 0.46, angle: -0.34, lean: 0.18 })],
    [MAT.cast, ovalLoop({ center: [0.35, 5.2, 0.18], rx: 1.85, ry: 2.55, r: 0.5, angle: 0.42, lean: -0.2 })],
  ],

  // Kaiser: a chunky integrated signet with tapered shoulders and a worn inset face.
  kaiser: [
    [MAT.cast, band({ n: 2.35, U: 220, V: 36, shape: (a) => {
      const shoulder = topness(a) ** 3.6;
      return { w: lerp(3.35, 8.8, shoulder), t: lerp(1.8, 4.8, shoulder), dy: 0.12 * shoulder * Math.cos(a) };
    } })],
    [MAT.cast, topPlate(roundedRect(11.6, 8.7, 1.1, 14), 1.35, 12.45, 0.5)],
    [MAT.face, topPlate(roundedRect(10.1, 7.2, 0.72, 14), 0.22, 13.76, 0.18)],
  ],

  // Tunnis: a nearly round 1.5 mm wire with only the small deviations visible in the handmade band.
  tunnis: [[MAT.polished, wire({ R: 9.66, r: 0.76, U: 192, V: 22, wobble: (a, v) => 0.035 * Math.sin(4 * a + 1) + 0.018 * Math.sin(9 * a + v) })]],
};

// ─── GLB writer ────────────────────────────────────────────────────────────────
function glb(parts, rotation) {
  const buffers = [], bufferViews = [], accessors = [], materials = [], primitives = [];
  let offset = 0;
  const push = (arr, target) => {
    const b = Buffer.from(arr.buffer);
    buffers.push(b, Buffer.alloc((4 - (b.length % 4)) % 4));
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: b.length, target });
    offset += b.length + ((4 - (b.length % 4)) % 4);
    return bufferViews.length - 1;
  };
  for (const [mat, m] of parts) {
    let mi = materials.indexOf(mat);
    if (mi < 0) { materials.push(mat); mi = materials.length - 1; }
    const pos = new Float32Array(m.pos.map((v) => v * 0.001)); // mm → m
    const nor = new Float32Array(m.nor);
    const idx = pos.length / 3 < 65536 ? new Uint16Array(m.idx) : new Uint32Array(m.idx);
    const min = [0, 1, 2].map((k) => Math.min(...pos.filter((_, i) => i % 3 === k)));
    const max = [0, 1, 2].map((k) => Math.max(...pos.filter((_, i) => i % 3 === k)));
    accessors.push({ bufferView: push(pos, 34962), componentType: 5126, count: pos.length / 3, type: "VEC3", min, max });
    accessors.push({ bufferView: push(nor, 34962), componentType: 5126, count: nor.length / 3, type: "VEC3" });
    accessors.push({ bufferView: push(idx, 34963), componentType: idx instanceof Uint16Array ? 5123 : 5125, count: idx.length, type: "SCALAR" });
    const a = accessors.length;
    primitives.push({ attributes: { POSITION: a - 3, NORMAL: a - 2 }, indices: a - 1, material: mi });
  }
  const bin = Buffer.concat(buffers);
  const gltf = {
    asset: { version: "2.0", generator: "to.w make-rings" },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, rotation }],
    meshes: [{ primitives }],
    materials, buffers: [{ byteLength: bin.length }], bufferViews, accessors,
  };
  const pad = (b, f) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, f)]);
  const json = pad(Buffer.from(JSON.stringify(gltf)), 0x20), body = pad(bin, 0);
  const chunk = (b, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(b.length, 0); h.writeUInt32LE(type, 4); return Buffer.concat([h, b]); };
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8);
  return Buffer.concat([header, chunk(json, 0x4e4f534a), chunk(body, 0x004e4942)]);
}

// Rings lean back so the top (+z) faces the viewer from slightly above; the pendant hangs upright.
const tilt = (deg) => { const r = (deg * Math.PI) / 360; return [Math.sin(r), 0, 0, Math.cos(r)]; };

mkdirSync(OUT, { recursive: true });
for (const [slug, parts] of Object.entries(pieces)) {
  const file = glb(parts, slug === "mane" ? [0, 0, 0, 1] : tilt(-35));
  writeFileSync(new URL(`${slug}.glb`, OUT), file);
  console.log(`${slug}.glb`, `${(file.length / 1024) | 0} KB`);
}
