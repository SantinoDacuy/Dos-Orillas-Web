import type { Project } from '@/data/projects';
import { projectsCopy } from '@/content/site';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectCoverTransition } from '@/components/motion/ProjectTransitions';

export interface ProjectCardProps {
  project: Project;
  ratio?: string;
  sizes?: string;
  idPrefix?: string;
  speed?: number | null;
}

export function ProjectCard({ project, ratio = '4 / 5', sizes = '88vw', idPrefix = 'project-card', speed = null }: ProjectCardProps) {
  const titleId = `${idPrefix}-${project.slug}-title`;
  const metaId = `${idPrefix}-${project.slug}-meta`;
  const metadata = [project.categoryLabel, project.year].filter(value => value !== null && value !== '').join(' · ');
  return <article className="project-grid-card project-card" data-project-slug={project.slug} data-speed={speed ?? undefined}>
    <div className="project-card-drift" data-project-parallax={speed === null ? undefined : ''}>
      <a className="project-card-link" href={`/projects/${project.slug}`} aria-labelledby={titleId} aria-describedby={metadata ? metaId : undefined} data-cursor="ver"
        data-project-transition-link={project.slug} data-project-transition-source={`grid:${project.slug}`}>
        <ProjectCoverTransition className="project-card-frame" style={{ aspectRatio: ratio }} data-project-reveal
          slug={project.slug} role="source" sourceId={`grid:${project.slug}`}>
          <div className="project-card-reveal-inner"><div className="project-card-zoom">
            <ProjectMedia project={project} className="project-card-media" sizes={sizes} ratio={ratio} idScope={`${idPrefix}-${project.slug}-cover`} />
          </div></div>
        </ProjectCoverTransition>
        <div className="project-card-info">
          <h3 id={titleId} className="project-card-title">
            {project.titleLines.length ? project.titleLines.map((line, index) => <span key={`${index}-${line}`}>{line}{index < project.titleLines.length - 1 ? ' ' : ''}</span>) : project.title}
          </h3>
          {metadata && <p id={metaId} className="project-card-meta mono">{metadata}</p>}
          <span className="project-card-cta mono"><span className="project-card-cta-mask">
            <span className="project-card-cta-original">{projectsCopy.view}</span>
            <span className="project-card-cta-repeat" aria-hidden="true">{projectsCopy.view}</span>
          </span></span>
        </div>
      </a>
    </div>
  </article>;
}
