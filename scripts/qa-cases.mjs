import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// An already-built server, real project data, sequential contexts.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(repository, 'package.json'));
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const profiles = [
  { name: 'chrome', reduced: false },
  { name: 'reduced', reduced: true },
  { name: 'no-vt', reduced: false, noVT: true },
  { name: 'no-js', reduced: true, noJS: true },
];
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-cases.mjs [--url http://127.0.0.1:3000] [--cases chrome,reduced,no-vt,no-js] [--out qa-results/F6/cases] [--data data/projects.ts]');
  console.log('Five navigation cycles per JS profile; Featured history return, native links, cover pairing and cleanup. No build/server startup/CPU throttling. CHROME_PATH is supported.');
  process.exit(0);
}
const selected = option('--cases', profiles.map(profile => profile.name).join(',')).split(',').filter(Boolean);
assert.ok(selected.length && selected.every(name => profiles.some(profile => profile.name === name)), 'Unknown --cases.');
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const localOrigin = new URL(baseURL);
assert.ok(localOrigin.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(localOrigin.hostname), 'Case QA must target the existing local HTTP build.');
const outputDirectory = path.resolve(repository, option('--out', 'qa-results/F6/cases'));
const report = { phase: 'F6', baseURL, createdAt: new Date().toISOString(), cases: [], errors: [], passed: false };
let browser;
let projects;

