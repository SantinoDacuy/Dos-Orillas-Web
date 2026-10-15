import Image from 'next/image';
import { getAsset } from '@/lib/assets';
interface MediaProps {
  path: string; alt: string; width: number; height: number; sizes: string;
  priority?: boolean; className?: string; focal?: readonly [number, number];
}
export function Media({ path, alt, width, height, sizes, priority = false, className = '', focal = [50, 50] }: MediaProps) {
  const asset = getAsset(path);
  return <div className={`media ${asset ? 'has-media' : 'media-placeholder'} ${className}`} style={{ aspectRatio: `${width}/${height}` }}>
    {asset ? <Image src={asset.src} alt={alt} width={asset.width} height={asset.height} sizes={sizes}
      preload={priority} loading={priority ? undefined : 'lazy'} decoding="async"
      placeholder={asset.blurDataURL ? 'blur' : 'empty'} blurDataURL={asset.blurDataURL}
      style={{ objectPosition: `${focal[0]}% ${focal[1]}%` }} />
      : <><div className="placeholder-hairline" aria-hidden="true" />{process.env.NODE_ENV === 'development' && <span className="placeholder-label" aria-hidden="true">FOTO · {path} · {width}×{height}</span>}</>}
  </div>;
}
