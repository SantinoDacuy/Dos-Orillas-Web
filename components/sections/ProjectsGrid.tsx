import type { CSSProperties } from 'react';
import { projects as projectData, type Project } from '@/data/projects';
import { heroCopy, projectsCopy } from '@/content/site';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getProjectGridLayout, HOME_GRID_LIMIT, projectGridSizes, type ProjectGridLayout } from '@/lib/project-grid';
import { estimateProjectGridIntrinsicHeight } from '@/lib/project-grid-intrinsic';

type GridStyle = CSSProperties & { '--project-offset-level': number };
function slotStyle(layout: ProjectGridLayout): GridStyle {
  return { gridColumn: `${layout.columnStart} / span ${layout.columnSpan}`, gridRow: layout.row, '--project-offset-level': layout.offsetLevel };
}

export function ProjectsGrid({ projects = projectData, limit = HOME_GRID_LIMIT }: { projects?: readonly Project[]; limit?: number }) {
  const ordered = [...projects].sort((a, b) => a.order - b.order);
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : HOME_GRID_LIMIT;
  const visible = ordered.slice(0, safeLimit);
  const invitation = getProjectGridLayout(visible.length);
  const rootStyle = {
    '--project-grid-intrinsic-height': estimateProjectGridIntrinsicHeight(visible, ordered.length > visible.length),
  } as CSSProperties & Record<'--project-grid-intrinsic-height', string>;
  return <section id="todos-los-proyectos" className="project-grid-scene" data-scene="project-grid" data-theme="cream"
    data-grid-motion-policy="native-tier1" data-grid-intrinsic="true" style={rootStyle}
    aria-labelledby="project-grid-title">
    <header className="project-grid-header">
      <h2 id="project-grid-title" className="project-grid-title"><span className="project-grid-title-mask"><span className="project-grid-title-inner">{projectsCopy.all}</span></span></h2>
    </header>
    <ul className="project-grid-list" role="list">
      {visible.map((project, index) => {
        const layout = getProjectGridLayout(index);
        return <li key={project.slug} className="project-grid-entry project-grid-item" data-grid-index={index} data-grid-side={layout.side} style={slotStyle(layout)}>
          <ProjectCard project={project} ratio={layout.ratio} sizes={projectGridSizes(layout.columnSpan)} idPrefix="grid" speed={layout.speed} />
        </li>;
      })}
      <li className="project-grid-entry project-grid-invitation" data-grid-side={invitation.side} style={slotStyle(invitation)}>
        <a className="project-grid-invitation-link" href={heroCopy.primaryCta.href}>
          <span className="project-grid-invitation-line" aria-hidden="true" />
          <span className="project-grid-invitation-copy">{projectsCopy.invitation}</span>
        </a>
      </li>
    </ul>
    {ordered.length > visible.length && <div className="project-grid-more">{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- The transition provider owns this navigation and native fallback. */}
      <a className="project-grid-more-link mono" href="/projects">{projectsCopy.viewAll}</a></div>}
  </section>;
}
