import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, type CSSProperties } from 'react';
import { projects } from '@/data/projects';
import { projectsCopy } from '@/content/site';
import { buildProjectsMetadata } from '@/lib/seo';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { DeferredProjectsMotion } from '@/components/sections/DeferredProjectsMotion';
import { getProjectGridLayout, projectGridSizes } from '@/lib/project-grid';
import '@/styles/projects-index.css';

export const metadata: Metadata = buildProjectsMetadata();
type GridStyle = CSSProperties & { '--project-offset-level': number };

/** A complete native index; optional category filters remain an F10 extra. */
export default function ProjectsIndex() {
  const ordered = [...projects].sort((a,b) => a.order - b.order);
  return <section id="projects-index" className="project-grid-scene projects-index-page"
    data-scene="project-grid" data-theme="cream" aria-labelledby="projects-index-title">
    <header className="project-grid-header">
      <h1 id="projects-index-title" className="project-grid-title"><span className="project-grid-title-mask">
        <span className="project-grid-title-inner">{projectsCopy.all}</span>
      </span></h1>
    </header>
    <ul className="project-grid-list" role="list">
      {ordered.map((project,index) => {
        const layout = getProjectGridLayout(index);
        const style: GridStyle = { gridColumn:`${layout.columnStart} / span ${layout.columnSpan}`,
          gridRow:layout.row, '--project-offset-level':layout.offsetLevel };
        return <li key={project.slug} className="project-grid-entry project-grid-item"
          data-grid-index={index} data-grid-side={layout.side} style={style}>
          <ProjectCard project={project} ratio={layout.ratio} sizes={projectGridSizes(layout.columnSpan)}
            idPrefix="projects-index-grid" speed={layout.speed} />
        </li>;
      })}
    </ul>
    <Link className="projects-index-contact" href="/#contacto" prefetch={false}>{projectsCopy.invitation}</Link>
    <Suspense fallback={null}><DeferredProjectsMotion gridRootId="projects-index" /></Suspense>
  </section>;
}
