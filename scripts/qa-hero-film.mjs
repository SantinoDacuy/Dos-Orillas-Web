import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Install under repo/scripts. Uses an existing server and real local assets.
// No browser downloads, source edits, synthetic footage, or email actions.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(project, 'package.json'));
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
const profiles = [
  ...[375, 768, 1024, 1440, 1920, 320].map(width => ({ name: `width-${width}`, width, height: width < 768 ? 812 : 900 })),
  { name: 'text200-375', width: 375, height: 812, text200: true },
  { name: 'text200-1440', width: 1440, height: 900, text200: true },
  { name: 'short', width: 393, height: 450 },
  { name: 'reduced-375', width: 375, height: 812, reduced: true },
  { name: 'reduced-1440', width: 1440, height: 900, reduced: true },
  { name: 'no-js', width: 375, height: 812, noJS: true },
  { name: 'playback', width: 1440, height: 900, playback: true },
  { name: 'motion-preference', width: 375, height: 812, preference: true },
];
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-hero-film.mjs [--url http://127.0.0.1:3000] [--cases ' + profiles.map(profile => profile.name).join(',') + '] [--out qa-results/F4/film]');
  console.log('Sequential contexts. Real HTML media time, pause/resume and preference changes; no in-page RAF loop. CHROME_PATH selects the installed browser.');
  process.exit(0);
}
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const names = option('--cases', profiles.map(profile => profile.name).join(',')).split(',');
if (!names.length || names.some(name => !profiles.some(profile => profile.name === name))) throw new Error('Unknown --cases. See --help.');
const selected = profiles.filter(profile => names.includes(profile.name));
const out = path.resolve(project, option('--out', 'qa-results/F4/film'));
const videoPath = '/visuals/dos-orillas-film.mp4';
const videoPaths = [videoPath, '/visuals/dos-orillas-film-mobile.mp4'];
const posterPath = '/visuals/hero-film-poster.webp';
const desktopPosterPath = '/visuals/hero-film-poster-desktop.webp';
const report = {
  phase: 'F4', baseURL, createdAt: new Date().toISOString(), browser: null,
  scope: 'Original provided film, responsive normal-flow Hero, native playback and static fallbacks',
  visualReviewRequired: 'Screenshots must be reviewed against the supplied original film and for contrast over its moving frames. DOM/axe cannot prove geographic identity, pixel provenance, or contrast of every frame.',
  cases: [], errors: [], passed: false,
};
let browser;
let AxeBuilder;

