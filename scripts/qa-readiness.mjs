import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Observe real fresh-visit readiness under CPU throttling. No storage overrides,
// server startup, screenshots, or production UI changes are part of this check.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(repository, 'package.json'));
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-readiness.mjs [--phase F3] [--url http://127.0.0.1:3000] [--out qa-results/F3/readiness]');
  console.log('Fresh visits at CPU 4×, including delayed motion scripts. CHROME_PATH selects the browser.');
  process.exit(0);
}
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const phase = option('--phase', 'F3');
if (!/^F(?:[0-9]|10)$/.test(phase)) throw new Error('Use --phase F0 … F10.');
const outputDirectory = path.resolve(repository, option('--out', `qa-results/${phase}/readiness`));
const profiles = [
  { name: 'mobile', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, tier: '1' },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, tier: '2' },
  { name: 'mobile-late-scripts', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, tier: '1', scriptDelayMs: 4200 },
];
const report = {
  baseURL,
  createdAt: new Date().toISOString(),
  phase,
  scope: `${phase}: first motion readiness and fresh intro deadlines at CPU 4×`,
  cpuThrottlingRate: 4,
  readinessDeadlineMs: 3000,
  introSafetyMs: 3000,
  usableIntroDeadlineMs: 5000,
  cases: [],
  errors: [],
  passed: false,
};
let browser;

