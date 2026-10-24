import { Suspense } from 'react';
import { DeferredNarrativeStyles } from '@/components/sections/DeferredNarrativeStyles';
import { Hero } from '@/components/sections/Hero';
import { Distance } from '@/components/sections/Distance';
import { Solutions } from '@/components/sections/Solutions';
import { Process } from '@/components/sections/Process';
import { DeferredNarrativeMotion } from '@/components/sections/DeferredNarrativeMotion';
import { ProjectsCinematicSection } from '@/components/sections/ProjectsCinematicSection';
import { Studio } from '@/components/sections/Studio';
import { Team } from '@/components/sections/Team';
import { Stack } from '@/components/sections/Stack';
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
    <Solutions />
    <Process />
    <Suspense fallback={null}><DeferredNarrativeMotion /></Suspense>
    <ProjectsCinematicSection />
    <Studio />
    <Team />
    <Stack />
    <Contact />
    <Suspense fallback={null}><EditorialMotion /></Suspense>
  </>;
}
