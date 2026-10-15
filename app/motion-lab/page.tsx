import type { Metadata } from 'next';
import { RevealText, ImageReveal, ParallaxImage, Bridge } from '@/components/motion/primitives';
import { Media } from '@/components/ui/Media';
import { motionLabCopy } from '@/content/motion-lab';
export const metadata: Metadata = { title: 'Motion lab — Dos Orillas', robots: { index: false, follow: false } };
export default function MotionLab() {
  return <div className="motion-lab"><section data-theme="cream"><h1>{motionLabCopy.title}</h1><p>{motionLabCopy.intro}</p></section>
    <section data-theme="white"><span className="mono">{motionLabCopy.reveal}</span><RevealText as="h2" lines={motionLabCopy.revealLines}>{motionLabCopy.revealLines.join(' ')}</RevealText></section>
    <section data-theme="cream"><span className="mono">{motionLabCopy.image}</span><ImageReveal className="lab-image"><Media path="/projects/_hero/orilla-1.webp" alt="" width={2400} height={3000} sizes="30vw" /></ImageReveal></section>
    <section data-theme="navy"><h2>{motionLabCopy.connection}</h2><Bridge /><p>{motionLabCopy.caption}</p></section>
    <section data-theme="cream"><h2>{motionLabCopy.parallax}</h2><ParallaxImage className="lab-image"><Media path="/projects/_hero/orilla-2.webp" alt="" width={2400} height={3000} sizes="30vw" /></ParallaxImage></section>
  </div>;
}
