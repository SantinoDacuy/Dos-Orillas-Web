import { projectsCopy, siteConfig } from '@/content/site';
import type { Project } from '@/data/projects';
import { absoluteSiteURL, resolveSEOConfig, type SEOConfig } from './seo-config';

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export type StructuredDataObject = { [key: string]: JSONValue };

export function organizationJSONLD(config = resolveSEOConfig()): StructuredDataObject {
  const home = absoluteSiteURL(config, '/');
  const logo = absoluteSiteURL(config, '/brand/mark.svg');
  return {
    '@context': 'https://schema.org', '@type': ['Organization', 'ProfessionalService'],
    name: siteConfig.name, description: siteConfig.metadata.description, email: siteConfig.email,
    sameAs: [siteConfig.instagram.url],
    address: { '@type': 'PostalAddress', addressLocality: siteConfig.location.city, addressRegion: siteConfig.location.region, addressCountry: siteConfig.location.countryCode },
    ...(home ? { '@id': `${home}#organization`, url: home } : {}),
    ...(logo ? { logo } : {}),
  };
}

export function projectBreadcrumbJSONLD(project: Project, config: SEOConfig = resolveSEOConfig()): StructuredDataObject | null {
  const base = config.base;
  if (!base) return null;
  const paths = ['/', '/projects', `/projects/${encodeURIComponent(project.slug)}`];
  const names = [siteConfig.name, projectsCopy.all, project.title];
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: paths.map((path, index) => ({ '@type': 'ListItem', position: index + 1, name: names[index] ?? project.title, item: new URL(path, base).href })),
  };
}

export function serializeJSONLD(data: StructuredDataObject | StructuredDataObject[]): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, character => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[character] ?? character);
}
