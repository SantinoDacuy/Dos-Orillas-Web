import { Suspense } from 'react';
import { brandCopy } from '@/content/site';
import { projectGridCopy } from '@/content/project-grid';
import { BrandSeparatorMotion } from './BrandSeparatorMotion';

export function BrandSeparator({ id = 'projects-brand-separator' }: { id?: string }) {
  return <div id={id} className="brand-separator" data-brand-separator data-theme="cream">
    <p className="sr-only">{brandCopy.wordmark}</p>
    <div className="brand-separator-window" aria-hidden="true">
      <div className="brand-separator-static">{brandCopy.wordmark}</div>
      <div className="brand-separator-motion-plane"><div className="brand-separator-track">
        {[0, 1].map(copy => <div className="brand-separator-group" key={copy}>
          <span>{brandCopy.marquee}</span><span>{brandCopy.marquee}</span>
        </div>)}
      </div></div>
    </div>
    <div className="brand-separator-controls"><button type="button" className="brand-separator-pause mono" hidden>{projectGridCopy.separatorPause}</button></div>
    <Suspense fallback={null}><BrandSeparatorMotion sectionId={id} /></Suspense>
  </div>;
}
