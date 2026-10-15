import { readFile, appendFile } from 'node:fs/promises';
const phase = process.argv[2] ?? 'F3';
const qa = JSON.parse(await readFile(`qa-results/${phase}/qa-summary.json`, 'utf8'));
const lh = JSON.parse(await readFile(`qa-results/${phase}/lighthouse-summary.json`, 'utf8'));
if (!qa.passed || !lh.passed) throw new Error(`No se puede cerrar ${phase}: QA o presupuestos Lighthouse pendientes.`);
if (phase === 'F4') {
  for (const file of ['narrative/summary.json', 'layout/summary.json', 'readiness/summary.json', 'extra-shell/summary.json', 'styles/summary.json', 'film/summary.json']) {
    const result = JSON.parse(await readFile(`qa-results/${phase}/${file}`, 'utf8'));
    if (!result.passed) throw new Error(`No se puede cerrar ${phase}: ${file} pendiente.`);
  }
}
let text = `\n## ${phase} — verificación real\n\nLint, typecheck y build: aprobados. Playwright: ${qa.passed ? 'aprobado' : 'falló'} (${qa.checks.filter(c=>c.status==='pass').length} checks aprobados; ${qa.screenshots.length} capturas). Axe: sin violaciones serias/críticas en las vistas verificadas si los checks axe pasan.\n\n| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |\n|---|---|---|---|---|---|---|---|\n`;
for (const run of lh.runs) {
  const m = run.metrics;
  if (!m) continue;
  text += `| ${run.mode} | ${m.performance} | ${m.accessibility} | ${m.bestPractices} | ${m.seo} | ${(m.lcpMs/1000).toFixed(2)} s | ${m.cls.toFixed(4)} | ${Math.round(m.tbtMs)} ms |\n`;
}
text += `\nInformes: qa-results/${phase}/. Build de producción y Lighthouse mobile simulado, con los umbrales originales. Runtime: ${lh.runs[0]?.browserUserAgent ?? 'Chrome instalado'}. SEO excluye únicamente is-crawlable: este checkpoint lleva noindex deliberado según el contrato de previews. No implica indexación apta para lanzamiento. INP y dispositivos físicos/lector NVDA requieren verificación posterior; no se afirman mediciones de campo.\n`;
await appendFile('docs/DECISIONS.md', text);
