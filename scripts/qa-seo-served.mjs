import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// HTTP-only QA of an already running local build. No browser, server, build,
// mail submission, external fetch, or modification of application data.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-seo-served.mjs [--url http://127.0.0.1:3000] [--out qa-results/F8/seo-served] [--final]');
  console.log('Preview/unconfigured SEO only. --final also requires the temporary sixth project to be absent. Local HTTP GETs only.');
  process.exit(0);
}
const baseURL = new URL(option('--url', 'http://127.0.0.1:3000'));
assert.ok(baseURL.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(baseURL.hostname), 'QA URL must be local HTTP.');
const output = path.resolve(repository, option('--out', 'qa-results/F8/seo-served'));
assert.ok(!path.relative(repository, output).startsWith('..'), 'QA output must stay within this repository.');
await mkdir(output, { recursive: true });
const requireProject = createRequire(path.join(repository, 'package.json'));
const ts = requireProject('typescript');
async function pureSource(relative) {
  const source = await readFile(path.join(repository, relative), 'utf8');
  const compiled = ts.transpileModule(source, { fileName: relative, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  const transpiledModule = { exports: {} };
  vm.runInNewContext(compiled.outputText, { module: transpiledModule, exports: transpiledModule.exports, require() { throw new Error('Canonical QA data must not load runtime dependencies.'); } }, { filename: relative });
  return transpiledModule.exports;
}
const { siteConfig, projectsCopy } = await pureSource('content/site.ts');
const { projects } = await pureSource('data/projects.ts');
const fixtureSlug = 'qa-prueba-de-estructura';
const report = {
  createdAt: new Date().toISOString(), baseURL: baseURL.href, scope: 'Local HTTP preview SEO, real route metadata and PNG rendering',
  projectCount: projects.length, fixturePresent: projects.some(project => project.slug === fixtureSlug),
  productionIndexingTested: false, browserTests: 0, externalRequests: 0,
  checks: [], routes: [], images: [], errors: [], passed: false,
  limitations: 'No production-domain build, external crawler/social preview, pixel contrast automation, browser accessibility or field performance claims. Review saved images visually. A fixture build is never a final delivery.',
};
function check(name, pass, detail) {
  report.checks.push({ name, status: pass ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${pass || detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
}
function decoded(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
    if (entity.toLowerCase().startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[entity.toLowerCase()] ?? _;
  });
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), decoded(match[2])]));
}
function metadata(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]));
  const named = name => metas.filter(meta => meta.name === name || meta.property === name).map(meta => meta.content);
  return { title: decoded(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ''), named, links, head };
}
function jsonLD(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(match => JSON.parse(match[1]));
}
async function localGet(route) {
  assert.ok(route.startsWith('/') && !route.startsWith('//'), 'Only local absolute route paths may be requested.');
  const response = await fetch(new URL(route, baseURL), { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Twitterbot' } });
  const bytes = Buffer.from(await response.arrayBuffer());
  const entry = { route, status: response.status, headers: Object.fromEntries(response.headers), bytes: bytes.length };
  report.routes.push(entry);
  return { response, bytes, entry };
}
function headers(route, response) {
  check(`${route}: preview X-Robots-Tag`, response.headers.get('x-robots-tag') === 'noindex, nofollow', response.headers.get('x-robots-tag'));
  check(`${route}: security headers`, response.headers.get('x-content-type-options') === 'nosniff'
    && response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin'
    && response.headers.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()', Object.fromEntries(response.headers));
  check(`${route}: no powered-by header`, !response.headers.has('x-powered-by'));
}
async function page(route, expectedTitle, expectedDescription, status = 200) {
  const result = await localGet(route);
  check(`${route}: HTTP ${status}`, result.response.status === status, result.response.status);
  headers(route, result.response);
  const html = result.bytes.toString('utf8');
  const meta = metadata(html);
  check(`${route}: noindex HTML`, meta.named('robots').some(value => value?.includes('noindex') && value?.includes('nofollow')), meta.named('robots'));
  check(`${route}: no unconfirmed canonical`, meta.links.every(link => link.rel !== 'canonical'));
  check(`${route}: one semantic h1`, [...html.matchAll(/<h1\b/gi)].length === 1, [...html.matchAll(/<h1\b/gi)].length);
  if (status === 200) {
    check(`${route}: title from canonical data`, meta.title === expectedTitle, meta.title);
    check(`${route}: description from canonical data`, meta.named('description')[0] === expectedDescription, meta.named('description'));
    check(`${route}: OG identity and locale`, meta.named('og:title')[0] === expectedTitle && meta.named('og:description')[0] === expectedDescription
      && meta.named('og:site_name')[0] === siteConfig.name && meta.named('og:locale')[0] === 'es_AR');
    check(`${route}: large-image Twitter card`, meta.named('twitter:card')[0] === 'summary_large_image');
    check(`${route}: image metadata 1200×630`, meta.named('og:image:width')[0] === '1200' && meta.named('og:image:height')[0] === '630');
    check(`${route}: no unconfirmed OG page URL`, meta.named('og:url').length === 0);
    check(`${route}: manifest and official icon`, meta.links.some(link => link.rel === 'manifest' && link.href === '/manifest.webmanifest')
      && meta.links.some(link => link.rel === 'icon' && link.href === '/brand/mark.svg'));
    const image = meta.named('og:image')[0];
    check(`${route}: file-based image is local until domain approval`, Boolean(image) && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(image, baseURL).hostname), image);
    result.entry.fileImageURL = image;
  }
  const documents = jsonLD(html);
  if (route === '/') {
    check('Home: one Organization / ProfessionalService', documents.length === 1 && JSON.stringify(documents[0]?.['@type']) === '["Organization","ProfessionalService"]');
    const organization = documents[0] ?? {};
    check('Home: confirmed contact and locality', organization.name === siteConfig.name && organization.email === siteConfig.email
      && organization.address?.addressLocality === siteConfig.location.city && organization.address?.addressRegion === siteConfig.location.region
      && organization.address?.addressCountry === siteConfig.location.countryCode && organization.sameAs?.[0] === siteConfig.instagram.url);
    check('Home: no invented URL, claims or private address', ['url', 'logo', '@id', 'aggregateRating', 'review', 'telephone', 'openingHours', 'areaServed', 'geo', 'priceRange'].every(field => !(field in organization))
      && !('streetAddress' in (organization.address ?? {})));
  } else {
    check(`${route}: no originless BreadcrumbList`, documents.every(document => document['@type'] !== 'BreadcrumbList'));
  }
  await writeFile(path.join(output, route === '/' ? 'home.html' : `${route.replace(/^\/|\/$/g, '').replaceAll('/', '-')}.html`), html);
  return result;
}
async function image(route, filename, width, height) {
  const { response, bytes } = await localGet(route);
  const isPNG = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const dimensions = isPNG && bytes.length > 24 ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : null;
  check(`${route}: HTTP PNG`, response.status === 200 && response.headers.get('content-type')?.startsWith('image/png') && isPNG, { status: response.status, contentType: response.headers.get('content-type') });
  check(`${route}: ${width}×${height}`, dimensions?.width === width && dimensions?.height === height, dimensions);
  headers(route, response);
  if (isPNG) {
    const imagePath = path.join(output, filename);
    await writeFile(imagePath, bytes);
    report.images.push({ route, file: imagePath, ...dimensions, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), visualReview: 'pending' });
  }
}

try {
  if (process.argv.includes('--final')) check('Final build: temporary fixture absent', !report.fixturePresent && projects.length === 5, { fixturePresent: report.fixturePresent, projectCount: projects.length });
  await page('/', siteConfig.metadata.title, siteConfig.metadata.description);
  await page('/projects', `${projectsCopy.all} — ${siteConfig.name}`, siteConfig.metadata.description);
  for (const project of projects) await page(`/projects/${project.slug}`, `${project.title} — ${siteConfig.name}`, project.description);
  await page('/privacidad', undefined, undefined, 404);
  await page('/qa-puente-inexistente', undefined, undefined, 404);

  const redirect = await localGet('/proyectos');
  check('/proyectos: permanent 308 redirect', redirect.response.status === 308 && redirect.response.headers.get('location') === '/projects', { status: redirect.response.status, location: redirect.response.headers.get('location') });
  // Next applies configured redirects before response headers. The destination,
  // already requested above, must retain the actual policy and security headers.
  const redirectedPage = report.routes.find(entry => entry.route === '/projects');
  check('/proyectos: destination preserves preview and security policy', redirectedPage?.headers['x-robots-tag'] === 'noindex, nofollow'
    && redirectedPage.headers['x-content-type-options'] === 'nosniff' && redirectedPage.headers['referrer-policy'] === 'strict-origin-when-cross-origin'
    && redirectedPage.headers['permissions-policy'] === 'camera=(), microphone=(), geolocation=()');
  const robots = await localGet('/robots.txt');
  check('Robots: preview crawl permits reading noindex', robots.response.status === 200 && /User-Agent:\s*\*/i.test(robots.bytes.toString()) && /Allow:\s*\//i.test(robots.bytes.toString()) && !/Sitemap:|Disallow:\s*\//i.test(robots.bytes.toString()), robots.bytes.toString());
  headers('/robots.txt', robots.response);
  const sitemap = await localGet('/sitemap.xml');
  check('Sitemap: valid empty preview XML', sitemap.response.status === 200 && /<urlset\b/.test(sitemap.bytes.toString()) && !/<loc>/.test(sitemap.bytes.toString()), sitemap.bytes.toString());
  headers('/sitemap.xml', sitemap.response);
  const manifestResponse = await localGet('/manifest.webmanifest');
  const manifest = JSON.parse(manifestResponse.bytes.toString());
  check('Manifest: actual identity / locale / browser mode', manifestResponse.response.status === 200 && manifest.name === siteConfig.name && manifest.lang === siteConfig.locale && manifest.display === 'browser');
  check('Manifest: official SVG, no invented PWA assets', manifest.icons?.length === 1 && manifest.icons[0].src === '/brand/mark.svg' && manifest.icons[0].type === 'image/svg+xml' && manifest.icons[0].purpose === 'any');
  headers('/manifest.webmanifest', manifestResponse.response);
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const icon = await localGet('/brand/mark.svg');
  check('Favicon: official SVG bytes served unchanged', icon.response.status === 200 && icon.bytes.equals(await readFile(path.join(repository, 'public/brand/mark.svg'))));
  await image('/opengraph-image', 'home-opengraph.png', 1200, 630);
  await image('/projects/opengraph-image', 'projects-opengraph.png', 1200, 630);
  await image('/apple-icon', 'apple-icon.png', 180, 180);
  for (const project of projects) await image(`/projects/${project.slug}/opengraph-image`, `${project.slug}-opengraph.png`, 1200, 630);
} catch (error) {
  report.errors.push(error instanceof Error ? error.stack : String(error));
  console.error(report.errors.at(-1));
}
report.passed = report.errors.length === 0 && report.checks.every(check => check.status === 'pass');
await writeFile(path.join(output, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed ? 'PASS' : 'FAIL'}: ${report.checks.filter(check => check.status === 'pass').length}/${report.checks.length} HTTP checks; fixture=${report.fixturePresent}; ${output}`);
process.exitCode = report.passed ? 0 : 1;
