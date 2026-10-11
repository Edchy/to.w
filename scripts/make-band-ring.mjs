// A plain silver band with a real ring's section: flat on the inside (where it sits on the finger),
// domed on the outside, the edges softly rounded. A thin band: 1.6 mm wide, 1.2 mm thick, ring size
// 17 (17 mm inside). Made by hand, so not perfect:
//   - a little out of round, a touch wider and thicker in places, a faint warp;
//   - the surface has a fine grain, shallow hammer dents and a few file marks (a bump map), and is a
//     bit duller in the dents. No colour is baked in: the silver colour is set on the material;
//   - on the flat inside, the hallmarks are punched in: "S925" (sterling) and the maker's mark "O·",
//     followed by a line of Karin Boye's "I rörelse" (1927, public domain). Small and shallow, as on
//     a real ring: you have to catch it in the light to read it. Pressed in: sunk into the metal, a
//     little darker and duller at the bottom, with the faint rim a punch leaves round each letter.
// One ring per typeface for the poem (FACES), to compare them; the ring itself is the same in all.
// Generated from a fixed seed, so every run gives the same ring.
// Writes public/models/band-ring-<face>.glb. Run: node scripts/make-band-ring.mjs
import sharp from "sharp";
import { writeGlb } from "./write-glb.mjs";
import { textPath } from "./font-path.mjs";

const WIDTH = 1.6; // mm, along the finger
const THICK = 1.2; // mm, from inside to outside
const INSIDE = 17; // mm, inside diameter (size 17)
const w0 = WIDTH / 2, t0 = THICK / 2;
const R0 = INSIDE / 2 + t0; // centre of the section
const U = 320; // mesh steps round the ring
const V = 56; // mesh steps round the section
const INNER_N = 6; // the inside: nearly flat, rounded at the edges
const OUTER_N = 2.3; // the outside: a dome
const TW = 2048; // texture width: round the ring (≈ 58 mm)
const TH = 256; // texture height: round the section (≈ 7.5 mm)
const sgnPow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

// The section: b runs round it; cos b > 0 is the outside (dome), cos b < 0 the inside (flat). The
// texture runs round it by length, not by b, so it isn't stretched where the section is flat.
const section = (b, t = t0, w = w0) => {
  const cb = Math.cos(b), sb = Math.sin(b), n = cb < 0 ? INNER_N : OUTER_N;
  return [t * sgnPow(cb, 2 / n), w * sgnPow(sb, 2 / n)];
};
const along = [0];
for (let j = 1; j <= V; j++) {
  const [x0, y0] = section(((j - 1) / V) * Math.PI * 2), [x1, y1] = section((j / V) * Math.PI * 2);
  along.push(along[j - 1] + Math.hypot(x1 - x0, y1 - y0));
}
const PERIM = along[V]; // mm round the section
const vOf = (j) => along[j] / PERIM; // texture v of section step j
const PU = (2 * Math.PI * R0) / TW;
const PV = PERIM / TH;

let seed = 23;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a, b) => a + (b - a) * rand();
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

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
const grain = noise(1100, 140);
const grain2 = noise(420, 50);
const BASE = new Float32Array(TW * TH); // the surface before any lettering
for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
  BASE[y * TW + x] = (grain(x, y) - 0.5) * 0.004 + (grain2(x, y) - 0.5) * 0.005;
}
const wrapX = (x) => ((x % TW) + TW) % TW;
const wrapY = (y) => ((y % TH) + TH) % TH;

// Hammer dents: wide and shallow, so the light breaks into soft facets rather than spots.
for (let k = 0; k < 260; k++) {
  const cx = rand() * TW, cy = rand() * TH, rad = between(0.35, 0.8), depth = between(0.006, 0.016);
  const rx = Math.ceil(rad / PU), ry = Math.ceil(rad / PV);
  for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
    const d = Math.hypot(dx * PU, dy * PV) / rad;
    if (d >= 1) continue;
    BASE[wrapY(Math.round(cy) + dy) * TW + wrapX(Math.round(cx) + dx)] -= depth * (1 - d * d) ** 2;
  }
}

// File marks: a few fine lines, mostly round the ring.
for (let k = 0; k < 40; k++) {
  const angle = between(-0.25, 0.25), len = between(0.6, 2.2), width = between(0.01, 0.022), depth = between(0.002, 0.006);
  const sx = rand() * TW, sy = rand() * TH, ex = len * Math.cos(angle), ey = len * Math.sin(angle);
  const bx = Math.ceil((Math.abs(ex) + width) / PU) + 1, by = Math.ceil((Math.abs(ey) + width) / PV) + 1;
  for (let dy = -by; dy <= by; dy++) for (let dx = -bx; dx <= bx; dx++) {
    const px = dx * PU, py = dy * PV;
    const t = clamp((px * ex + py * ey) / (ex * ex + ey * ey));
    const dist = Math.hypot(px - t * ex, py - t * ey) / width;
    if (dist >= 1) continue;
    BASE[wrapY(Math.round(sy) + dy) * TW + wrapX(Math.round(sx) + dx)] -= depth * (1 - dist * dist);
  }
}

