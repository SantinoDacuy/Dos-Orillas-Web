import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['manifesto.css', 'solutions.css', 'process.css'];
const pieces = await Promise.all(names.map(name => readFile(path.join(root, 'styles', name), 'utf8')));
// The global reduced policy shortens durations, but its .01ms duration also
// starts implicit `all` transitions when this deferred sheet arrives. Static
// narrative reading must receive final typography/geometry in the load frame.
const reducedNarrative = `
html[data-motion-tier="0"] :is(.manifesto-section,.solutions-section,.process-scene),
html[data-motion-tier="0"] :is(.manifesto-section,.solutions-section,.process-scene) * { transition-property:none!important; }
@media (prefers-reduced-motion:reduce) {
  :is(.manifesto-section,.solutions-section,.process-scene),
  :is(.manifesto-section,.solutions-section,.process-scene) * { transition-property:none!important; }
}
`;
const css = pieces.join('\n') + reducedNarrative;
const digest = createHash('sha256').update(css).digest('hex').slice(0, 12);
const href = `/styles/narrative.css?v=${digest}`;
await mkdir(path.join(root, 'public', 'styles'), { recursive: true });
await writeFile(path.join(root, 'public', 'styles', 'narrative.css'), css, 'utf8');
await writeFile(path.join(root, 'lib', 'narrative-css.generated.ts'), `// Generated from styles/{manifesto,solutions,process}.css with the shared reduced policy. Do not edit.\nexport const narrativeStylesHref = ${JSON.stringify(href)};\n`, 'utf8');
