import type { NextConfig } from 'next';
import { buildSEOHeaders } from './config/seo-headers';
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  async redirects() {
    return [{ source: '/proyectos', destination: '/projects', permanent: true }];
  },
  async headers() {
    return [...buildSEOHeaders(), { source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;
