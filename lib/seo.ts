import type { Metadata, MetadataRoute } from 'next';
import { projects, type Project } from '@/data/projects';
import { siteConfig } from '@/content/site';
import { seoCopy, seoVisual } from '@/content/seo-copy';
import { absoluteSiteURL, resolveSEOConfig, type SEOConfig } from './seo-config';

function pageMetadata(title: string, description: string, path: string, imagePath: string, imageAlt: string, config: SEOConfig): Metadata {
  const canonical = absoluteSiteURL(config, path);
  const image = absoluteSiteURL(config, imagePath);
  return {
    title, description,
    ...(config.base ? { metadataBase: config.base } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: { index: config.indexable, follow: config.indexable },
    openGraph: {
      title, description, type: 'website', siteName: siteConfig.name, locale: siteConfig.locale.replace('-', '_'),
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [{ url: image, ...seoVisual.image, alt: imageAlt }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [{ url: image, alt: imageAlt }] } : {}) },
  };
}

export function buildSiteMetadata(config = resolveSEOConfig()): Metadata {
  return {
    ...pageMetadata(siteConfig.metadata.title, siteConfig.metadata.description, '/', '/opengraph-image', seoCopy.homeImageAlt, config),
    applicationName: siteConfig.name,
    icons: { icon: [{ url: '/brand/mark.svg', type: 'image/svg+xml' }], apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }] },
    manifest: '/manifest.webmanifest',
  };
}

export function buildProjectsMetadata(config = resolveSEOConfig()): Metadata {
  return pageMetadata(seoCopy.projectsTitle, siteConfig.metadata.description, '/projects', '/opengraph-image', seoCopy.homeImageAlt, config);
}

export function buildProjectMetadata(project: Project, config = resolveSEOConfig()): Metadata {
  const path = `/projects/${encodeURIComponent(project.slug)}`;
  return pageMetadata(`${project.title} — ${siteConfig.name}`, project.description, path, `${path}/opengraph-image`, project.title, config);
}

export function buildSitemap(config = resolveSEOConfig()): MetadataRoute.Sitemap {
  const base = config.base;
  if (!config.indexable || !base) return [];
  const paths = ['/', '/projects', ...[...projects].sort((a, b) => a.order - b.order).map(project => `/projects/${encodeURIComponent(project.slug)}`)];
  return paths.map(path => ({ url: new URL(path, base).href }));
}

export function buildRobots(config = resolveSEOConfig()): MetadataRoute.Robots {
  // Allow preview crawlers to read the actual noindex response headers/meta tags.
  if (!config.indexable) return { rules: { userAgent: '*', allow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/motion-lab', '/privacidad'] },
    sitemap: absoluteSiteURL(config, '/sitemap.xml'),
    ...(config.base ? { host: config.base.origin } : {}),
  };
}

export function buildManifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name, short_name: seoCopy.shortName, description: siteConfig.metadata.description,
    lang: siteConfig.locale, dir: 'ltr', id: '/', start_url: '/', scope: '/', display: 'browser',
    background_color: seoVisual.iconBackground, theme_color: seoVisual.iconBackground,
    icons: [{ src: '/brand/mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
