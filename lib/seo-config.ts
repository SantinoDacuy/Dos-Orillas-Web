export interface SEOEnvironment {
  NEXT_PUBLIC_SITE_URL?: string;
  SITE_INDEXING?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  DEPLOYMENT_ENV?: string;
}
export type SEOIssue = 'url_missing' | 'url_invalid' | 'production_flag_missing' | 'production_runtime_missing' | 'preview_environment';
export interface SEOConfig { base: URL | null; indexable: boolean; issues: readonly SEOIssue[] }

function configuredPublicURL(raw: string | undefined): URL | null {
  if (!raw?.trim() || Array.from(raw).some(character => (character.codePointAt(0) ?? 0) < 32)) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase();
    const labels = host.split('.');
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    if (/^(?:\d+\.){3}\d+$/.test(host) || host.includes(':')) return null;
    if (['localhost', 'local', 'internal', 'test', 'invalid', 'example'].some(suffix => host === suffix || host.endsWith(`.${suffix}`))) return null;
    if (['example.com', 'example.org', 'example.net'].some(example => host === example || host.endsWith(`.${example}`))) return null;
    return new URL(`${url.origin}/`);
  } catch { return null; }
}

/** Deployment intent never overrides an invalid URL or an explicit preview environment. */
export function resolveSEOConfig(environment: SEOEnvironment = process.env): SEOConfig {
  const base = configuredPublicURL(environment.NEXT_PUBLIC_SITE_URL);
  const issues: SEOIssue[] = [];
  if (!environment.NEXT_PUBLIC_SITE_URL?.trim()) issues.push('url_missing');
  else if (!base) issues.push('url_invalid');
  if (environment.SITE_INDEXING !== 'production') issues.push('production_flag_missing');
  if (environment.NODE_ENV !== 'production') issues.push('production_runtime_missing');
  const explicitPreview = [environment.VERCEL_ENV, environment.DEPLOYMENT_ENV].some(value => value !== undefined && value !== 'production');
  if (explicitPreview) issues.push('preview_environment');
  return { base, indexable: Boolean(base && issues.length === 0), issues };
}

export function absoluteSiteURL(config: SEOConfig, pathname: string): string | undefined {
  if (!config.base || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) return undefined;
  try { const url = new URL(pathname, config.base); return url.origin === config.base.origin ? url.href : undefined; }
  catch { return undefined; }
}
