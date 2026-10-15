import type { CSSProperties } from 'react';
import type { Project } from '@/data/projects';
import { projectsCopy, siteConfig } from '@/content/site';
import { projectCaseCopy } from '@/content/project-case';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectCoverTransition } from '@/components/motion/ProjectTransitions';
import { getProjectChapters, getProjectCoverAsset } from './project-content';

type ProjectHeroStyle = CSSProperties & Record<`--case-${string}`, string | number>;

export function ProjectHero({ project }: { project: Project }) {
  const titleId = `case-${project.slug}-title`;
  const realCover = Boolean(getProjectCoverAsset(project));
  const hasBody = getProjectChapters(project).length > 0 || Boolean(project.liveUrl || project.githubUrl);
  const lines = project.titleLines.length ? project.titleLines : [project.title];
  const longest = Math.max(...lines.map(line => line.length), 1);
  const style: ProjectHeroStyle = {
    '--case-bg': project.tone.bg, '--case-fg': project.tone.fg,
    '--case-title-vw': `${Math.min(13, 130 / longest)}vw`,
  };
  return <section className="case-hero" data-theme="navy" data-project-hero={project.slug}
    data-project-real-cover={String(realCover)} aria-labelledby={titleId} style={style}>
    {/* The persistent ProjectTransitions provider owns routing and cover restoration. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <div className="case-hero-top"><a className="case-back-link mono" href="/projects" data-project-back={project.slug}>{projectsCopy.back}</a></div>
    <div className="case-hero-heading">
      <h1 id={titleId} className="case-title" aria-label={project.title} data-project-text>
        {lines.map((line, index) => <span className="case-title-mask" key={`${index}-${line}`} aria-hidden="true">
          <span className="case-title-line">{line}</span>
        </span>)}
      </h1>
      <dl className="case-metadata mono">
        <div><dt className="sr-only">{projectCaseCopy.category}</dt><dd>{project.categoryLabel}</dd></div>
        {project.year !== null && <div><dt className="sr-only">{projectCaseCopy.year}</dt><dd>{project.year}</dd></div>}
        <div><dt className="sr-only">{projectCaseCopy.context}</dt><dd>{siteConfig.projectContextLabels[project.context]}</dd></div>
      </dl>
      {project.description && <p className="case-summary">{project.description}</p>}
    </div>
    <ProjectCoverTransition className="case-cover" slug={project.slug} role="destination">
      <div className="case-cover-parallax" data-project-parallax>
        <ProjectMedia project={project} sizes="100vw" priority={realCover}
          ratio="16 / 10" className="case-cover-media" interactiveKeyVisual={!realCover} idScope={`case-${project.slug}-cover`} />
      </div>
    </ProjectCoverTransition>
    {hasBody && <a className="case-scroll-link mono" href="#project-body">{projectCaseCopy.explore}<span aria-hidden="true">↓</span></a>}
  </section>;
}
