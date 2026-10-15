import type { CSSProperties } from 'react';
import type { Project } from '@/data/projects';
import { projectsCopy, siteConfig } from '@/content/site';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectCoverTransition } from '@/components/motion/ProjectTransitions';

type NextStyle = CSSProperties & Record<`--next-${string}`, string | number>;

export function NextProject({ project }: { project: Project }) {
  const titleId = `case-next-${project.slug}-title`;
  const style: NextStyle = { '--next-bg': project.tone.bg, '--next-fg': project.tone.fg };
  return <section className="case-next-project" data-theme="navy" aria-labelledby={titleId} style={style}>
    <h2 id={titleId} className="mono">{projectsCopy.next}</h2>
    <a className="case-next-link" href={`/projects/${project.slug}`} data-cursor="ver" data-project-next={project.slug}
      data-project-transition-link={project.slug} data-project-transition-source={`next:${project.slug}`}>
      <ProjectCoverTransition className="case-next-media-frame" slug={project.slug} role="source"
        sourceId={`next:${project.slug}`} data-project-next-reveal>
        <div className="case-next-media-parallax">
          <ProjectMedia project={project} sizes="(max-width: 767px) 100vw, 80vw" ratio="16 / 10"
            className="case-next-media" interactiveKeyVisual={false} idScope={`case-next-${project.slug}-cover`} />
        </div>
      </ProjectCoverTransition>
      <div className="case-next-caption">
        <span className="case-next-title">{project.title}</span><span className="case-next-arrow" aria-hidden="true">↗</span>
      </div>
      <span className="case-next-context mono">{siteConfig.projectContextLabels[project.context]}</span>
    </a>
  </section>;
}
