// Writes one mesh as a binary glTF (.glb): positions in metres, normals, optional linear vertex
// colours and texture coordinates, triangle indices, one PBR material, and optional embedded images
// (the material refers to them by index as textures). Shared by the ring scripts.
import { writeFileSync } from "node:fs";

export function writeGlb(url, { pos, nor, col, uv, idx, material, generator, images = [] }) {
  const P = new Float32Array(pos), N = new Float32Array(nor), I = new Uint32Array(idx);
  const views = [], accessors = [], chunks = [];
  let offset = 0;
  const add = (arr, target, accessor) => {
    const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    chunks.push(b, Buffer.alloc((4 - (b.length % 4)) % 4));
    views.push({ buffer: 0, byteOffset: offset, byteLength: b.length, target });
    offset += b.length + ((4 - (b.length % 4)) % 4);
    accessors.push({ bufferView: views.length - 1, ...accessor });
    return accessors.length - 1;
  };
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i++) { min[i % 3] = Math.min(min[i % 3], P[i]); max[i % 3] = Math.max(max[i % 3], P[i]); }
  const attributes = {
    POSITION: add(P, 34962, { componentType: 5126, count: P.length / 3, type: "VEC3", min, max }),
    NORMAL: add(N, 34962, { componentType: 5126, count: N.length / 3, type: "VEC3" }),
  };
  if (col) attributes.COLOR_0 = add(new Float32Array(col), 34962, { componentType: 5126, count: col.length / 3, type: "VEC3" });
  if (uv) attributes.TEXCOORD_0 = add(new Float32Array(uv), 34962, { componentType: 5126, count: uv.length / 2, type: "VEC2" });
  const indices = add(I, 34963, { componentType: 5125, count: I.length, type: "SCALAR" });
  // Images go in the same binary chunk, each in its own buffer view.
  const gltfImages = images.map(({ data, mimeType }) => {
    chunks.push(data, Buffer.alloc((4 - (data.length % 4)) % 4));
    views.push({ buffer: 0, byteOffset: offset, byteLength: data.length });
    offset += data.length + ((4 - (data.length % 4)) % 4);
    return { bufferView: views.length - 1, mimeType };
  });
  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes, indices, material: 0 }] }],
    materials: [material],
    ...(images.length && {
      images: gltfImages,
      samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
      textures: gltfImages.map((_, source) => ({ sampler: 0, source })),
    }),
    buffers: [{ byteLength: bin.length }],
    bufferViews: views,
    accessors,
  };
  const pad = (b, fill) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, fill)]);
  const json = pad(Buffer.from(JSON.stringify(gltf)), 0x20);
  const body = pad(bin, 0);
  const chunk = (b, type) => { const head = Buffer.alloc(8); head.writeUInt32LE(b.length, 0); head.writeUInt32LE(type, 4); return Buffer.concat([head, b]); };
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8);
  const file = Buffer.concat([header, chunk(json, 0x4e4f534a), chunk(body, 0x004e4942)]);
  writeFileSync(url, file);
  return file.length;
}
