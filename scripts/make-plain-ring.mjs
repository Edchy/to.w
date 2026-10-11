// A plain round wire ring like tunnis: 1.5 mm round silver wire, ring size 17 (17 mm inside), with a
// cool blue hue. It is meant to look handmade, not machined:
//   - the wire is bent by hand: slightly out of round, a touch thicker and thinner, a faint warp;
//   - its surface carries small dents, file scratches mostly along the wire, an overall grain and a
//     few soft lumps (a bump map, so the light catches them; the lumps also move the surface);
//   - grime settles in the recesses: darker, slightly oxidised colour and a duller finish there.
// The detail is generated once from a fixed seed, so every run gives the same ring.
// Writes public/models/plain-ring.glb. Run: node scripts/make-plain-ring.mjs
import sharp from "sharp";
import { writeGlb } from "./write-glb.mjs";

const WIRE = 1.5; // mm, the wire's diameter
const INSIDE = 17; // mm, the ring's inside diameter (size 17)
const r0 = WIRE / 2; // tube radius
const R0 = INSIDE / 2 + r0; // from the ring's centre to the middle of the wire
const U = 480; // mesh steps round the ring
const V = 48; // mesh steps round the wire
const TW = 2048; // texture width: round the ring (≈ 58 mm)
const TH = 160; // texture height: round the wire (≈ 4.7 mm)
const PU = (2 * Math.PI * R0) / TW; // mm per texel along the ring
const PV = (2 * Math.PI * r0) / TH; // mm per texel round the wire
const TINT = [0.62, 0.76, 1]; // linear: silver with a cool blue hue
const GRIME = [0.1, 0.11, 0.13]; // linear: tarnish in the recesses

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a, b) => a + (b - a) * rand();
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Value noise that tiles across the texture: cx × cy random lattice points, smoothly interpolated.
function noise(cx, cy) {
  const g = Array.from({ length: cx * cy }, rand);
  return (x, y) => {
    const fx = (x / TW) * cx, fy = (y / TH) * cy;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = smooth(fx - x0), ty = smooth(fy - y0);
    const at = (i, j) => g[(((j % cy) + cy) % cy) * cx + (((i % cx) + cx) % cx)];
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
    return top + (bottom - top) * ty;
  };
}

// ─── The height field, in mm (negative = into the metal) ───────────────────────
const lumps = noise(22, 2); // soft unevenness from bending and polishing by hand
const grain = noise(900, 70); // fine grain
const grain2 = noise(380, 30);
const grime = noise(16, 3); // patches where dirt collects
const low = new Float32Array(TW * TH); // lumps only: also moves the mesh
const H = new Float32Array(TW * TH);
for (let y = 0; y < TH; y++) {
  for (let x = 0; x < TW; x++) {
    const l = (lumps(x, y) - 0.5) * 0.07;
    low[y * TW + x] = l;
    H[y * TW + x] = l + (grain(x, y) - 0.5) * 0.006 + (grain2(x, y) - 0.5) * 0.008;
  }
}
const wrapX = (x) => ((x % TW) + TW) % TW;
const wrapY = (y) => ((y % TH) + TH) % TH;

// Dents: small round dimples from tools and wear.
for (let k = 0; k < 180; k++) {
  const cx = rand() * TW, cy = rand() * TH, rad = between(0.12, 0.45), depth = between(0.012, 0.05) * (rad / 0.3);
  const rx = Math.ceil(rad / PU), ry = Math.ceil(rad / PV);
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const d = Math.hypot(dx * PU, dy * PV) / rad;
      if (d >= 1) continue;
      H[wrapY(Math.round(cy) + dy) * TW + wrapX(Math.round(cx) + dx)] -= depth * (1 - d * d) ** 2;
    }
  }
}

// Scratches: file and handling marks, most of them along the wire.
for (let k = 0; k < 80; k++) {
  const along = rand() < 0.85;
  const angle = along ? between(-0.35, 0.35) : between(0, Math.PI);
  const len = between(0.4, 2.5), width = between(0.012, 0.03), depth = between(0.004, 0.012);
  const sx = rand() * TW, sy = rand() * TH; // start, in texels
  const ex = len * Math.cos(angle), ey = len * Math.sin(angle); // in mm
  const bx = Math.ceil((Math.abs(ex) + width) / PU) + 1, by = Math.ceil((Math.abs(ey) + width) / PV) + 1;
  for (let dy = -by; dy <= by; dy++) {
    for (let dx = -bx; dx <= bx; dx++) {
      const px = dx * PU, py = dy * PV;
      const t = clamp((px * ex + py * ey) / (ex * ex + ey * ey));
      const dist = Math.hypot(px - t * ex, py - t * ey) / width;
      if (dist >= 1) continue;
      H[wrapY(Math.round(sy) + dy) * TW + wrapX(Math.round(sx) + dx)] -= depth * (1 - dist * dist);
    }
  }
}

// Cavities: how far each texel sits below its surroundings (a blurred copy of the height).
function blur(src, rad) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    let s = 0;
    for (let k = -rad; k <= rad; k++) s += src[y * TW + wrapX(x + k)];
    tmp[y * TW + x] = s / (2 * rad + 1);
  }
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    let s = 0;
    for (let k = -rad; k <= rad; k++) s += tmp[wrapY(y + k) * TW + x];
    out[y * TW + x] = s / (2 * rad + 1);
  }
  return out;
}
const around = blur(H, 9);

