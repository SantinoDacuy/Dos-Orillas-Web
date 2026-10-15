import { Media } from '@/components/ui/Media';
import { getProjectCoverPath, type Project } from '@/data/projects';
import { getAsset } from '@/lib/assets';
import { KeyVisual } from './KeyVisual';

export interface ProjectMediaProps {
  project: Pick<Project, 'slug' | 'title' | 'cover' | 'keyVisual'>;
  sizes?: string;
  ratio?: string;
  priority?: boolean;
  className?: string;
  interactiveKeyVisual?: boolean;
  idScope?: string;
}

/** A real manifest asset wins over a conceptual diagram, including late assets. */
export function ProjectMedia({ project, sizes = '(max-width: 767px) 100vw, 50vw', ratio, priority = false, className = '', interactiveKeyVisual = false, idScope }: ProjectMediaProps) {
  const canonicalPath = getProjectCoverPath(project);
  const path = project.cover.src && getAsset(project.cover.src)
    ? project.cover.src
    : getAsset(canonicalPath) ? canonicalPath : null;

  const media = path
    ? <Media path={path} alt={project.cover.alt || project.title} width={project.cover.width}
      height={project.cover.height} sizes={sizes} priority={priority}
      focal={project.cover.focal} />
    : project.keyVisual
      ? <KeyVisual kind={project.keyVisual} projectTitle={project.title} interactive={interactiveKeyVisual} idScope={idScope} />
      // Keep the editorial placeholder when neither asset nor schema exists.
      : <Media path={canonicalPath} alt={project.cover.alt} width={project.cover.width}
        height={project.cover.height} sizes={sizes} />;
  return <div className={`project-media ${className}`}
    style={{ aspectRatio: ratio ?? `${project.cover.width} / ${project.cover.height}` }}>{media}</div>;
}