async function readProjects() {
  const filename = path.resolve(repository, option('--data', 'data/projects.ts'));
  if (filename.endsWith('.json')) return JSON.parse(await readFile(filename, 'utf8'));
  const typescript = requireProject('typescript');
  const compiled = typescript.transpileModule(await readFile(filename, 'utf8'), {
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS },
  }).outputText;
  const transpiledModule = { exports: {} };
  vm.runInNewContext(compiled, { module: transpiledModule, exports: transpiledModule.exports, require: requireProject }, { filename, timeout: 1500 });
  assert.ok(Array.isArray(transpiledModule.exports.projects) && transpiledModule.exports.projects.length, 'A nonempty projects export is required.');
  return transpiledModule.exports.projects;
}
function check(result, name, condition, detail) {
  result.checks.push({ name, status: condition ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${result.name}: ${name}`);
}
function installRecorder(noVT) {
  const record = window.__caseQA = { calls: 0, running: 0, failures: [], namedCaptures: [], clones: 0, curtains: 0 };
  const original = document.startViewTransition;
  if (noVT) Object.defineProperty(document, 'startViewTransition', { configurable: true, value: undefined });
  else if (typeof original === 'function') document.startViewTransition = function(...args) {
    record.calls += 1;
    record.running += 1;
    record.namedCaptures.push(Array.from(document.querySelectorAll('[data-project-cover]')).filter(element => element.getClientRects().length > 0).map(element => ({
      name: getComputedStyle(element).viewTransitionName,
      source: element.dataset.projectCoverSourceId ?? element.dataset.projectCoverRole,
    })).filter(item => item.name.startsWith('project-')));
    const transition = original.apply(document, args);
    transition.ready.catch(error => record.failures.push(String(error)));
    transition.finished.finally(() => { record.running -= 1; }).catch(() => {});
    return transition;
  };
  new MutationObserver(records => records.forEach(item => item.addedNodes.forEach(node => {
    if (!(node instanceof Element)) return;
    if (node.matches('.project-transition-clone')) record.clones += 1;
    if (node.matches('.project-transition-curtain')) record.curtains += 1;
  }))).observe(document, { childList: true, subtree: true });
}
async function settle(page) {
  await page.waitForFunction(() => !document.querySelector('.project-transition-clone,.project-transition-curtain')
    && (window.__caseQA?.running ?? 0) === 0, null, { timeout: 9000 });
  await page.waitForTimeout(200);
}
async function visibleLocator(page, selector) {
  const matches = page.locator(selector);
  for (let index = 0; index < await matches.count(); index += 1) {
    const candidate = matches.nth(index);
    if (await candidate.evaluate(element => element.getClientRects().length > 0)) return candidate;
  }
  throw new Error(`No visible instance: ${selector}`);
}
async function show(page, selector) {
  const target = await (await visibleLocator(page, selector)).evaluate(element => element.getBoundingClientRect().top + scrollY - 120);
  await page.evaluate(y => {
    window.__lenis?.resize();
    window.__lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo({ top: y, behavior: 'instant' });
  }, Math.max(0, target));
  await page.waitForTimeout(300);
}
async function goCase(page, slug) {
  await page.waitForURL(url => url.pathname === `/projects/${slug}`, { timeout: 15000 });
  await page.waitForFunction(slug => Array.from(document.querySelectorAll(`[data-project-case="${CSS.escape(slug)}"]`))
    .some(element => element.getClientRects().length > 0), slug, { timeout: 15000 });
  await settle(page);
}
async function inspectCase(page, result, project, label) {
  const actual = await (await visibleLocator(page, `[data-project-case="${project.slug}"]`)).evaluate(root => {
    const title = root.querySelector('h1');
    const bounds = title.getBoundingClientRect();
    return {
      title: title.getAttribute('aria-label') ?? title.textContent.trim(),
      titleVisible: bounds.top >= 0 && bounds.bottom > 0 && bounds.top < innerHeight,
      chapterIds: Array.from(root.querySelectorAll('[data-project-chapter]')).map(chapter => chapter.dataset.projectChapter),
      technologies: Array.from(root.querySelectorAll('.case-technology-list li')).map(item => item.textContent.trim()),
      yearFields: root.querySelectorAll('.case-metadata dt').length,
      next: root.querySelector('[data-project-next]')?.getAttribute('href') ?? null,
      back: root.querySelector('[data-project-back]')?.getAttribute('href') ?? null,
      pins: document.querySelectorAll('.pin-spacer').length,
      staleFeaturedRange: Boolean(window.__sceneRanges?.featured),
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
    };
  });
  const narrative = ['overview', 'challenge', 'approach', 'solution'].filter(id => {
    const field = id === 'overview' ? 'intro' : id;
    return Boolean(project[field]?.trim());
  });
  const expected = [...narrative, ...(project.technologies.length ? ['technologies'] : [])];
  // Gallery existence depends on the manifest, so compare null narrative/result rather than mirroring media selection.
  if (project.result?.trim()) expected.push('result');
  const actualWithoutGallery = actual.chapterIds.filter(id => id !== 'gallery');
  const nextIndex = (projects.findIndex(item => item.slug === project.slug) + 1) % projects.length;
  check(result, `${label}: real title and technologies`, actual.title === project.title
    && JSON.stringify(actual.technologies) === JSON.stringify(project.technologies), actual);
  check(result, `${label}: only populated narrative chapters`, JSON.stringify(actualWithoutGallery) === JSON.stringify(expected));
  check(result, `${label}: real Back and cyclic Next href`, actual.back === '/projects'
    && actual.next === (projects.length > 1 ? `/projects/${projects[nextIndex].slug}` : null));
  check(result, `${label}: no fabricated year`, actual.yearFields === (project.year === null ? 2 : 3));
  check(result, `${label}: readable viewport and previous pins cleaned`, actual.titleVisible
    && actual.width <= actual.viewport + 1 && actual.pins === 0 && !actual.staleFeaturedRange, actual);
}
async function inspectLanding(page, result, slug, label) {
  await page.waitForURL(url => url.pathname === '/projects', { timeout: 15000 });
  const selector = `[data-project-cover-source-id="grid:${slug}"][data-project-cover-path="/projects"]`;
  await page.waitForFunction(selector => Array.from(document.querySelectorAll(selector))
    .some(element => element.getClientRects().length > 0), selector, { timeout: 15000 });
  await settle(page);
  const state = await (await visibleLocator(page, selector)).evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const link = element.closest('a');
    return { top: bounds.top, bottom: bounds.bottom, viewport: innerHeight,
      focused: Boolean(link && link === document.activeElement), pins: document.querySelectorAll('.pin-spacer').length,
      scrollY, triggerCount: window.__stCount ?? 0 };
  });
  check(result, `${label}: card restored after deferred layout`, state.bottom > 88 && state.top < state.viewport && state.focused, state);
  check(result, `${label}: no previous pin spacers`, state.pins === 0);
  result.landingCounts.push(state.triggerCount);
}
async function featuredHistory(page, result) {
  await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true'
    && document.documentElement.dataset.intro !== 'true', null, { timeout: 10000 });
  await show(page, '#proyectos');
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#proyectos')).some(element => element.getClientRects().length > 0 && element.dataset.featuredReady === 'true'), null, { timeout: 10000 });
  const featured = await visibleLocator(page, '#proyectos');
  const slide = await featured.evaluate(root => Number(root.dataset.featuredIndex ?? 0));
  const sourceLink = featured.locator(`[data-featured-slide="${slide}"] .featured-project-link`);
  const slug = await sourceLink.getAttribute('data-project-transition-link');
  await sourceLink.focus();
  await page.waitForTimeout(700);
  await sourceLink.click();
  await goCase(page, slug);
  const before = await page.evaluate(() => window.__caseQA.calls);
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForURL(url => url.pathname === '/');
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#proyectos')).some(element => element.getClientRects().length > 0 && element.dataset.featuredReady === 'true'), null, { timeout: 10000 });
  await settle(page);
  const restored = await (await visibleLocator(page, `[data-project-cover-source-id="featured:${slug}"][data-project-cover-path="/"]`)).evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const root = element.closest('#proyectos');
    const active = root.querySelector(`[data-featured-slide="${root.dataset.featuredIndex}"]`);
    return { visible: bounds.bottom > 88 && bounds.top < innerHeight,
      activeSlug: active?.dataset.projectSlug, focused: element.closest('a') === document.activeElement,
      mode: root.dataset.featuredMode, y: scrollY };
  });
  check(result, 'Featured browserBack returns to the same active carousel source', restored.visible
    && restored.activeSlug === slug && restored.focused, restored);
  const captures = await page.evaluate(from => window.__caseQA.namedCaptures.slice(from), before);
  check(result, 'browserBack uses crossfade without cover morph', captures.every(items => items.length === 0), captures);
}
async function runProfile(profile) {
  const result = { name: profile.name, checks: [], runtimeErrors: [], landingCounts: [], telemetry: null };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    reducedMotion: profile.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: !profile.noJS });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (['data:', 'blob:'].includes(url.protocol)) { await route.continue(); return; }
    if (url.origin !== localOrigin.origin || !['GET', 'HEAD'].includes(request.method()) || url.pathname.startsWith('/api/')) {
      result.runtimeErrors.push('Nonlocal or mutating request was blocked by case QA.');
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  try {
    if (!profile.noJS) await context.addInitScript(installRecorder, Boolean(profile.noVT));
    const page = await context.newPage();
    page.on('pageerror', error => result.runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.runtimeErrors.push(message.text()); });
    if (profile.noJS) {
      for (const project of projects) {
        const response = await page.goto(`${baseURL}/projects/${project.slug}`, { waitUntil: 'networkidle' });
        check(result, `SSR HTTP ${project.slug}`, Boolean(response?.ok()), response?.status());
        await inspectCase(page, result, project, project.slug);
      }
      return;
    }
    if (profile.name === 'chrome') await featuredHistory(page, result);
    await page.goto(`${baseURL}/projects`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true', null, { timeout: 10000 });
    for (let cycle = 0; cycle < 5; cycle += 1) {
      const project = projects[cycle % projects.length];
      const source = `[data-project-cover-source-id="grid:${project.slug}"][data-project-cover-path="/projects"]`;
      await show(page, source);
      const link = (await visibleLocator(page, source)).locator('xpath=ancestor::a[1]');
      await link.focus();
      await link.click();
      await goCase(page, project.slug);
      await inspectCase(page, result, project, `cycle ${cycle + 1}`);
      // Exercise deferred case motion before disposal: no synthetic state setters.
      const activeCase = await visibleLocator(page, `[data-project-case="${project.slug}"]`);
      const next = activeCase.locator('[data-project-next]');
      if (await next.count()) { await show(page, `[data-project-case="${project.slug}"] [data-project-next]`); await next.focus(); }
      let landingProject = project;
      if (cycle === 2 && await next.count()) {
        const href = await next.getAttribute('href');
        landingProject = projects.find(item => `/projects/${item.slug}` === href);
        assert.ok(landingProject, 'NextProject must target a real project.');
        await next.click();
        await goCase(page, landingProject.slug);
        await inspectCase(page, result, landingProject, 'manual NextProject navigation');
      }
      await (await visibleLocator(page, `[data-project-case="${landingProject.slug}"]`)).locator('[data-project-back]').click();
      await inspectLanding(page, result, landingProject.slug, `cycle ${cycle + 1}`);
    }
    const beforeHistory = await page.evaluate(() => window.__caseQA.calls);
    await page.goBack({ waitUntil: 'commit' });
    await page.waitForURL(url => url.pathname.startsWith('/projects/'));
    await settle(page);
    const historyNames = await page.evaluate(from => window.__caseQA.namedCaptures.slice(from), beforeHistory);
    check(result, 'case browserBack never uses stale cover names', historyNames.every(items => items.length === 0), historyNames);
    result.telemetry = await page.evaluate(() => ({ ...window.__caseQA,
      tier: document.documentElement.dataset.motionTier,
      overlays: document.querySelectorAll('.project-transition-clone,.project-transition-curtain').length }));
    check(result, 'no duplicate named covers at capture', result.telemetry.namedCaptures.every(items => items.length <= 1), result.telemetry.namedCaptures);
    check(result, 'no failed native View Transitions or remaining overlays', result.telemetry.failures.length === 0 && result.telemetry.overlays === 0, result.telemetry);
    if (profile.reduced) check(result, 'reduced motion avoids VT/Flip/curtain', result.telemetry.tier === '0'
      && result.telemetry.calls === 0 && result.telemetry.clones === 0 && result.telemetry.curtains === 0);
    if (profile.noVT) check(result, 'unsupported browser used and cleaned cover fallback', result.telemetry.calls === 0 && result.telemetry.clones >= 5);
    if (profile.name === 'chrome') check(result, 'native stable API captured a selected cover', result.telemetry.namedCaptures.some(items => items.length === 1));
    check(result, 'five cycles did not grow trigger count', result.landingCounts.length === 5
      && result.landingCounts.at(-1) <= Math.max(...result.landingCounts.slice(0, 2)) + 2, result.landingCounts);
  } catch (error) {
    check(result, 'profile completed', false, error.message);
    report.errors.push({ profile: profile.name, error: error.stack ?? error.message });
  } finally {
    check(result, 'no browser runtime errors', result.runtimeErrors.length === 0, result.runtimeErrors);
    await context.close();
  }
}
try {
  projects = await readProjects();
  const { chromium } = requireProject('@playwright/test');
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  if (executablePath) assert.ok(existsSync(executablePath), `Chrome not found: ${executablePath}`);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const profile of profiles.filter(item => selected.includes(item.name))) await runProfile(profile);
} catch (error) {
  report.errors.push({ error: error.stack ?? error.message });
} finally {
  await browser?.close();
  report.passed = report.errors.length === 0 && report.cases.length === selected.length
    && report.cases.every(result => result.checks.length && result.checks.every(item => item.status === 'pass'));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`F6 cases: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(outputDirectory, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
