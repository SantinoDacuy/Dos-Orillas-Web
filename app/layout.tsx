import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import '@/styles/fonts.css';
import '@/styles/globals.css';
import '@/styles/motion.css';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { ProjectTransitionsProvider } from '@/components/motion/ProjectTransitions';
import { SiteShell } from '@/components/layout/SiteShell';
import '@/styles/shell.css';
import '@/styles/logo-spotlight.css';
import '@/styles/scenes.css';
import '@/styles/distance.css';
import '@/styles/approach.css';
import '@/styles/studio.css';
import '@/styles/hero-film.css';
import '@/styles/key-visual.css';
import '@/styles/projects-grid.css';
import '@/styles/projects-grid-lite.css';
import '@/styles/project-transitions.css';
import '@/styles/editorial.css';
import '@/styles/contact.css';
import '@/styles/projects-showcase.css';
import '@/styles/stack.css';
import '@/styles/proceso.css';
import '@/styles/living-bg.css';
import { buildSiteMetadata } from '@/lib/seo';
export const metadata: Metadata = buildSiteMetadata();
export const viewport: Viewport = { themeColor: '#F2EEE6' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  for (const file of ['archivo', 'geist', 'geist-mono']) {
    preload(`/fonts/${file}.woff2`, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
  return <html lang="es-AR" data-motion-tier="0" data-hero-variant="film" suppressHydrationWarning>
    <head />
    <body><MotionProvider><ProjectTransitionsProvider><SiteShell>{children}</SiteShell></ProjectTransitionsProvider></MotionProvider><div className="grain" aria-hidden="true" /></body></html>;
}
