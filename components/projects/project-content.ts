import { getProjectCoverPath, type MediaRef, type Project } from '@/data/projects';
import { projectsCopy } from '@/content/site';
import { getAsset } from '@/lib/assets';

export type ProjectChapterId = 'overview' | 'challenge' | 'approach' | 'solution' | 'technologies' | 'gallery' | 'result';

export interface ProjectChapter {
  id: ProjectChapterId;
  title: string;
  number: string;
}

export function getProjectCoverAsset(project: Project) {
  const canonical = getProjectCoverPath(project);
  const path = project.cover.src && getAsset(project.cover.src) ? project.cover.src
    : getAsset(canonical) ? canonical : null;
  return path ? getAsset(path) ?? null : null;
}

/** Gallery references without a real manifest asset do not invent imagery. */
export function getProjectGallery(project: Project): (MediaRef & { src: string })[] {
  return project.gallery.filter((media): media is MediaRef & { src: string } => Boolean(media.src && getAsset(media.src)));
}

export function getProjectChapters(project: Project): ProjectChapter[] {
  const available: { id: ProjectChapterId; content: boolean }[] = [
    { id: 'overview', content: Boolean(project.intro?.trim()) },
    { id: 'challenge', content: Boolean(project.challenge?.trim()) },
    { id: 'approach', content: Boolean(project.approach?.trim()) },
    { id: 'solution', content: Boolean(project.solution?.trim()) },
    { id: 'technologies', content: project.technologies.length > 0 },
    { id: 'gallery', content: getProjectGallery(project).length > 0 },
    { id: 'result', content: Boolean(project.result?.trim()) },
  ];
  return available.filter(chapter => chapter.content).map(({ id }, index) => ({
    id, title: projectsCopy.chapters[id], number: String(index + 1).padStart(2, '0'),
  }));
}

export function projectParagraphs(value: string | null) {
  return value?.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean) ?? [];
}
