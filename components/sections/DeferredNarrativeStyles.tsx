import { narrativeStylesHref } from '@/lib/narrative-css.generated';
import { narrativeStylesBootstrap } from '@/lib/narrative-styles-bootstrap';
import { NarrativeStyleActivation } from './NarrativeStyleActivation';

/** Ordinary link: omit React precedence so the adjacent bootstrap owns media. */
export function DeferredNarrativeStyles() {
  return <>
    <link id="dos-orillas-narrative-css" data-narrative-css-sheet rel="stylesheet" href={narrativeStylesHref} media="not all" suppressHydrationWarning />
    <noscript><link rel="stylesheet" href={narrativeStylesHref} media="all" /></noscript>
    <script dangerouslySetInnerHTML={{ __html: narrativeStylesBootstrap }} />
    <NarrativeStyleActivation />
  </>;
}
