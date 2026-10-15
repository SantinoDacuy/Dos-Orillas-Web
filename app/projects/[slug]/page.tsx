import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { projects, getProjectBySlug, getNextProject } from '@/data/projects';
import { buildProjectMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import { projectBreadcrumbJSONLD } from '@/lib/structured-data';
import { ProjectHero } from '@/components/projects/ProjectHero';
import { ProjectChapters } from '@/components/projects/ProjectChapters';
import { NextProject } from '@/components/projects/NextProject';
import { ProjectMotion } from '@/components/projects/ProjectMotion';
import { DeferredProjectsMotion } from '@/components/sections/DeferredProjectsMotion';
import '@/styles/project-cases.css';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  return buildProjectMetadata(project);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const next = getNextProject(slug);
  return <article className="project-case" data-project-case={project.slug} data-page-pathname={`/projects/${project.slug}`}>
    <StructuredData data={projectBreadcrumbJSONLD(project)} />
    <ProjectHero project={project} />
    <ProjectChapters project={project} />
    {next && next.slug !== project.slug && <NextProject project={next} />}
    <Suspense fallback={null}><ProjectMotion slug={project.slug} /></Suspense>
    <Suspense fallback={null}><DeferredProjectsMotion featured={false} grid={false} /></Suspense>
  </article>;
}