function check(result, name, condition, detail) {
  const passed = Boolean(condition);
  result.checks.push({ name, status: passed ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${result.name}: ${name}${detail === undefined ? '' : ': ' + JSON.stringify(detail)}`);
}

function installRecorder() {
  const state = window.__heroFilmQA = { paints: [], resources: [], media: [] };
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) state.paints.push({ name: entry.name, startTime: entry.startTime });
    }).observe({ type: 'paint', buffered: true });
  } catch { state.paintObserverUnavailable = true; }
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (entry.name.includes('/visuals/dos-orillas-film')) state.resources.push({ name: entry.name, startTime: entry.startTime, duration: entry.duration, initiatorType: entry.initiatorType });
    }).observe({ type: 'resource', buffered: true });
  } catch { state.resourceObserverUnavailable = true; }
  for (const type of ['play', 'playing', 'pause', 'loadedmetadata', 'loadeddata', 'error']) document.addEventListener(type, event => {
    if (!(event.target instanceof HTMLVideoElement) || !event.target.matches('[data-hero-video]')) return;
    state.media.push({ type, atMs: performance.now(), currentTime: event.target.currentTime, paused: event.target.paused, readyState: event.target.readyState, error: event.target.error?.code ?? null });
  }, true);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('#estudio[data-hero-variant="film"]');
    const title = hero?.querySelector('h1#hero-title');
    const shell = hero?.querySelector('.hero-film-shell');
    const video = hero?.querySelector('video[data-hero-video]');
    const poster = hero?.querySelector('img.hero-film-poster');
    const toggle = hero?.querySelector('button[data-hero-video-toggle]');
    const elementBox = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height,
        visible: box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0,
        color: style.color, opacity: Number(style.opacity), position: style.position, fontSize: parseFloat(style.fontSize),
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
    };
    const name = toggle?.getAttribute('aria-label') || (toggle?.getAttribute('aria-labelledby') ?? '').split(/\s+/).map(id => document.getElementById(id)?.textContent ?? '').join(' ') || toggle?.textContent?.trim() || '';
    const textElements = hero ? Array.from(hero.querySelectorAll('h1,p,.hero-actions a')).filter(element => !element.closest('[aria-hidden="true"]')) : [];
    const loader = document.querySelector('.preloader');
    const root = document.documentElement;
    return {
      atMs: performance.now(), timeOrigin: performance.timeOrigin, viewport: { width: innerWidth, height: innerHeight },
      tier: root.dataset.motionTier, motionReady: root.dataset.motionReady ?? null,
      hero: elementBox(hero), shell: elementBox(shell), title: elementBox(title), titleText: title?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      text: textElements.map(element => ({ tag: element.tagName, className: element.className, text: element.textContent?.trim() ?? '', box: elementBox(element) })),
      actions: hero ? Array.from(hero.querySelectorAll('.hero-actions a')).map(anchor => ({ href: anchor.getAttribute('href'), text: anchor.textContent?.trim(), box: elementBox(anchor) })) : [],
      accessibleCopy: hero ? [hero.textContent, ...Array.from(hero.querySelectorAll('[aria-label],[alt]')).map(element => element.getAttribute('aria-label') || element.getAttribute('alt'))].join(' ') : '',
      sources: hero ? Array.from(hero.querySelectorAll('video,video source')).map(element => ({ src: element.getAttribute('src'), poster: element.getAttribute('poster') })) : [],
      video: video ? { src: video.getAttribute('src'), currentSrc: video.currentSrc, poster: video.poster,
        currentTime: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : null,
        paused: video.paused, readyState: video.readyState, muted: video.muted, loop: video.loop,
        playsInline: video.playsInline, videoWidth: video.videoWidth, videoHeight: video.videoHeight,
        decodedFrames: video.getVideoPlaybackQuality?.().totalVideoFrames ?? null,
        error: video.error?.code ?? null, box: elementBox(video) } : null,
      toggle: toggle ? { name, pressed: toggle.getAttribute('aria-pressed'), disabled: toggle.disabled, box: elementBox(toggle) } : null,
      introActive: root.classList.contains('do-intro') || root.dataset.intro === 'true',
      loaderVisible: Boolean(loader && elementBox(loader)?.visible), mainInert: document.querySelector('main')?.inert ?? null,
      heroPinned: Boolean(hero?.closest('.pin-spacer') || hero?.querySelector('.pin-spacer')),
      heroRange: window.__sceneRanges?.hero ?? null,
      poster: poster ? { source: poster.currentSrc, naturalWidth: poster.naturalWidth, complete: poster.complete } : null,
      navigation: { color: getComputedStyle(document.querySelector('.site-nav')).color,
        logoFilter: getComputedStyle(document.querySelector('.nav-logo-dark')).filter },
      progressLabel: elementBox(document.querySelector('.scroll-progress-label')),
      overflowPx: Math.max(root.scrollWidth, document.body.scrollWidth) - innerWidth,
      paints: window.__heroFilmQA?.paints ?? performance.getEntriesByType('paint').map(entry => ({ name: entry.name, startTime: entry.startTime })),
      resources: window.__heroFilmQA?.resources ?? performance.getEntriesByType('resource').filter(entry => entry.name.includes('/visuals/dos-orillas-film')).map(entry => ({ name: entry.name, startTime: entry.startTime, duration: entry.duration })),
      mediaEvents: window.__heroFilmQA?.media ?? null,
    };
  });
}

function localAsset(url, expected) {
  if (!url) return false;
  try { return new URL(url, baseURL).origin === new URL(baseURL).origin && new URL(url, baseURL).pathname === expected; } catch { return false; }
}

function requestedAsset(url, expected) {
  try {
    const parsed = new URL(url, baseURL);
    if (parsed.origin !== new URL(baseURL).origin) return false;
    return parsed.pathname === expected || (parsed.pathname === '/_next/image' && localAsset(parsed.searchParams.get('url'), expected));
  } catch { return false; }
}

function layoutReadable(state) {
  const hero = state.hero;
  return Boolean(hero && state.title?.visible && state.shell?.visible && state.overflowPx <= 1
    && state.text.length > 0 && state.text.every(item => item.box?.visible && item.box.opacity >= .65
      && item.box.left >= -1 && item.box.right <= state.viewport.width + 1
      && item.box.top >= hero.top - 1 && item.box.bottom <= hero.bottom + 2
      && item.box.scrollWidth <= item.box.clientWidth + 2));
}

async function enlargeText(page) {
  return page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('#estudio h1,#estudio h2,#estudio h3,#estudio p,#estudio a,#estudio button,#estudio span'))
      .filter(element => Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
    const measured = elements.map(element => ({ element, original: parseFloat(getComputedStyle(element).fontSize) }));
    for (const item of measured) if (Number.isFinite(item.original)) item.element.style.setProperty('font-size', `${item.original * 2}px`, 'important');
    return measured.map(item => ({ tag: item.element.tagName, original: item.original, applied: parseFloat(getComputedStyle(item.element).fontSize) }));
  });
}

async function screenshot(page, result, suffix) {
  const filename = `${result.name}-${suffix}.png`;
  await page.screenshot({ path: path.join(out, filename), fullPage: false });
  result.screenshots.push(filename);
}

async function playing(page) {
  return page.waitForFunction(() => {
    const video = document.querySelector('video[data-hero-video]');
    return video && !video.paused && video.readyState >= 2 && video.currentTime > .15 && video.videoWidth > 0;
  }, null, { timeout: 12000, polling: 100 }).then(() => true).catch(() => false);
}

async function waitPaused(page) {
  return page.waitForFunction(() => document.querySelector('video[data-hero-video]')?.paused === true, null, { timeout: 2000, polling: 50 }).then(() => true).catch(() => false);
}

async function pausedTime(page) {
  const before = await snapshot(page);
  await page.waitForTimeout(650);
  const after = await snapshot(page);
  return { before, after, drift: Math.abs((after.video?.currentTime ?? 0) - (before.video?.currentTime ?? 0)) };
}

async function advancingTime(page) {
  const before = await snapshot(page);
  await page.waitForTimeout(500);
  const after = await snapshot(page);
  const duration = after.video?.duration ?? before.video?.duration;
  const difference = (after.video?.currentTime ?? 0) - (before.video?.currentTime ?? 0);
  const advanced = duration ? (difference + duration) % duration : difference;
  return { before, after, advanced };
}

async function playbackChecks(page, result) {
  check(result, 'original optimized movie actually plays', await playing(page));
  const running = await snapshot(page);
  result.snapshots.running = running;
  check(result, 'native playback uses local source with decoded dimensions', videoPaths.some(path => localAsset(running.video?.currentSrc, path)) && running.video.videoWidth > 0 && running.video.videoHeight > 0 && !running.video.error,
    running.video);
  check(result, 'desktop playback recovers original source detail without upscaling', running.video?.videoWidth === 1924 && running.video.videoHeight === 1076, running.video);
  check(result, 'background movie is muted, inline and looping', running.video?.muted && running.video.playsInline && running.video.loop, running.video);
  const fcp = running.paints.find(entry => entry.name === 'first-contentful-paint')?.startTime;
  const firstRequest = running.resources.length ? Math.min(...running.resources.map(entry => entry.startTime)) : null;
  check(result, 'real video request begins after contentful paint', typeof fcp === 'number' && firstRequest !== null && firstRequest >= fcp - 1, { fcp, firstRequest, resources: running.resources });
  check(result, 'playing control exposes an accessible label and false paused state', /video|película|movimiento|animación/i.test(running.toggle?.name ?? '') && running.toggle?.pressed === 'false', running.toggle);
  await page.locator('button[data-hero-video-toggle]').click();
  check(result, 'real control pauses native playback', await waitPaused(page));
  const paused = await pausedTime(page);
  result.snapshots.paused = paused;
  check(result, 'paused control matches state and media time stays still', paused.after.toggle?.pressed === 'true' && paused.after.video?.paused && paused.drift <= .08, { pressed: paused.after.toggle?.pressed, drift: paused.drift });
  await page.locator('button[data-hero-video-toggle]').click();
  check(result, 'real control resumes native playback', await playing(page));
  const resumed = await snapshot(page);
  check(result, 'resumed control exposes false paused state', resumed.toggle?.pressed === 'false', resumed.toggle);
  const resumeTime = await advancingTime(page);
  result.snapshots.resumed = resumeTime;
  check(result, 'resumed movie clock really advances', !resumeTime.after.video?.paused && resumeTime.advanced > .1, { advanced: resumeTime.advanced });
  // Move beyond the Hero, instead of setting video state or faking visibility.
  await page.evaluate(() => {
    const hero = document.getElementById('estudio');
    const box = hero.getBoundingClientRect();
    window.scrollTo({ top: scrollY + box.bottom + innerHeight, behavior: 'instant' });
  });
  await page.waitForFunction(() => document.getElementById('estudio').getBoundingClientRect().bottom <= 0, null, { timeout: 2000, polling: 50 });
  check(result, 'movie pauses when real Hero leaves viewport', await waitPaused(page));
  const away = await pausedTime(page);
  result.snapshots.offscreen = away;
  check(result, 'offscreen movie consumes no advancing media time', away.drift <= .08, { drift: away.drift, video: away.after.video });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  check(result, 'movie resumes when visible again after automatic pause', await playing(page));
  const returnTime = await advancingTime(page);
  result.snapshots.returned = returnTime;
  check(result, 'visible movie clock advances after automatic resume', !returnTime.after.video?.paused && returnTime.advanced > .1, { advanced: returnTime.advanced });
  const returned = await snapshot(page);
  check(result, 'film Hero stayed outside every pin spacer', !returned.heroPinned && !returned.heroRange, { pinned: returned.heroPinned, range: returned.heroRange });
  await screenshot(page, result, 'playing');
}

async function preferenceChecks(page, result) {
  check(result, 'movie begins with allowed motion', await playing(page));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check(result, 'live reduced-motion preference pauses movie', await waitPaused(page));
  const reduced = await pausedTime(page);
  result.snapshots.preferenceReduced = reduced;
  check(result, 'reduced preference keeps media time still', reduced.drift <= .08 && reduced.after.video?.paused, { drift: reduced.drift });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  check(result, 'allowed preference can resume automatically paused movie', await playing(page));
  await page.locator('button[data-hero-video-toggle]').click();
  check(result, 'user chooses pause before preference round trip', await waitPaused(page));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const userPaused = await pausedTime(page);
  result.snapshots.userPausedAfterPreference = userPaused;
  check(result, 'preference round trip preserves an explicit user pause', userPaused.after.video?.paused && userPaused.after.toggle?.pressed === 'true' && userPaused.drift <= .08, { pressed: userPaused.after.toggle?.pressed, drift: userPaused.drift });
}

async function runCase(profile) {
  const result = { name: profile.name, profile, checks: [], screenshots: [], snapshots: {}, runtimeErrors: [], responses: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: 1,
    isMobile: profile.width < 768, hasTouch: profile.width < 768,
    javaScriptEnabled: !profile.noJS, reducedMotion: profile.reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', error => result.runtimeErrors.push({ type: 'pageerror', message: error.message, stack: error.stack ?? null }));
  page.on('console', message => { if (message.type() === 'error') result.runtimeErrors.push({ type: 'console', message: message.text() }); });
  page.on('response', response => {
    if ([posterPath, desktopPosterPath, ...videoPaths].some(path => requestedAsset(response.url(), path))) result.responses.push({ url: response.url(), status: response.status(), type: response.request().resourceType() });
  });
  try {
    if (!profile.noJS) await context.addInitScript(installRecorder);
    const response = await page.goto(baseURL, { waitUntil: profile.noJS ? 'load' : 'domcontentloaded', timeout: 30000 });
    check(result, 'HTTP response', Boolean(response?.ok()), response?.status());
    await page.locator('#estudio[data-hero-variant="film"] h1#hero-title').waitFor({ state: 'visible', timeout: 15000 });
    if (!profile.noJS) await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true', null, { timeout: 10000, polling: 100 });
    if (!profile.noJS) await page.evaluate(() => document.fonts.ready);
    else await page.waitForTimeout(400);
    if (profile.text200) {
      result.textScale = await enlargeText(page);
      check(result, 'actual rendered text doubled', result.textScale.length > 0 && result.textScale.every(item => Math.abs(item.applied - item.original * 2) <= .3), result.textScale);
      await page.waitForTimeout(350);
    }
    result.snapshots.initial = await snapshot(page);
    const state = result.snapshots.initial;
    check(result, 'real Dos Orillas heading and both native actions remain', /DOS\s*ORILLAS/i.test(state.titleText) && state.actions.some(action => action.href === '#contacto') && state.actions.some(action => action.href === '#proyectos'), { title: state.titleText, actions: state.actions });
    check(result, 'Hero copy and asset URLs omit foreign demo branding', !/\b(?:Prisma|VEX|Joinlab|demoassets)\b/i.test(state.accessibleCopy) && state.sources.every(source => !source.src || videoPaths.some(path => localAsset(source.src, path))), { copy: state.accessibleCopy, sources: state.sources });
    check(result, 'film shell and all Hero text fit without horizontal clipping', layoutReadable(state), { hero: state.hero, shell: state.shell, title: state.title, text: state.text, overflow: state.overflowPx });
    check(result, 'first-frame navigation has a light label and logo over the film', state.navigation.color === 'rgb(242, 238, 230)' && state.navigation.logoFilter.includes('invert(1)'), state.navigation);
    if (state.toggle?.box?.visible && state.progressLabel?.visible) {
      const control = state.toggle.box; const label = state.progressLabel;
      check(result, 'video control and chapter label do not overlap', control.right <= label.left || label.right <= control.left || control.bottom <= label.top || label.bottom <= control.top, { control, label });
    }
    check(result, 'cinematic Hero has normal flow and no intro overlay', !state.heroPinned && !state.heroRange && !state.introActive && !state.loaderVisible && state.mainInert === false && state.hero?.position !== 'fixed', { pinned: state.heroPinned, range: state.heroRange, intro: state.introActive, loader: state.loaderVisible, mainInert: state.mainInert });
    check(result, 'poster URL points to the provided film extraction', localAsset(state.video?.poster, posterPath), state.video?.poster);
    check(result, 'responsive first frame selects the real high-resolution desktop poster', state.poster?.complete && localAsset(state.poster.source, profile.width >= 1024 ? desktopPosterPath : posterPath) && state.poster.naturalWidth >= (profile.width >= 1024 ? 1924 : 1280), state.poster);
    await screenshot(page, result, 'hero');
    if (profile.reduced || profile.noJS) {
      const still = await pausedTime(page);
      result.snapshots.static = still;
      check(result, 'static fallback does not start or advance video', still.after.video?.paused && still.drift <= .08 && still.after.resources.length === 0 && !result.responses.some(item => videoPaths.some(path => requestedAsset(item.url, path))), { video: still.after.video, drift: still.drift, requests: result.responses });
      check(result, 'real poster was delivered for static fallback', result.responses.some(item => requestedAsset(item.url, posterPath) && item.status === 200), result.responses);
      if (profile.noJS) {
        check(result, 'no-JS playback control presents no false clickable action', !still.after.toggle || !still.after.toggle.box?.visible || still.after.toggle.disabled, still.after.toggle);
        await page.locator('#estudio .hero-actions a[href="#contacto"]').click();
        check(result, 'no-JS actual contact anchor remains usable', new URL(page.url()).hash === '#contacto', page.url());
      }
    }
    if (profile.playback) await playbackChecks(page, result);
    if (profile.preference) await preferenceChecks(page, result);
    if (profile.name === 'width-375' || profile.name === 'width-1440') {
      const axe = await new AxeBuilder({ page }).include('#estudio').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const file = `${profile.name}-axe.json`;
      await writeFile(path.join(out, file), JSON.stringify(axe, null, 2));
      result.axe = { file, violations: axe.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })), incomplete: axe.incomplete.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })) };
      check(result, 'Hero accessibility scan has no reported violations', axe.violations.length === 0, result.axe);
    }
  } catch (error) {
    check(result, 'case completed', false, error.message);
    report.errors.push({ case: profile.name, error: error.stack ?? error.message });
    result.snapshots.failure = await snapshot(page).catch(() => null);
  } finally {
    check(result, 'no browser runtime errors', result.runtimeErrors.length === 0, result.runtimeErrors);
    check(result, 'requested movie assets have successful HTTP responses', result.responses.every(item => item.status === 200 || item.status === 206), result.responses);
    await context.close();
  }
}

try {
  await mkdir(out, { recursive: true });
  const { chromium } = requireProject('@playwright/test');
  AxeBuilder = requireProject('@axe-core/playwright').default;
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  if (executablePath && !existsSync(executablePath)) throw new Error(`Chrome not found: ${executablePath}`);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const profile of selected) await runCase(profile);
} catch (error) {
  report.errors.push({ error: error.stack ?? error.message });
  console.error(error.message);
} finally {
  await browser?.close();
  report.passed = report.errors.length === 0 && report.cases.length === selected.length && report.cases.every(result => result.checks.length && result.checks.every(item => item.status === 'pass'));
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Hero film: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(out, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