// ─── The mesh (the same for every typeface) ────────────────────────────────────
const R = (a) => R0 * (1 + 0.008 * Math.sin(2 * a + 0.7) + 0.004 * Math.sin(3 * a + 2.1));
const w = (a) => w0 * (1 + 0.04 * Math.sin(3 * a + 0.4) + 0.02 * Math.sin(7 * a + 1.1));
const t = (a) => t0 * (1 + 0.05 * Math.sin(4 * a + 1.3) + 0.025 * Math.sin(9 * a + 0.5));
const lift = (a) => 0.08 * Math.sin(a + 1.3) + 0.03 * Math.sin(3 * a + 0.2);

const P = [];
for (let i = 0; i < U; i++) {
  const a = (i / U) * Math.PI * 2;
  for (let j = 0; j < V; j++) {
    const [sx, sy] = section((j / V) * Math.PI * 2, t(a), w(a));
    P.push([(R(a) + sx) * Math.cos(a), lift(a) + sy, (R(a) + sx) * Math.sin(a)]);
  }
}
const at = (i, j) => (((i % U) + U) % U) * V + (((j % V) + V) % V);
const N = P.map(() => [0, 0, 0]);
for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
  for (const [a, b, c] of [[at(i, j), at(i + 1, j), at(i, j + 1)], [at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]]) {
    const e1 = [0, 1, 2].map((k) => P[b][k] - P[a][k]), e2 = [0, 1, 2].map((k) => P[c][k] - P[a][k]);
    const nrm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) N[v][k] += nrm[k];
  }
}
const flip = N[0][0] < 0 ? -1 : 1; // point 0 is on the outside at +x

const pos = [], nor = [], uv = [], idx = [];
for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
  const p = P[at(i, j)], nv = N[at(i, j)], l = Math.hypot(...nv) || 1;
  pos.push(p[0] / 1000, p[1] / 1000, p[2] / 1000);
  nor.push((flip * nv[0]) / l, (flip * nv[1]) / l, (flip * nv[2]) / l);
  uv.push(i / U, vOf(j));
}
for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
  const a = i * (V + 1) + j, b = (i + 1) * (V + 1) + j;
  if (flip > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
  else idx.push(a, a + 1, b, b, a + 1, b + 1);
}

// ─── The lettering ────────────────────────────────────────────────────────────
// On the flat inside (section step V/2 is b = π), the hallmarks and then the poem, one after the
// other round the ring. The inside is shorter than the middle of the band the texture is measured
// on, so the lettering is drawn wider by that ratio to come out true.
// Karin Boye, "I rörelse" (1927): its two lines, with a gap for the line break.
const POEM = ["Nog finns det mål och mening i vår färd", "men det är vägen, som är mödan värd."];
const POEM_EM = 0.75; // mm: the poem's type size
const HALLMARK = { text: "S925  O·", font: 'font-family="Helvetica, Arial, sans-serif" font-weight="700" letter-spacing="8"', em: 0.6 };
const FACES = {
  baskerville: { font: 'font-family="Baskerville" font-style="italic"' }, // a bookish serif (17, 18)
  mono: { file: new URL("../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-200-italic.woff", import.meta.url) }, // like a laser engraving (16, 19)
};
const INSIDE_STRETCH = R0 / (INSIDE / 2);
// sharp turns one-channel images into three channels on many operations, so every step that
// hands raw pixels on takes channel 0 explicitly.
const clean = async (data, w, h) => {
  const out = await sharp(data, w ? { raw: { width: w, height: h, channels: 1 } } : undefined).blur(0.4).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  if (out.info.channels !== 1) throw new Error(`lettering has ${out.info.channels} channels, expected 1`);
  let ink = 0;
  for (const v of out.data) if (v > 64) ink++;
  if (ink === 0) throw new Error("lettering came out empty");
  return out;
};

