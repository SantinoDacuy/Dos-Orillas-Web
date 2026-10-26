import { Suspense } from 'react';
import { Hero } from '@/components/sections/Hero';
import { Distance } from '@/components/sections/Distance';
import { Solutions } from '@/components/sections/Solutions';
import { Process } from '@/components/sections/Process';
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
    <Hero />
    <Distance />
    <Solutions />
    <Process />
    <ProjectsCinematicSection />
    <Studio />
    <Team />
    <Stack />
    <Contact />
    <Suspense fallback={null}><EditorialMotion /></Suspense>
  </>;
}
