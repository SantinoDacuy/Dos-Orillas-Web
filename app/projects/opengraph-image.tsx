import HomeOpenGraph from '../opengraph-image';
import { seoCopy, seoVisual } from '@/content/seo-copy';

// A route-local file convention preserves the shared card when the projects
// page replaces its parent's OpenGraph object without a configured origin.
export const runtime = 'nodejs';
export const alt = seoCopy.homeImageAlt;
export const size = seoVisual.image;
export const contentType = 'image/png';

export default function ProjectsOpenGraph() {
  return HomeOpenGraph();
}
