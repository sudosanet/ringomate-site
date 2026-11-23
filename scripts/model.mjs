// Copies Tsukuyomi.vrm (not in git: its terms) to public/models/ with textures re-encoded as WebP.
// glTF-Transform drops the VRM 0.x extension, so this rewrites the GLB by hand and leaves everything else as is.
// Usage: node scripts/model.mjs   (APPLEMATE_REPO defaults to ../applemate)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const repo = process.env.APPLEMATE_REPO ?? new URL("../../applemate", import.meta.url).pathname;
const src = `${repo}/assets/tsukuyomi/Tsukuyomi.vrm`;
const out = new URL("../public/models/tsukuyomi.vrm", import.meta.url).pathname;
const MAX = 1024; // px per side; the hero never shows the model larger than this

const glb = await readFile(src);
const jsonLen = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
const bin = glb.subarray(20 + jsonLen + 8);
const thumb = json.extensions?.VRM?.meta?.texture;
const thumbImage = thumb === undefined ? -1 : json.textures[thumb].source;

const views = json.bufferViews.map((v) => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
for (const [i, image] of json.images.entries()) {
  const size = i === thumbImage ? 64 : MAX;
  const webp = await sharp(views[image.bufferView])
    .resize(size, size, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toBuffer();
  views[image.bufferView] = webp;
  image.mimeType = "image/webp";
}
for (const t of json.textures) {
  t.extensions = { ...t.extensions, EXT_texture_webp: { source: t.source } };
  delete t.source;
}
json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), "EXT_texture_webp"])];
json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), "EXT_texture_webp"])];

const pad = (n) => (n + 3) & ~3;
let offset = 0;
const parts = [];
for (const [i, v] of json.bufferViews.entries()) {
  v.byteOffset = offset;
  v.byteLength = views[i].length;
  parts.push(views[i], Buffer.alloc(pad(views[i].length) - views[i].length));
  offset = pad(offset + views[i].length);
}
json.buffers = [{ byteLength: offset }];

const jsonBuf = Buffer.from(JSON.stringify(json));
const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(pad(jsonBuf.length) - jsonBuf.length, 0x20)]);
const binChunk = Buffer.concat(parts);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
const chunk = (type, data) => {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(data.length, 0);
  h.writeUInt32LE(type, 4);
  return [h, data];
};
await mkdir(new URL("../public/models/", import.meta.url), { recursive: true });
await writeFile(out, Buffer.concat([header, ...chunk(0x4e4f534a, jsonChunk), ...chunk(0x004e4942, binChunk)]));
console.log(`${out}: ${(glb.length / 1e6).toFixed(1)} MB -> ${((12 + 16 + jsonChunk.length + binChunk.length) / 1e6).toFixed(1)} MB`);
