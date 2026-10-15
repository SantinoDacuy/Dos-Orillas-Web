import { resolveSEOConfig, type SEOEnvironment } from '../lib/seo-config';

export function buildSEOHeaders(environment: SEOEnvironment = process.env) {
  const header = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
  if (!resolveSEOConfig(environment).indexable) return [{ source: '/:path*', headers: header }];
  return ['/api/:path*', '/motion-lab', '/motion-lab/:path*', '/privacidad'].map(source => ({ source, headers: header }));
}
