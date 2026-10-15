import { brandCopy, projectsCopy, siteConfig } from '@/content/site';

export const seoCopy = {
  projectsTitle: `${projectsCopy.all} — ${siteConfig.name}`,
  homeImageAlt: siteConfig.metadata.title,
  shortName: brandCopy.wordmark,
} as const;

// ImageResponse cannot read CSS variables; these are the existing navy-deep tokens.
export const seoVisual = {
  image: { width: 1200, height: 630 },
  apple: { width: 180, height: 180 },
  background: '#071725', foreground: '#F2EEE6', accent: '#7FA6CF',
  iconBackground: '#F2EEE6',
} as const;
