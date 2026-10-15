/* eslint-disable @next/next/no-img-element -- ImageResponse renders the official SVG into a PNG. */
import { ImageResponse } from 'next/og';
import { seoVisual } from '@/content/seo-copy';
import { officialBrandImage } from '@/lib/brand-image';

export const runtime = 'nodejs';
export const size = seoVisual.apple;
export const contentType = 'image/png';

export default async function AppleIcon() {
  const mark = await officialBrandImage('mark.svg');
  const scale = Math.min(132 / mark.width, 132 / mark.height);
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: seoVisual.iconBackground }}>
    <img src={mark.src} alt="" width={mark.width * scale} height={mark.height * scale} />
  </div>, size);
}
