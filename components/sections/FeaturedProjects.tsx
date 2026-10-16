/* eslint-disable @next/next/no-html-link-for-pages -- ProjectTransitionsProvider owns internal routing; anchors preserve the no-JS fallback. */
import type { CSSProperties } from 'react';
import { projects, type Project } from '@/data/projects';
import { projectsCopy, siteConfig } from '@/content/site';
import { featuredProjectsCopy } from '@/content/featured-projects';
import { ProjectMedia } from '@/components/projects/ProjectMedia';
import { ProjectCoverTransition } from '@/components/motion/ProjectTransitions';

interface FeaturedProjectsProps { items?: readonly Project[]; }
type FeaturedStyle = CSSProperties & Record<`--featured-${string}`, string | number>;

/** Complete server list first; the optional carousel never owns project content. */
export function FeaturedProjects({ items = projects }: FeaturedProjectsProps) {
  const selected = items.filter(project => project.featured).sort((a, b) => a.order - b.order);
  if (!selected.length) return null;
  const total = String(selected.length).padStart(2, '0');
  const [headingLead, ...headingRest] = projectsCopy.selected.split(' ');
  const sceneStyle: FeaturedStyle = {
    '--featured-count': selected.length,
    // An estimate of the unenhanced list, not a certified measurement.
    '--featured-flow-intrinsic-height': `calc(${selected.length} * (min(44rem, 100vw - 2 * var(--gutter)) * .625 + 16rem) + 18rem)`,
  };
  return <section id="proyectos" className="featured-scene" data-theme="navy-deep" data-scene="featured"
    data-featured-mode="flow" data-featured-index="0" data-featured-design="arc"
    data-featured-cv-policy="flow-tier1" data-featured-intrinsic="true"
    aria-label={projectsCopy.selected} style={sceneStyle}>
    <span className="featured-entry-bridge" data-bridge-chain="featured-entry" aria-hidden="true" />
    <header className="featured-meta">
      <h2 id="featured-title" className="featured-section-title" aria-label={projectsCopy.selected}>
        <span aria-hidden="true">{headingLead}</span>{' '}<span className="featured-section-title-editorial" aria-hidden="true">{headingRest.join(' ')}</span>
      </h2>
      <p className="featured-meta-note mono">{featuredProjectsCopy.scroll}<span aria-hidden="true">↘</span></p>
    </header>
    <div className="featured-stage">
      <ol className="featured-list" role="list" aria-label={featuredProjectsCopy.collectionLabel} tabIndex={-1}>
        {selected.map((project, index) => {
          const lines = project.titleLines.length ? project.titleLines : [project.title];
          const href = `/projects/${project.slug}`;
          const slideStyle: FeaturedStyle = {
            '--featured-slide-bg': project.tone.bg,
            '--featured-slide-fg': project.tone.fg,
          };
          return <li id={`featured-${project.slug}`} key={project.slug} className="featured-slide"
            data-featured-slide={index} data-project-slug={project.slug}
            data-project-title={project.title} data-project-bg={project.tone.bg} data-project-fg={project.tone.fg}
            aria-label={project.title} style={slideStyle}>
            <article className="featured-card-scale">
              <a className="featured-image-link" href={href} data-cursor="ver"
                aria-label={featuredProjectsCopy.coverLabel(project.title)} data-project-transition-link={project.slug}
                data-project-transition-source={`featured:${project.slug}`}>
                <ProjectCoverTransition className="featured-image-velocity" slug={project.slug} role="source" sourceId={`featured:${project.slug}`}>
                  <div className="featured-image-dolly"><div className="featured-image-reveal"><div className="featured-image-parallax">
                    <ProjectMedia project={project} className="featured-media" ratio="16 / 10" interactiveKeyVisual={false}
                      sizes="(min-width: 1024px) 704px, calc(100vw - 40px)" idScope={`featured-${project.slug}-cover`} />
                  </div></div></div>
                </ProjectCoverTransition>
              </a>
              <div className="featured-copy">
                <div className="featured-card-eyebrow mono">
                  <span className="featured-inline-counter" aria-hidden="true">{projectsCopy.counter(index + 1, selected.length)}</span>
                  <p className="featured-category">{project.categoryLabel}</p>
                </div>
                <h3 id={`featured-${project.slug}-title`} className="featured-project-title" aria-label={project.title}>
                  {lines.map((line, lineIndex) => <span className="featured-title-line" key={`${lineIndex}-${line}`} aria-hidden="true">{line}{lineIndex < lines.length - 1 ? ' ' : ''}</span>)}
                </h3>
                <div className="featured-card-bottom">
                  <p className="featured-context mono">{siteConfig.projectContextLabels[project.context]}</p>
                  <a className="featured-project-link mono" href={href} data-project-transition-link={project.slug}
                    data-project-transition-source={`featured:${project.slug}`}>{projectsCopy.view}<span className="sr-only">: {project.title}</span></a>
                </div>
              </div>
              <span className="featured-glass-edge" aria-hidden="true" />
            </article>
          </li>;
        })}
      </ol>
    </div>
    <div className="featured-controls" hidden>
      <button type="button" suppressHydrationWarning className="featured-step-button mono" data-featured-direction="-1" disabled tabIndex={-1}
        aria-label={featuredProjectsCopy.previous}><span aria-hidden="true">←</span></button>
      <div className="featured-counter mono" aria-hidden="true">
        <span className="featured-counter-window"><span className="featured-counter-roll">
          {selected.map((project, index) => <span key={project.slug}>{String(index + 1).padStart(2, '0')}</span>)}
        </span></span><span className="featured-counter-total">/ {total}</span>
      </div>
      <div className="featured-dots">
        {selected.map((project, index) => <button type="button" suppressHydrationWarning key={project.slug} className="featured-dot"
          data-featured-select={index} aria-label={featuredProjectsCopy.selectLabel(project.title)} disabled tabIndex={-1}><span aria-hidden="true" /></button>)}
      </div>
      <button type="button" suppressHydrationWarning className="featured-step-button mono" data-featured-direction="1" disabled tabIndex={-1}
        aria-label={featuredProjectsCopy.next}><span aria-hidden="true">→</span></button>
    </div>
    <p className="featured-interaction-hint mono" hidden>{featuredProjectsCopy.interactionHint}</p>
    <p className="sr-only" data-featured-live aria-live="polite" aria-atomic="true" />
    <div className="featured-outro"><a className="featured-all-link mono" href="/projects">{projectsCopy.viewAll}</a></div>
  </section>;
}