// ─── The surface maps ────────────────────────────────────────────────────────
const toSrgb = (c) => Math.round(255 * clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
const base = Buffer.alloc(TW * TH * 3); // colour
const orm = Buffer.alloc(TW * TH * 3); // occlusion, roughness, metalness
const normal = Buffer.alloc(TW * TH * 3);
for (let y = 0; y < TH; y++) {
  for (let x = 0; x < TW; x++) {
    const i = y * TW + x, o = i * 3;
    const cavity = clamp((around[i] - H[i]) / 0.018);
    const patch = grime(x, y);
    const dirt = clamp(0.85 * cavity + 0.3 * smooth(clamp((patch - 0.55) / 0.3)));
    for (let c = 0; c < 3; c++) base[o + c] = toSrgb((TINT[c] + (GRIME[c] - TINT[c]) * 0.6 * dirt) * (1 - 0.08 * patch));
    orm[o] = Math.round(255 * (1 - 0.55 * dirt));
    orm[o + 1] = Math.round(255 * clamp(0.15 + 0.35 * dirt + 0.08 * patch));
    orm[o + 2] = 255;
    const sx = (H[y * TW + wrapX(x + 1)] - H[y * TW + wrapX(x - 1)]) / (2 * PU);
    const sy = (H[wrapY(y + 1) * TW + x] - H[wrapY(y - 1) * TW + x]) / (2 * PV);
    const len = Math.hypot(sx, sy, 1);
    normal[o] = Math.round(255 * (0.5 - (0.5 * sx) / len));
    normal[o + 1] = Math.round(255 * (0.5 - (0.5 * sy) / len));
    normal[o + 2] = Math.round(255 * (0.5 + 0.5 / len));
  }
}
const jpeg = (data, quality) => sharp(data, { raw: { width: TW, height: TH, channels: 3 } }).jpeg({ quality }).toBuffer();
const images = [
  { data: await jpeg(base, 88), mimeType: "image/jpeg" },
  { data: await jpeg(orm, 88), mimeType: "image/jpeg" },
  { data: await jpeg(normal, 94), mimeType: "image/jpeg" },
];

// ─── The mesh: a hand-bent wire, its surface moved by the lumps ─────────────────
const R = (a) => R0 * (1 + 0.011 * Math.sin(2 * a + 0.7) + 0.005 * Math.sin(3 * a + 2.1));
const r = (a) => r0 * (1 + 0.035 * Math.sin(5 * a + 0.4) + 0.02 * Math.sin(9 * a + 1.9));
const lift = (a) => 0.18 * Math.sin(a + 1.3) + 0.06 * Math.sin(3 * a + 0.2); // mm out of the flat
const FLAT = 0.93; // the wire's section is a little flattened from bending

// Positions on a closed grid (U × V); the seams are duplicated afterwards so the maps can wrap.
const P = [];
for (let i = 0; i < U; i++) {
  const a = (i / U) * Math.PI * 2;
  for (let j = 0; j < V; j++) {
    const b = (j / V) * Math.PI * 2;
    const tube = r(a) + low[Math.floor((j / V) * TH) * TW + Math.floor((i / U) * TW)];
    const rho = R(a) + tube * Math.cos(b);
    P.push([rho * Math.cos(a), lift(a) + tube * FLAT * Math.sin(b), rho * Math.sin(a)]);
  }
}
const at = (i, j) => (((i % U) + U) % U) * V + (((j % V) + V) % V);
const N = P.map(() => [0, 0, 0]);
for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
  for (const [a, b, c] of [[at(i, j), at(i + 1, j), at(i, j + 1)], [at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]]) {
    const e1 = [0, 1, 2].map((k) => P[b][k] - P[a][k]), e2 = [0, 1, 2].map((k) => P[c][k] - P[a][k]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) N[v][k] += n[k];
  }
}
// Point 0 is on the outside of the wire at +x: its normal must point that way.
const flip = N[0][0] < 0 ? -1 : 1;

const pos = [], nor = [], uv = [], idx = [];
for (let i = 0; i <= U; i++) {
  for (let j = 0; j <= V; j++) {
    const p = P[at(i, j)], n = N[at(i, j)], l = Math.hypot(...n) || 1;
    pos.push(p[0] / 1000, p[1] / 1000, p[2] / 1000);
    nor.push((flip * n[0]) / l, (flip * n[1]) / l, (flip * n[2]) / l);
    uv.push(i / U, j / V);
  }
}
for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
  const a = i * (V + 1) + j, b = (i + 1) * (V + 1) + j;
  if (flip > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
  else idx.push(a, a + 1, b, b, a + 1, b + 1);
}

const bytes = writeGlb(new URL("../public/models/plain-ring.glb", import.meta.url), {
  pos,
  nor,
  uv,
  idx,
  images,
  generator: "to.w make-plain-ring",
  material: {
    name: "silver-handmade",
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      baseColorTexture: { index: 0 },
      metallicFactor: 1,
      roughnessFactor: 1,
      metallicRoughnessTexture: { index: 1 },
    },
    occlusionTexture: { index: 1 },
    normalTexture: { index: 2 },
  },
});
console.log(`plain-ring.glb ${(bytes / 1024) | 0} KB (maps ${images.map((m) => ((m.data.length / 1024) | 0) + " KB").join(", ")})`);
