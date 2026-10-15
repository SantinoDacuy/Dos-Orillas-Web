import { Suspense } from 'react';
import { DeferredNarrativeStyles } from '@/components/sections/DeferredNarrativeStyles';
import { Hero } from '@/components/sections/Hero';
import { Distance } from '@/components/sections/Distance';
import { Manifesto } from '@/components/sections/Manifesto';
import { Solutions } from '@/components/sections/Solutions';
import { Process } from '@/components/sections/Process';
import { DeferredNarrativeMotion } from '@/components/sections/DeferredNarrativeMotion';
import { FeaturedProjects } from '@/components/sections/FeaturedProjects';
import { ProjectsGrid } from '@/components/sections/ProjectsGrid';
import { BrandSeparator } from '@/components/sections/BrandSeparator';
import { DeferredProjectsMotion } from '@/components/sections/DeferredProjectsMotion';
import { Studio } from '@/components/sections/Studio';
import { Team } from '@/components/sections/Team';
import { Stack } from '@/components/sections/Stack';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { Contact } from '@/components/sections/Contact';
import { EditorialMotion } from '@/components/sections/EditorialMotion';
import { StructuredData } from '@/components/seo/StructuredData';
import { organizationJSONLD } from '@/lib/structured-data';
export default function Home() {
  return <>
    <StructuredData data={organizationJSONLD()} />
    <DeferredNarrativeStyles />
    <Hero />
    <Distance />
    <Manifesto />
    <Solutions />
    <Process />
    <Suspense fallback={null}><DeferredNarrativeMotion /></Suspense>
    <FeaturedProjects />
    <ProjectsGrid />
    <Suspense fallback={null}><DeferredProjectsMotion /></Suspense>
    <BrandSeparator id="projects-separator" />
    <Studio />
    <Team />
    <Stack />
    <FinalCTA />
    <Contact />
    <Suspense fallback={null}><EditorialMotion /></Suspense>
  </>;
}
