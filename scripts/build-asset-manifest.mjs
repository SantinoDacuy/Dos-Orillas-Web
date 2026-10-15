import { readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = process.cwd();
const manifest = {};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(webp|avif|png|jpe?g)$/i.test(entry.name) && !file.includes(`${path.sep}textures${path.sep}`)) {
      const metadata = await sharp(file).metadata();
      const src = '/' + path.relative(path.join(root, 'public'), file).split(path.sep).join('/');
      const blur = await sharp(file).resize(10).webp({ quality: 25 }).toBuffer();
      manifest[src] = { src, width: metadata.width, height: metadata.height, blurDataURL: `data:image/webp;base64,${blur.toString('base64')}` };
    }
  }
}
await mkdir(path.join(root, 'public'), { recursive: true });
await walk(path.join(root, 'public'));
await mkdir(path.join(root, 'data'), { recursive: true });
await writeFile(path.join(root, 'data/asset-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Assets reales: ${Object.keys(manifest).length}`);
