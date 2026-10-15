import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const source = path.resolve('assets-src');
const target = path.resolve('public');
const widths = [640, 960, 1440, 1920, 2560];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(jpe?g|png|webp|avif)$/i.test(entry.name)) {
      const relative = path.relative(source, file).replace(/\.[^.]+$/, '');
      const dest = path.join(target, relative);
      await mkdir(path.dirname(dest), { recursive: true });
      await sharp(file).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 76 }).toFile(`${dest}.webp`);
      for (const width of widths) {
        await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 76 }).toFile(`${dest}-${width}.webp`);
        await sharp(file).rotate().resize({ width, withoutEnlargement: true }).avif({ quality: 72 }).toFile(`${dest}-${width}.avif`);
      }
      const blur = await sharp(file).resize(10).webp({ quality: 25 }).toBuffer();
      await writeFile(`${dest}.lqip.txt`, `data:image/webp;base64,${blur.toString('base64')}`);
      console.log(relative);
    }
  }
}
await mkdir(source, { recursive: true });
await walk(source);
