// Turns a line of text into an SVG path, read straight from a .woff font file (TrueType outlines).
// The ring scripts use it to cut lettering in the site's own typefaces: the system's text renderer
// can't be pointed at a web font. Handles simple and composite glyphs (accented letters), the
// glyphs' advance widths and the font's character map; no kerning or ligatures.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

function tablesOf(file) {
  const w = readFileSync(file);
  if (w.toString("ascii", 0, 4) !== "wOFF") throw new Error(`${file}: not a WOFF font`);
  const tables = {};
  for (let i = 0, n = w.readUInt16BE(12); i < n; i++) {
    const o = 44 + i * 20;
    const tag = w.toString("ascii", o, o + 4), off = w.readUInt32BE(o + 4), comp = w.readUInt32BE(o + 8), orig = w.readUInt32BE(o + 12);
    const raw = w.subarray(off, off + comp);
    tables[tag] = comp < orig ? inflateSync(raw) : raw;
  }
  return tables;
}

// Character → glyph index, from a format 4 subtable of the character map.
function charMap(cmap) {
  for (let i = 0, n = cmap.readUInt16BE(2); i < n; i++) {
    const platform = cmap.readUInt16BE(4 + i * 8), encoding = cmap.readUInt16BE(6 + i * 8), off = cmap.readUInt32BE(8 + i * 8);
    if (platform !== 3 || encoding !== 1 || cmap.readUInt16BE(off) !== 4) continue;
    const segs = cmap.readUInt16BE(off + 6) / 2;
    const ends = off + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, ranges = deltas + segs * 2;
    return (code) => {
      for (let s = 0; s < segs; s++) {
        if (code > cmap.readUInt16BE(ends + s * 2)) continue;
        const start = cmap.readUInt16BE(starts + s * 2);
        if (code < start) return 0;
        const delta = cmap.readInt16BE(deltas + s * 2), range = cmap.readUInt16BE(ranges + s * 2);
        if (range === 0) return (code + delta) & 0xffff;
        const g = cmap.readUInt16BE(ranges + s * 2 + range + (code - start) * 2);
        return g === 0 ? 0 : (g + delta) & 0xffff;
      }
      return 0;
    };
  }
  throw new Error("no Unicode character map in the font");
}

export function textPath(file, text) {
  const t = tablesOf(file);
  const unitsPerEm = t.head.readUInt16BE(18), longLoca = t.head.readInt16BE(50) === 1;
  const ascent = t.hhea.readInt16BE(4), descent = t.hhea.readInt16BE(6), metrics = t.hhea.readUInt16BE(34);
  const glyphOf = charMap(t.cmap);
  const loca = (g) => (longLoca ? t.loca.readUInt32BE(g * 4) : t.loca.readUInt16BE(g * 2) * 2);
  const advance = (g) => t.hmtx.readUInt16BE(Math.min(g, metrics - 1) * 4);

  // A glyph's contours, as lists of points { x, y, on } in font units, moved by (dx, dy).
  function contours(g, dx = 0, dy = 0) {
    const start = loca(g), end = loca(g + 1);
    if (start === end) return [];
    const d = t.glyf.subarray(start, end);
    const n = d.readInt16BE(0);
    if (n < 0) {
      // Composite: other glyphs placed at offsets.
      const out = [];
      let p = 10, flags;
      do {
        flags = d.readUInt16BE(p);
        const part = d.readUInt16BE(p + 2);
        p += 4;
        let ax, ay;
        if (flags & 1) { ax = d.readInt16BE(p); ay = d.readInt16BE(p + 2); p += 4; }
        else { ax = d.readInt8(p); ay = d.readInt8(p + 1); p += 2; }
        if (flags & 8) p += 2; else if (flags & 0x40) p += 4; else if (flags & 0x80) p += 8;
        out.push(...contours(part, dx + (flags & 2 ? ax : 0), dy + (flags & 2 ? ay : 0)));
      } while (flags & 0x20);
      return out;
    }
    const endPts = Array.from({ length: n }, (_, i) => d.readUInt16BE(10 + i * 2));
    const count = endPts[n - 1] + 1;
    let p = 10 + n * 2;
    p += 2 + d.readUInt16BE(p); // skip the instructions
    const flags = [];
    while (flags.length < count) {
      const f = d[p++];
      flags.push(f);
      if (f & 8) for (let r = d[p++]; r > 0; r--) flags.push(f);
    }
    const coord = (shortBit, sameBit) => {
      const out = [];
      let v = 0;
      for (const f of flags) {
        if (f & shortBit) { const b = d[p++]; v += f & sameBit ? b : -b; }
        else if (!(f & sameBit)) { v += d.readInt16BE(p); p += 2; }
        out.push(v);
      }
      return out;
    };
    const xs = coord(2, 16), ys = coord(4, 32);
    const out = [];
    let from = 0;
    for (const last of endPts) {
      const pts = [];
      for (let i = from; i <= last; i++) pts.push({ x: xs[i] + dx, y: ys[i] + dy, on: !!(flags[i] & 1) });
      out.push(pts);
      from = last + 1;
    }
    return out;
  }

  // Quadratic contours to SVG commands (y flipped: SVG runs down), with the implied on-curve
  // points between two off-curve ones.
  const f = (v) => +v.toFixed(1);
  const parts = [];
  let pen = 0;
  for (const ch of text) {
    const g = glyphOf(ch.codePointAt(0));
    for (const raw of contours(g)) {
      const pts = raw.map((q) => ({ x: q.x + pen, y: ascent - q.y, on: q.on }));
      const startAt = pts.findIndex((q) => q.on);
      let s;
      if (startAt >= 0) s = pts[startAt];
      else s = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, on: true };
      const ring = startAt >= 0 ? [...pts.slice(startAt + 1), ...pts.slice(0, startAt + 1)] : [...pts.slice(1), pts[0]];
      let cmd = `M${f(s.x)} ${f(s.y)}`;
      let ctrl = null;
      for (const q of ring) {
        if (q.on) { cmd += ctrl ? `Q${f(ctrl.x)} ${f(ctrl.y)} ${f(q.x)} ${f(q.y)}` : `L${f(q.x)} ${f(q.y)}`; ctrl = null; }
        else if (ctrl) { const m = { x: (ctrl.x + q.x) / 2, y: (ctrl.y + q.y) / 2 }; cmd += `Q${f(ctrl.x)} ${f(ctrl.y)} ${f(m.x)} ${f(m.y)}`; ctrl = q; }
        else ctrl = q;
      }
      if (ctrl) cmd += `Q${f(ctrl.x)} ${f(ctrl.y)} ${f(s.x)} ${f(s.y)}`;
      parts.push(cmd + "Z");
    }
    pen += advance(g);
  }
  return { d: parts.join(""), width: pen, height: ascent - descent, unitsPerEm };
}
