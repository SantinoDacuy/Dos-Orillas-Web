import assetManifest from '@/data/asset-manifest.json';
export interface AssetRecord { src: string; width: number; height: number; blurDataURL?: string }
const assets: Record<string, AssetRecord> = assetManifest;
export function getAsset(path: string) { return assets[path]; }
