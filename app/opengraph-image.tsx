/* eslint-disable @next/next/no-img-element -- ImageResponse renders the official SVG into a PNG. */
import { ImageResponse } from 'next/og';
import { heroCopy, siteConfig } from '@/content/site';
import { seoCopy, seoVisual } from '@/content/seo-copy';
import { officialBrandImage } from '@/lib/brand-image';

export const runtime = 'nodejs';
export const alt = seoCopy.homeImageAlt;
export const size = seoVisual.image;
export const contentType = 'image/png';

export default async function HomeOpenGraph() {
  const logo = await officialBrandImage('logo-horizontal-light.svg');
  const width = 540;
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '52px 64px', background: seoVisual.background, color: seoVisual.foreground }}>
    <img src={logo.src} alt={siteConfig.name} width={width} height={width * logo.height / logo.width} />
    <div style={{ display: 'flex', height: 1, width: '100%', background: seoVisual.accent, marginTop: 32 }} />
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36, fontSize: 64, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em' }}>
      {heroCopy.philosophyLines.map(line => <div style={{ display: 'flex' }} key={line}>{line}</div>)}
    </div>
    <div style={{ display: 'flex', maxWidth: 960, marginTop: 26, fontSize: 27, lineHeight: 1.35 }}>{siteConfig.metadata.description}</div>
    <div style={{ display: 'flex', marginTop: 'auto', paddingTop: 24, fontSize: 21, color: seoVisual.accent }}>{siteConfig.location.label}</div>
  </div>, size);
}
