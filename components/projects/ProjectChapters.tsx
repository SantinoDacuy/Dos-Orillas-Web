import type { Project } from '@/data/projects';
import { projectsCopy } from '@/content/site';
import { projectCaseCopy } from '@/content/project-case';
import { KeyVisual } from '@/components/projects/KeyVisual';
import { ProjectGallery } from './ProjectGallery';
import { getProjectChapters, getProjectCoverAsset, getProjectGallery, projectParagraphs, type ProjectChapterId } from './project-content';

function chapterText(project: Project, id: ProjectChapterId) {
  if (id === 'overview') return project.intro;
  if (id === 'challenge') return project.challenge;
  if (id === 'approach') return project.approach;
  if (id === 'solution') return project.solution;
  if (id === 'result') return project.result;
  return null;
}

export function ProjectChapters({ project }: { project: Project }) {
  const chapters = getProjectChapters(project);
  const realCover = Boolean(getProjectCoverAsset(project));
  const links = [
    { href: project.liveUrl, label: projectsCopy.live },
    { href: project.githubUrl, label: projectsCopy.code },
  ].filter((link): link is { href: string; label: typeof projectsCopy.live | typeof projectsCopy.code } => Boolean(link.href));
  if (!chapters.length && !links.length) return null;

  return <section id="project-body" className="case-body" data-theme="cream" aria-label={projectCaseCopy.bodyLabel}>
    {chapters.length > 0 && <nav className="case-chapter-index mono" aria-label={projectCaseCopy.chaptersLabel} data-project-chapter-index>
      <ol>{chapters.map(chapter => <li key={chapter.id}>
        <a href={`#project-${chapter.id}`} data-project-chapter-link={chapter.id}>
          <span aria-hidden="true">{chapter.number}</span><span>{chapter.title}</span>
        </a>
      </li>)}</ol>
    </nav>}
    <div className="case-chapters">
      {chapters.map(chapter => <section key={chapter.id} id={`project-${chapter.id}`} className={`case-chapter case-chapter-${chapter.id}`}
        data-theme="cream" data-project-chapter={chapter.id} aria-labelledby={`case-${project.slug}-${chapter.id}-title`}>
        <header className="case-chapter-label mono"><span aria-hidden="true">{chapter.number} —</span>
          <h2 id={`case-${project.slug}-${chapter.id}-title`}>{chapter.title}</h2>
        </header>
        <div className="case-chapter-content">
          {chapter.id === 'technologies' ? <ul className="case-technology-list mono">
            {project.technologies.map((technology, index) => <li key={`${index}-${technology}`}>{technology}</li>)}
          </ul> : chapter.id === 'gallery' ? <ProjectGallery media={getProjectGallery(project)} />
            : <div className={chapter.id === 'overview' ? 'case-overview' : 'case-prose'} data-project-text>
              {projectParagraphs(chapterText(project, chapter.id)).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>}
          {chapter.id === 'solution' && realCover && project.keyVisual && <div className="case-solution-visual" data-project-image-reveal>
            <KeyVisual kind={project.keyVisual} projectTitle={project.title} interactive idScope={`case-${project.slug}-solution`} />
          </div>}
        </div>
      </section>)}
      {links.length > 0 && <div className="case-resource-links">
        {links.map(link => <a className="case-resource-link mono" key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<span className="sr-only">: {project.title}</span></a>)}
      </div>}
    </div>
  </section>;
}