function check(result, name, pass, detail = undefined) {
  result.checks.push({ name, status: pass ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${result.name}: ${name}${detail === undefined ? '' : ': ' + JSON.stringify(detail)}`);
}

function installRecorder() {
  const state = window.__readinessQA = {
    firstReadyMs: null,
    tierAtReady: null,
    jsMotionAtReady: null,
    failedMs: null,
    introStartedMs: null,
    introFinishedMs: null,
  };
  // Only attribute/markup notifications run; no layout reads or animation loop.
  const observer = new MutationObserver(() => sample());
  function sample() {
    const root = document.documentElement;
    if (!root) return;
    if (root.dataset.intro === 'true' && state.introStartedMs === null) state.introStartedMs = performance.now();
    if (root.dataset.motionFailed === 'true' && state.failedMs === null) state.failedMs = performance.now();
    if (root.dataset.motionReady !== 'true' || state.firstReadyMs !== null) return;
    state.firstReadyMs = performance.now();
    state.tierAtReady = root.dataset.motionTier;
    state.jsMotionAtReady = root.classList.contains('js-motion');
    observer.disconnect();
  }
  observer.observe(document, {
    attributes: true,
    attributeFilter: ['data-motion-ready', 'data-motion-failed', 'data-intro'],
    childList: true,
    subtree: true,
  });
  addEventListener('dos-orillas:intro-complete', () => { state.introFinishedMs ??= performance.now(); }, { once: true });
  sample();
}

async function runCase(profile) {
  const result = { name: profile.name, viewport: profile.viewport, isMobile: profile.isMobile, hasTouch: profile.hasTouch, checks: [], telemetry: null, runtimeErrors: [] };
  report.cases.push(result);
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  let session;
  let page;
  try {
    await context.addInitScript(installRecorder);
    if (profile.scriptDelayMs) await context.route('**/_next/static/chunks/*.js', async route => {
      // Delay actual responses, allowing the inline safety to run before hydration.
      await new Promise(resolve => setTimeout(resolve, profile.scriptDelayMs));
      await route.continue();
    });
    page = await context.newPage();
    page.on('pageerror', error => result.runtimeErrors.push({ type: 'pageerror', message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') result.runtimeErrors.push({ type: 'console', message: message.text() });
    });
    session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const response = await page.goto(baseURL, { waitUntil: 'commit', timeout: 30000 });
    check(result, 'HTTP response', Boolean(response?.ok()), response?.status());
    const becameReady = await page.waitForFunction(() => typeof window.__readinessQA?.firstReadyMs === 'number', null, { timeout: 15000, polling: 100 }).then(() => true).catch(() => false);
    check(result, 'motion readiness observed', becameReady);
    if (profile.scriptDelayMs) await context.unroute('**/_next/static/chunks/*.js');
    const cinematic = await page.locator('section#estudio[data-hero-variant="film"]').count() > 0;
    result.heroVariant = cinematic ? 'film' : 'legacy';
    if (!cinematic) {
      const introEnded = await page.waitForFunction(() => typeof window.__readinessQA?.introFinishedMs === 'number', null, { timeout: 6000, polling: 100 }).then(() => true).catch(() => false);
      check(result, 'fresh intro completion observed', introEnded);
    }
    // Inspect after the existing fail-open deadline, with no diagnostic delay or
    // interaction injected into the page. Successful readiness must retain motion.
    await page.waitForFunction(() => performance.now() >= 3100, null, { timeout: 6000, polling: 100 });
    result.telemetry = await page.evaluate(() => {
      const root = document.documentElement;
      const loader = document.querySelector('.preloader');
      const title = document.querySelector('main h1');
      const box = title?.getBoundingClientRect();
      const style = title ? getComputedStyle(title) : null;
      return {
        ...window.__readinessQA,
        sampledAtMs: performance.now(),
        finalReady: root.dataset.motionReady,
        finalTier: root.dataset.motionTier,
        finalJsMotion: root.classList.contains('js-motion'),
        motionFailed: root.dataset.motionFailed === 'true',
        introActive: root.classList.contains('do-intro') || root.dataset.intro === 'true',
        introHidden: !loader || getComputedStyle(loader).display === 'none',
        mainInert: document.querySelector('main')?.inert ?? null,
        titleVisible: Boolean(box && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && style?.display !== 'none' && style?.visibility === 'visible' && Number(style?.opacity) > 0),
        distanceHref: document.querySelector('main a[href="#distancia"]')?.getAttribute('href') ?? null,
        distanceTarget: Boolean(document.getElementById('distancia')),
        film: Boolean(document.querySelector('section#estudio[data-hero-variant="film"]')),
        filmPinned: Boolean(document.querySelector('section#estudio[data-hero-variant="film"]')?.closest('.pin-spacer')),
        filmShellPosition: document.querySelector('#estudio .hero-film-shell,#estudio .film-shell') ? getComputedStyle(document.querySelector('#estudio .hero-film-shell,#estudio .film-shell')).position : null,
        htmlOverflow: root.style.overflow,
        navInert: document.querySelector('.site-nav')?.inert ?? false,
      };
    });
    const state = result.telemetry;
    const failed = state.failedMs !== null;
    // A timer may run late while the main thread is occupied. Test the resulting
    // readable mode and stability, while retaining the exact observed times.
    check(result, 'readiness leaves a stable readable mode', state.finalReady === 'true' && (failed
      ? state.motionFailed && state.tierAtReady === '0' && state.finalTier === '0' && !state.jsMotionAtReady && !state.finalJsMotion
      : !state.motionFailed && state.tierAtReady === profile.tier && state.finalTier === profile.tier && state.jsMotionAtReady && state.finalJsMotion),
    { firstReadyMs: state.firstReadyMs, failedMs: state.failedMs, timerMs: report.readinessDeadlineMs, tierAtReady: state.tierAtReady, finalTier: state.finalTier, finalJsMotion: state.finalJsMotion });
    if (profile.scriptDelayMs) check(result, 'late scripts exercise the safety fallback', failed && state.motionFailed, { scriptDelayMs: profile.scriptDelayMs, failedMs: state.failedMs });
    const introDurationMs = typeof state.introFinishedMs === 'number' && typeof state.introStartedMs === 'number' ? state.introFinishedMs - state.introStartedMs : null;
    if (cinematic) {
      check(result, 'film never starts a blocking intro', state.introStartedMs === null && !state.introActive && state.introHidden && state.mainInert === false && !state.navInert && !['hidden', 'clip'].includes(state.htmlOverflow),
        { introStartedMs: state.introStartedMs, introActive: state.introActive, introHidden: state.introHidden, mainInert: state.mainInert, navInert: state.navInert, overflow: state.htmlOverflow });
      check(result, 'film remains natural flow after readiness', state.film && !state.filmPinned && state.filmShellPosition !== null && !['fixed', 'sticky'].includes(state.filmShellPosition),
        { film: state.film, pinned: state.filmPinned, shellPosition: state.filmShellPosition });
    } else check(result, 'fresh intro releases content promptly', introDurationMs !== null && introDurationMs >= 0 && introDurationMs <= report.usableIntroDeadlineMs && !state.introActive && state.introHidden, { observedIntroDurationMs: introDurationMs, configuredSafetyMs: report.introSafetyMs, usableDeadlineMs: report.usableIntroDeadlineMs });
    check(result, cinematic ? 'film main heading remains visible and interactive' : 'main heading visible and interactive after intro', state.titleVisible && state.mainInert === false, { titleVisible: state.titleVisible, mainInert: state.mainInert });
    if (cinematic) {
      const beforeWheel = await page.evaluate(() => ({ y: scrollY, top: document.getElementById('estudio').getBoundingClientRect().top }));
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, keyboard: document.activeElement instanceof Element && document.activeElement.matches(':focus-visible'), inLoader: Boolean(document.querySelector('.preloader')?.contains(document.activeElement)) }));
      check(result, 'film keyboard input assigns focus without an intro trap', focus.tag !== 'BODY' && focus.keyboard && !focus.inLoader, focus);
      await page.mouse.move(120, 220);
      await page.mouse.wheel(0, 260);
      const wheelWorked = await page.waitForFunction(y => scrollY > y + 20, beforeWheel.y, { timeout: 1500, polling: 100 }).then(() => true).catch(() => false);
      const afterWheel = await page.evaluate(() => ({ y: scrollY, top: document.getElementById('estudio').getBoundingClientRect().top, pinned: Boolean(document.getElementById('estudio').closest('.pin-spacer')) }));
      check(result, 'real wheel moves the film Hero in normal document flow', wheelWorked && !afterWheel.pinned && afterWheel.top < beforeWheel.top - 10, { before: beforeWheel, after: afterWheel });
    }
    check(result, 'native distance link and destination exist', state.distanceHref === '#distancia' && state.distanceTarget, { href: state.distanceHref, target: state.distanceTarget });
    // The scroll hint is deliberately omitted in compact mobile composition;
    // its primary CTA remains visible. Exercise a real visible native control.
    const hint = page.locator('main a[href="#distancia"]:visible');
    const nativeLink = await hint.count() ? hint : page.locator('main .hero-primary');
    const href = await nativeLink.getAttribute('href');
    await nativeLink.click();
    const reachedTarget = await page.waitForFunction(id => {
      const bounds = document.getElementById(id)?.getBoundingClientRect();
      return location.hash === '#' + id && bounds && bounds.top < innerHeight && bounds.bottom > 0;
    }, href.slice(1), { timeout: 10000 }).then(() => true).catch(() => false);
    check(result, 'visible native link reaches its destination', reachedTarget, { href });
    if (failed) {
      const staticScene = await page.evaluate(() => ({ tier: document.documentElement.dataset.motionTier, triggers: window.__stCount ?? 0, smoothing: Boolean(window.__lenis) }));
      check(result, 'late hydration cannot restart scenes on scroll', staticScene.tier === '0' && staticScene.triggers === 0 && !staticScene.smoothing, staticScene);
      await page.locator('.motion-toggle').click();
      const recovered = await page.waitForFunction(expected => {
        const root = document.documentElement;
        return root.dataset.motionFailed !== 'true' && root.dataset.motionTier === expected && root.classList.contains('js-motion');
      }, profile.tier, { timeout: 10000 }).then(() => true).catch(() => false);
      check(result, 'explicit motion control can enable enhancement', recovered);
      await page.locator('.motion-toggle').click();
      const reduced = await page.waitForFunction(() => document.documentElement.dataset.motionTier === '0' && !document.documentElement.classList.contains('js-motion'), null, { timeout: 10000 }).then(() => true).catch(() => false);
      check(result, 'motion control can return to static reading', reduced);
    }
  } catch (error) {
    check(result, 'case completed', false, error.message);
    report.errors.push({ case: profile.name, error: error.stack ?? error.message });
    if (page && !result.telemetry) result.telemetry = await page.evaluate(() => window.__readinessQA ?? null).catch(() => null);
  } finally {
    check(result, 'no browser runtime errors', result.runtimeErrors.length === 0, result.runtimeErrors);
    if (session) {
      // CDP rate 1 restores normal CPU speed; rate 0 is not its reset value.
      await session.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(error => {
        check(result, 'CPU throttling restored', false, error.message);
      });
      await session.detach().catch(() => {});
    }
    await context.close();
  }
}

try {
  await mkdir(outputDirectory, { recursive: true });
  const { chromium } = requireProject('@playwright/test');
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  if (executablePath && !existsSync(executablePath)) throw new Error(`Chrome executable not found: ${executablePath}`);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const profile of profiles) await runCase(profile);
} catch (error) {
  report.errors.push({ error: error.stack ?? error.message });
  console.error(error.message);
} finally {
  await browser?.close();
  report.passed = report.errors.length === 0 && report.cases.length === profiles.length && report.cases.every(result => result.checks.length > 0 && result.checks.every(item => item.status === 'pass'));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Readiness: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(outputDirectory, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