// White-on-black lettering at an em of `em` mm, drawn at the texture's resolution: from a .woff's
// own outlines (`file`), or set in a system font (`font`: SVG attributes).
async function letter(text, { font, file }, em) {
  if (file) {
    const p = textPath(file, text);
    const h = Math.round(((p.height / p.unitsPerEm) * em) / PV);
    const w = Math.round(((p.width / p.unitsPerEm) * em * INSIDE_STRETCH) / PU);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${p.width} ${p.height}" preserveAspectRatio="none"><rect width="100%" height="100%" fill="black"/><path fill="white" d="${p.d}"/></svg>`;
    return clean(Buffer.from(svg));
  }
  // System font: set at 160 px on a fixed baseline, cropped at the sides only (so every line keeps
  // the same size), then scaled so 160 px is one em.
  const SIZE = 160, BOX = 280;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14000" height="${BOX}"><rect width="100%" height="100%" fill="black"/><text x="20" y="${BOX * 0.68}" ${font} font-size="${SIZE}" fill="white">${text}</text></svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).removeAlpha().toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  let left = info.width, right = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[y * info.width + x] > 20) { left = Math.min(left, x); right = Math.max(right, x); }
  }
  const cropped = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } }).extract({ left, top: 0, width: right - left + 1, height: info.height }).extractChannel(0).raw().toBuffer();
  const scale = em / SIZE; // mm per px
  const w = Math.round(((right - left + 1) * scale * INSIDE_STRETCH) / PU), h = Math.round((info.height * scale) / PV);
  const sized = await sharp(cropped, { raw: { width: right - left + 1, height: info.height, channels: 1 } }).resize({ width: w, height: h, fit: "fill" }).extractChannel(0).raw().toBuffer();
  return clean(sized, w, h);
}

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

const hallmark = await letter(HALLMARK.text, HALLMARK, HALLMARK.em);
const jpeg = (data, quality) => sharp(data, { raw: { width: TW, height: TH, channels: 3 } }).jpeg({ quality }).toBuffer();

for (const [name, face] of Object.entries(FACES)) {
  const H = BASE.slice();
  const MARK = new Float32Array(TW * TH); // 0–1: where the lettering is pressed in
  const press = ({ data, info }, x0, depth) => {
    const y0 = Math.round(vOf(V / 2) * TH - info.height / 2);
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const i = wrapY(y0 + y) * TW + wrapX(x0 + x), v = data[y * info.width + x] / 255;
      H[i] -= depth * v;
      MARK[i] = Math.max(MARK[i], v);
    }
  };
  const x0 = Math.round(TW * 0.3);
  press(hallmark, x0, 0.03);
  const gap = Math.round(1.4 / PU);
  let x = x0 + hallmark.info.width;
  for (const line of POEM) {
    const cut = await letter(line, face, POEM_EM);
    x += gap;
    press(cut, x, 0.02);
    x += cut.info.width;
  }
  const used = (x - x0) / TW;
  if (used > 0.92) throw new Error(`${name}: the poem doesn't fit round the inside.`);

  // The faint rim a punch raises just outside each letter.
  const spread = blur(MARK, 2);
  for (let i = 0; i < H.length; i++) H[i] += 0.006 * clamp(spread[i] - MARK[i]) * 2;

  // The surface maps: occlusion/roughness/metalness, and normals. Duller in dents and letters.
  const around = blur(H, 8);
  const orm = Buffer.alloc(TW * TH * 3);
  const normal = Buffer.alloc(TW * TH * 3);
  for (let y = 0; y < TH; y++) for (let xx = 0; xx < TW; xx++) {
    const i = y * TW + xx, o = i * 3;
    const cavity = clamp((around[i] - H[i]) / 0.012);
    orm[o] = Math.round(255 * (1 - 0.25 * cavity) * (1 - 0.3 * MARK[i]));
    orm[o + 1] = Math.round(255 * clamp(0.55 + 0.45 * cavity + 0.25 * MARK[i])); // scaled by the material's roughness
    orm[o + 2] = 255;
    const sx = (H[y * TW + wrapX(xx + 1)] - H[y * TW + wrapX(xx - 1)]) / (2 * PU);
    const sy = (H[wrapY(y + 1) * TW + xx] - H[wrapY(y - 1) * TW + xx]) / (2 * PV);
    const len = Math.hypot(sx, sy, 1);
    normal[o] = Math.round(255 * (0.5 - (0.5 * sx) / len));
    normal[o + 1] = Math.round(255 * (0.5 - (0.5 * sy) / len));
    normal[o + 2] = Math.round(255 * (0.5 + 0.5 / len));
  }
  const images = [
    { data: await jpeg(orm, 88), mimeType: "image/jpeg" },
    { data: await jpeg(normal, 94), mimeType: "image/jpeg" },
  ];

  const bytes = writeGlb(new URL(`../public/models/band-ring-${name}.glb`, import.meta.url), {
    pos,
    nor,
    uv,
    idx,
    images,
    generator: "to.w make-band-ring",
    material: {
      name: "silver-band",
      pbrMetallicRoughness: {
        baseColorFactor: [0.97, 0.97, 0.98, 1],
        metallicFactor: 1,
        roughnessFactor: 0.5,
        metallicRoughnessTexture: { index: 0 },
      },
      occlusionTexture: { index: 0 },
      normalTexture: { index: 1 },
    },
  });
  console.log(`band-ring-${name}.glb ${(bytes / 1024) | 0} KB, lettering ${(used * 100) | 0}% of the way round`);
}
