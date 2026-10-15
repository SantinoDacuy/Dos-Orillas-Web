/* eslint-disable @next/next/no-img-element -- ImageResponse renders SVG/raster data, not a browser page. */
import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { getProjectBySlug } from '@/data/projects';
import { siteConfig } from '@/content/site';
import { projectCaseCopy } from '@/content/project-case';
import { getProjectCoverAsset } from '@/components/projects/project-content';

export const alt = projectCaseCopy.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const wordmark = readFile(join(process.cwd(), 'public', 'brand', 'logo-horizontal-light.svg'), 'base64')
  .then(data => `data:image/svg+xml;base64,${data}`);

async function getCoverData(path: string | undefined) {
  if (!path) return null;
  const mime: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };
  const type = mime[extname(path).toLowerCase()];
  if (!type) return null;
  try {
    const data = await readFile(join(process.cwd(), 'public', path.replace(/^\/+/, '')), 'base64');
    return `data:${type};base64,${data}`;
  } catch {
    return null;
  }
}

export default async function ProjectOpenGraph({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const [logo, cover] = await Promise.all([wordmark, getCoverData(getProjectCoverAsset(project)?.src)]);
  const lines = project.titleLines.length ? project.titleLines : [project.title];
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: project.tone.bg, color: project.tone.fg }}>
    {cover && <img src={cover} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
    {cover && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(7,23,37,.3),rgba(7,23,37,.94))' }} />}
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '56px 64px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <img src={logo} alt={siteConfig.name} width={280} height={38} />
        <span style={{ fontSize: 18, color: '#7FA6CF' }}>{siteConfig.projectContextLabels[project.context]}</span>
      </div>
      <div style={{ height: 1, width: '100%', background: '#7FA6CF', marginTop: 40 }} />
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 32, fontSize: 82, fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.03em' }}>
        {lines.map((line, index) => <div style={{ display: 'flex' }} key={`${index}-${line}`}>{line}</div>)}
      </div>
      <span style={{ marginTop: 28, fontSize: 20, color: '#7FA6CF' }}>{project.categoryLabel}</span>
    </div>
  </div>, size);
}
