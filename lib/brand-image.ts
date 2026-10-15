import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type OfficialAsset = 'mark.svg' | 'logo-horizontal-light.svg';
interface BrandImage { src: string; width: number; height: number }
const images = new Map<OfficialAsset, Promise<BrandImage>>();

/** Decode the supplied SVG unchanged; its real viewBox controls the aspect ratio. */
export function officialBrandImage(name: OfficialAsset): Promise<BrandImage> {
  const cached = images.get(name);
  if (cached) return cached;
  const image = readFile(join(process.cwd(), 'public/brand', name)).then(bytes => {
    const header = bytes.toString('utf8').match(/<svg\b[^>]*>/)?.[0];
    const box = header?.match(/\bviewBox=["']([^"']+)["']/)?.[1]?.trim().split(/[\s,]+/).map(Number);
    const width = box?.[2]; const height = box?.[3];
    if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0) throw new Error('Official SVG viewBox unavailable.');
    return { src: `data:image/svg+xml;base64,${bytes.toString('base64')}`, width, height };
  }).catch(error => { images.delete(name); throw error; });
  images.set(name, image); return image;
}
