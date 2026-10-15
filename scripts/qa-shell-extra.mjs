import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Independent functional checks. This never starts a server or changes site files.
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = workspace;
const requireProject = createRequire(path.join(project, 'package.json'));
const cases = ['fresh-mobile', 'fresh-desktop', 'fresh-mobile-menu', 'footer-mobile', 'footer-desktop', 'no-js-mobile', 'no-js-desktop'];
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-shell-extra.mjs [--phase F3] [--url http://127.0.0.1:3000] [--cases ' + cases.join(',') + '] [--out qa-results/F3/extra-shell]');
  console.log('Uses this project’s Playwright. CHROME_PATH is optional. Cases run sequentially in fresh contexts.');
  process.exit(0);
}
const selected = option('--cases', cases.join(',')).split(',').filter(Boolean);
assert.ok(selected.length && selected.every(name => cases.includes(name)), 'Unknown --cases value. See --help.');
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const phase = option('--phase', 'F3');
assert.ok(/^F(?:[0-9]|10)$/.test(phase), 'Use --phase F0 … F10.');
const out = path.resolve(workspace, option('--out', `qa-results/${phase}/extra-shell`));
const report = { phase, baseURL, createdAt: new Date().toISOString(), cases: selected, checks: [], screenshots: [], telemetry: {}, errors: [] };
let browser;

function verify(name, condition, detail) {
  let status = 'pass';
  try { assert.ok(condition, name); } catch { status = 'fail'; }
  report.checks.push({ name, status, detail });
  console.log(`${status.toUpperCase()} ${name}${detail === undefined ? '' : ': ' + JSON.stringify(detail)}`);
  return condition;
}
async function screenshot(page, name, immediate = false) {
  const filename = name + '.png';
  if (immediate) {
    // Capture the live intro without waiting for fonts until after its 800ms run.
    const session = await page.context().newCDPSession(page);
    try {
      const { data } = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(path.join(out, filename), Buffer.from(data, 'base64'));
    } finally { await session.detach(); }
  } else await page.screenshot({ path: path.join(out, filename), fullPage: false });
  report.screenshots.push(filename);
}
async function ready(page) {
  await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true', null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}
async function introFinished(page) {
  await page.waitForFunction(() => {
    const node = document.querySelector('.preloader');
    return !document.documentElement.classList.contains('do-intro') && document.documentElement.dataset.intro !== 'true' && (!node || getComputedStyle(node).display === 'none');
  }, null, { timeout: 4000 });
}
async function nativeScroll(page, y) {
  await page.evaluate(position => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.__lenis?.scrollTo(position, { immediate: true, force: true });
    window.scrollTo({ top: position, behavior: 'instant' });
  }, y);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function bottom(page) {
  await nativeScroll(page, await page.evaluate(() => document.documentElement.scrollHeight));
  await page.waitForFunction(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 3, null, { timeout: 6000 });
}

// Observe actual bootstrap and hydrated states; storage stays empty in fresh cases.
// The lightweight recorder ends after four seconds and never alters production UI.
function installRecorder() {
  const log = window.__shellQA = { intro: [], shifts: [], curtain: [], firstInput: null };
  const input = () => { log.firstInput ??= performance.now(); };
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(type, input, { once: true, capture: true, passive: true });
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const sources = (entry.sources ?? []).map(source => {
          const node = source.node;
          return { selector: node instanceof Element ? [node.tagName.toLowerCase(), node.id ? '#' + node.id : '', ...Array.from(node.classList).map(c => '.' + c)].join('') : null, footer: node instanceof Element && Boolean(node.closest('.site-footer, .footer-sentinel')) };
        });
        log.shifts.push({ at: entry.startTime, value: entry.value, recentInput: entry.hadRecentInput, sources });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* The report explicitly checks observer support. */ }
  log.layoutShiftSupported = PerformanceObserver.supportedEntryTypes.includes('layout-shift');
  let previous = '';
  let previousCurtain = '';
  function sample() {
    const html = document.documentElement;
    const loader = document.querySelector('.preloader');
    const state = { at: performance.now(), tier: html?.dataset.motionTier, ready: html?.dataset.motionReady, visible: Boolean(loader && getComputedStyle(loader).display !== 'none' && getComputedStyle(loader).visibility !== 'hidden'), role: loader?.getAttribute('role'), modal: loader?.getAttribute('aria-modal'), activeInLoader: Boolean(loader?.contains(document.activeElement)), htmlOverflow: html?.style.overflow, bodyOverflow: document.body?.style.overflow, mainInert: document.querySelector('main')?.inert, footerInert: document.querySelector('footer')?.inert, navInert: document.querySelector('.site-nav')?.inert, scrollY };
    const signature = JSON.stringify({ ...state, at: 0 });
    if (signature !== previous) { log.intro.push(state); previous = signature; }
    const shell = document.querySelector('.site-shell');
    const curtain = shell?.dataset.footerCurtain ?? null;
    if (curtain !== previousCurtain && shell) {
      const footer = document.querySelector('footer');
      log.curtain.push({ at: performance.now(), active: curtain, scrollHeight: html.scrollHeight, footerHeight: footer?.getBoundingClientRect().height });
      previousCurtain = curtain;
    }
    if (performance.now() < 4000) requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}

async function freshIntro(page, width) {
  const mobile = width === 375;
  const key = mobile ? 'fresh-mobile' : 'fresh-desktop';
  const response = await page.goto(baseURL, { waitUntil: 'commit', timeout: 30000 });
  verify(`${key}: http`, Boolean(response?.ok()), response?.status());
  await page.locator('main h1').waitFor({ state: 'visible', timeout: 15000 });
  const cinematic = await page.locator('section#estudio[data-hero-variant="film"]').count() > 0;
  if (cinematic) {
    await freshFilm(page, key);
    return;
  }
  const active = await page.waitForFunction(() => {
    const loader = document.querySelector('.preloader');
    return loader && getComputedStyle(loader).display !== 'none' && document.documentElement.dataset.intro === 'true';
  }, null, { timeout: 2500 }).then(() => true).catch(() => false);
  verify(`${key}: intro appears on first visit`, active);
  if (!active) { await ready(page); return; }
  const initial = await page.locator('.preloader').evaluate(node => ({ role: node.getAttribute('role'), modal: node.getAttribute('aria-modal'), focused: node.contains(document.activeElement), tier: document.documentElement.dataset.motionTier, scrollY, overflow: document.documentElement.style.overflow, mainInert: document.querySelector('main')?.inert, navInert: document.querySelector('.site-nav')?.inert }));
  verify(`${key}: accessible role`, initial.role === (mobile ? 'status' : 'dialog') && (mobile ? initial.modal !== 'true' : initial.modal === 'true'), initial);
  verify(`${key}: role exposed to accessibility tree`, await page.getByRole(mobile ? 'status' : 'dialog', { name: 'DOS ORILLAS', exact: true }).count() === 1);

  if (mobile) {
    verify(`${key}: content remains usable`, !initial.mainInert && !initial.navInert && !['clip', 'hidden'].includes(initial.overflow) && !initial.focused, initial);
    await page.keyboard.press('Tab');
    verify(`${key}: Tab does not enter a focus trap`, await page.evaluate(() => !document.querySelector('.preloader')?.contains(document.activeElement)), await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 240)));
    await page.mouse.move(120, 220);
    await page.mouse.wheel(0, 260);
    const scrolledDuringIntro = await page.waitForFunction(() => window.__shellQA.intro.some(state => state.visible && state.scrollY > 20), null, { timeout: 1200 }).then(() => true).catch(() => false);
    verify(`${key}: real wheel scroll works during intro`, scrolledDuringIntro, await page.evaluate(() => ({ scrollY, states: window.__shellQA.intro.filter(state => state.visible).map(state => ({ at: state.at, scrollY: state.scrollY })) })));
    await screenshot(page, key + '-intro-input', true);
    await introFinished(page);
  } else {
    verify(`${key}: modal receives focus`, initial.focused, initial);
    await page.locator('.preloader-skip').focus();
    let trapped = true;
    for (const direction of ['Tab', 'Shift+Tab']) {
      await page.keyboard.press(direction);
      trapped &&= await page.evaluate(() => document.querySelector('.preloader')?.contains(document.activeElement));
    }
    verify(`${key}: Tab and Shift+Tab remain in modal`, trapped);
    const inert = await page.evaluate(() => ({ main: document.querySelector('main')?.inert, nav: document.querySelector('.site-nav')?.inert, overflow: document.documentElement.style.overflow }));
    verify(`${key}: underlying document is inert while open`, inert.main && inert.nav && inert.overflow === 'clip', inert);
    await screenshot(page, key + '-intro-input', true);
    await page.keyboard.press('Escape');
    await introFinished(page);
    await ready(page);
    const restored = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const curtain = document.querySelector('.site-shell')?.dataset.footerCurtain === 'true';
      return { mainInert: document.querySelector('main')?.inert, navInert: document.querySelector('.site-nav')?.inert, footerInert: footer?.inert, footerExpectedInert: curtain && footer?.dataset.visible === 'false', overflow: document.documentElement.style.overflow, activeInLoader: document.querySelector('.preloader')?.contains(document.activeElement), intro: document.documentElement.dataset.intro };
    });
    verify(`${key}: Escape restores document and releases focus`, !restored.mainInert && !restored.navInert && !restored.overflow && !restored.activeInLoader && restored.intro !== 'true', restored);
    verify(`${key}: Escape preserves footer accessibility state`, restored.footerInert === restored.footerExpectedInert, restored);
  }
  await ready(page);
  const telemetry = await page.evaluate(() => window.__shellQA);
  report.telemetry[key] = telemetry;
  const states = telemetry.intro.filter(state => state.visible);
  verify(`${key}: no body overflow lock`, states.every(state => state.bodyOverflow !== 'hidden'), states.map(({ at, bodyOverflow }) => ({ at, bodyOverflow })));
  if (mobile) verify(`${key}: no transient mobile modality`, states.every(state => state.role === 'status' && state.modal !== 'true' && !state.mainInert && !state.footerInert && !state.navInert && !['hidden', 'clip'].includes(state.htmlOverflow)), states);
  verify(`${key}: intro remembered for this session`, await page.evaluate(() => sessionStorage.getItem('do-intro')) === '1');
  await screenshot(page, key + '-after-intro');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await ready(page);
  verify(`${key}: second visit omits intro`, await page.evaluate(() => !window.__shellQA.intro.some(state => state.visible) && !document.documentElement.classList.contains('do-intro')));
}

async function freshFilm(page, key) {
  await ready(page);
  const before = await page.evaluate(() => {
    const hero = document.querySelector('#estudio[data-hero-variant="film"]');
    const shell = hero?.querySelector('.hero-film-shell,.film-shell');
    const loader = document.querySelector('.preloader');
    return { film: Boolean(hero), top: hero?.getBoundingClientRect().top, scrollY,
      shellPosition: shell ? getComputedStyle(shell).position : null,
      pinned: Boolean(hero?.closest('.pin-spacer')), intro: document.documentElement.dataset.intro,
      introClass: document.documentElement.classList.contains('do-intro'),
      loaderVisible: Boolean(loader && getComputedStyle(loader).display !== 'none'),
      mainInert: document.querySelector('main')?.inert, navInert: document.querySelector('.site-nav')?.inert,
      overflow: document.documentElement.style.overflow, bodyOverflow: document.body.style.overflow };
  });
  verify(`${key}: film starts with no blocking intro`, before.film && before.intro !== 'true' && !before.introClass && !before.loaderVisible && !before.mainInert && !before.navInert && !['clip', 'hidden'].includes(before.overflow) && before.bodyOverflow !== 'hidden', before);
  verify(`${key}: film shell keeps normal document flow`, !before.pinned && before.shellPosition !== null && !['fixed', 'sticky'].includes(before.shellPosition), before);
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, keyboard: document.activeElement instanceof Element && document.activeElement.matches(':focus-visible'), inLoader: Boolean(document.querySelector('.preloader')?.contains(document.activeElement)) }));
  verify(`${key}: real Tab remains free of an intro focus trap`, focus.tag !== 'BODY' && focus.keyboard && !focus.inLoader, focus);
  await page.mouse.move(120, 220);
  await page.mouse.wheel(0, 260);
  const moved = await page.waitForFunction(y => scrollY > y + 20, before.scrollY, { timeout: 1500, polling: 50 }).then(() => true).catch(() => false);
  const after = await page.evaluate(() => ({ scrollY, top: document.getElementById('estudio').getBoundingClientRect().top, pinned: Boolean(document.getElementById('estudio').closest('.pin-spacer')) }));
  verify(`${key}: real wheel moves the film without a pin`, moved && !after.pinned && after.top < before.top - 10, { before, after });
  const telemetry = await page.evaluate(() => window.__shellQA);
  report.telemetry[key] = { heroVariant: 'film', ...telemetry, before, after, focus };
  verify(`${key}: film has no transient intro modality`, telemetry.intro.every(state => !state.visible && !state.mainInert && !state.navInert && !['clip', 'hidden'].includes(state.htmlOverflow) && state.bodyOverflow !== 'hidden'), telemetry.intro);
  await screenshot(page, key + '-film-input');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await ready(page);
  verify(`${key}: second film visit remains free of an intro`, await page.evaluate(() => !window.__shellQA.intro.some(state => state.visible) && !document.documentElement.classList.contains('do-intro') && document.documentElement.dataset.intro !== 'true'));
}

async function menuDuringIntro(page) {
  const key = 'fresh-mobile-menu';
  await page.goto(baseURL, { waitUntil: 'commit', timeout: 30000 });
  await page.locator('main h1').waitFor({ state: 'visible', timeout: 15000 });
  const cinematic = await page.locator('section#estudio[data-hero-variant="film"]').count() > 0;
  if (cinematic) {
    await ready(page);
    verify(`${key}: film is usable before opening the menu`, await page.evaluate(() => !document.documentElement.classList.contains('do-intro') && document.documentElement.dataset.intro !== 'true' && !document.querySelector('main')?.inert && !['hidden', 'clip'].includes(document.documentElement.style.overflow)));
  } else await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true' && document.documentElement.dataset.intro === 'true' && getComputedStyle(document.querySelector('.preloader')).display !== 'none', null, { timeout: 2500 });
  const opener = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await opener.click();
  await page.locator('#mobile-navigation').waitFor({ state: 'visible', timeout: 3000 });
  verify(`${key}: menu really opened ${cinematic ? 'over the film' : 'while intro was active'}`, await page.evaluate(film => (film ? document.documentElement.dataset.intro !== 'true' : document.documentElement.dataset.intro === 'true') && document.querySelector('#mobile-navigation').open, cinematic));
  if (cinematic) await page.waitForTimeout(900);
  else await introFinished(page);
  const active = await page.evaluate(() => ({ open: document.querySelector('#mobile-navigation')?.open, menuFlag: document.documentElement.dataset.menuOpen, overflow: document.documentElement.style.overflow, mainInert: document.querySelector('main')?.inert, footerInert: document.querySelector('footer')?.inert, focusedInMenu: document.querySelector('#mobile-navigation')?.contains(document.activeElement), lenisStopped: !window.__lenis || window.__lenis.isStopped }));
  verify(`${key}: ${cinematic ? 'film loading' : 'intro completion'} preserves the open menu lock`, active.open && active.menuFlag === 'true' && active.overflow === 'clip' && active.mainInert && active.footerInert && active.focusedInMenu && active.lenisStopped, active);
  const dialog = page.locator('#mobile-navigation');
  const count = await dialog.locator('a[href],button:not([disabled])').count();
  let trapped = count > 0;
  for (let at = 0; at < count + 1; at += 1) {
    await page.keyboard.press('Tab');
    trapped &&= await dialog.evaluate(node => node.contains(document.activeElement));
  }
  await page.keyboard.press('Shift+Tab');
  trapped &&= await dialog.evaluate(node => node.contains(document.activeElement));
  verify(`${key}: menu focus trap survives ${cinematic ? 'film loading' : 'intro completion'}`, trapped, { focusableCount: count });
  await screenshot(page, key + (cinematic ? '-over-film' : '-after-intro'));
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden', timeout: 3000 });
  const restored = await page.evaluate(() => ({ menuFlag: document.documentElement.dataset.menuOpen, overflow: document.documentElement.style.overflow, mainInert: document.querySelector('main')?.inert, footerInert: document.querySelector('footer')?.inert, focusedOpener: document.querySelector('.menu-toggle') === document.activeElement }));
  verify(`${key}: Escape restores scrolling, inert and opener focus`, restored.menuFlag !== 'true' && !restored.overflow && !restored.mainInert && !restored.footerInert && restored.focusedOpener, restored);
  report.telemetry[key] = { heroVariant: cinematic ? 'film' : 'legacy', ...await page.evaluate(() => window.__shellQA), active, restored };
}

async function footerState(page) {
  return page.evaluate(() => {
    const footer = Array.from(document.querySelectorAll('.site-footer')).find(node => node.getClientRects().length > 0) ?? document.querySelector('#footer');
    const shell = document.querySelector('.site-shell');
    const frame = footer?.querySelector('.footer-wordmark-frame');
    const image = frame?.querySelector('img.footer-wordmark');
    const box = image?.getBoundingClientRect();
    const centerX = box ? Math.max(0, Math.min(innerWidth - 1, box.x + box.width / 2)) : 0;
    const centerY = box ? Math.max(0, Math.min(innerHeight - 1, box.y + box.height / 2)) : 0;
    const hit = box ? document.elementFromPoint(centerX, centerY) : null;
    return { tier: document.documentElement.dataset.motionTier, curtain: shell?.dataset.footerCurtain, visible: footer?.dataset.visible, inert: footer?.inert, position: footer ? getComputedStyle(footer).position : null, footerHeight: footer?.getBoundingClientRect().height, reservedHeight: parseFloat(shell?.style.getPropertyValue('--footer-height') ?? '0') || 0, frameHeight: frame?.getBoundingClientRect().height, imageLoaded: Boolean(image?.complete && image.naturalWidth > 0), imageSource: image?.getAttribute('src'), opacity: image ? Number(getComputedStyle(image).opacity) : 0, intersectsViewport: Boolean(box && box.bottom > 0 && box.top < innerHeight && box.width > 100 && box.height > 40), uncovered: Boolean(frame && hit && frame.contains(hit)), viewportHeight: innerHeight, scrollHeight: document.documentElement.scrollHeight, scrollY };
  });
}
async function waitWordmark(page, appJS = true) {
  if (!appJS) {
    assert.ok(await page.locator('footer:visible .footer-wordmark-frame img.footer-wordmark').evaluate(image => image.complete && image.naturalWidth > 0), 'SSR wordmark did not load');
    return;
  }
  await page.waitForFunction(() => {
    const image = document.querySelector('.footer-wordmark-frame img.footer-wordmark');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  }, null, { timeout: 10000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function showWordmark(page) {
  if (await page.locator('.site-shell').getAttribute('data-footer-curtain') === 'true') await bottom(page);
  else await page.locator('.footer-wordmark-frame').scrollIntoViewIfNeeded();
  await waitWordmark(page);
}
async function footerChecks(page, width, wordmarkRequests) {
  const key = width === 375 ? 'footer-mobile' : 'footer-desktop';
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await ready(page);
  await introFinished(page);
  await page.waitForFunction(() => Boolean(document.querySelector('.site-shell')?.dataset.footerCurtain), null, { timeout: 6000 });
  const initial = await footerState(page);
  if (width === 1440) verify(`${key}: hidden wordmark does not fetch before arrival`, wordmarkRequests.length === 0 && !initial.imageLoaded, { requests: [...wordmarkRequests], initial });
  verify(`${key}: correct curtain eligibility`, initial.curtain === (width >= 1024 && initial.tier === '2' && initial.footerHeight <= initial.viewportHeight * .94 ? 'true' : 'false'), initial);
  if (initial.curtain === 'true') {
    verify(`${key}: hidden curtain is inaccessible before arrival`, initial.position === 'fixed' && initial.visible === 'false' && initial.inert, initial);
    verify(`${key}: reserved height equals real footer`, Math.abs(initial.reservedHeight - initial.footerHeight) <= 1, initial);
  } else verify(`${key}: footer stays in ordinary flow`, initial.position === 'relative' && !initial.inert, initial);
  const initialTelemetry = await page.evaluate(() => window.__shellQA);
  const shifts = initialTelemetry.shifts.filter(entry => !entry.recentInput && (initialTelemetry.firstInput === null || entry.at < initialTelemetry.firstInput));
  const cls = shifts.reduce((total, entry) => total + entry.value, 0);
  const footerCLS = shifts.filter(entry => entry.sources.some(source => source.footer)).reduce((total, entry) => total + entry.value, 0);
  verify(`${key}: layout-shift observer supported`, initialTelemetry.layoutShiftSupported);
  verify(`${key}: curtain creates no initial footer CLS`, footerCLS <= .001, { footerCLS, totalCLS: cls, shifts, curtainTransitions: initialTelemetry.curtain });
  verify(`${key}: initial CLS meets .03 target`, cls <= .03, { cls });

  await showWordmark(page);
  const shown = await footerState(page);
  if (width === 1440) verify(`${key}: approaching footer requests the wordmark`, wordmarkRequests.length >= 1, [...wordmarkRequests]);
  verify(`${key}: official wordmark is loaded and exposed`, shown.imageLoaded && /\/brand\/logo-light\.svg$/.test(shown.imageSource ?? '') && shown.opacity > .1 && shown.intersectsViewport && shown.uncovered && !shown.inert, shown);
  verify(`${key}: loading logo preserves reserved box`, Math.abs(shown.frameHeight - initial.frameHeight) <= 1, { before: initial.frameHeight, after: shown.frameHeight });
  await screenshot(page, key + '-wordmark');
  if (shown.curtain === 'true') {
    await nativeScroll(page, 0);
    await page.waitForFunction(() => document.querySelector('.site-footer')?.dataset.visible === 'false', null, { timeout: 3000 });
    const hidden = await footerState(page);
    verify(`${key}: leaving footer hides and inerts curtain again`, hidden.inert && hidden.visible === 'false', hidden);
    await bottom(page);
    await page.waitForFunction(() => document.querySelector('.site-footer')?.inert === false, null, { timeout: 3000 });
  }

  const toggle = page.locator('.motion-toggle');
  verify(`${key}: motion toggle has a 44px target`, await toggle.evaluate(node => node.getBoundingClientRect().height >= 44));
  await toggle.click();
  await page.waitForFunction(() => document.documentElement.dataset.motionTier === '0' && !window.__lenis && !document.querySelector('.pin-spacer'), null, { timeout: 10000 });
  const reduced = await page.evaluate(() => ({ tier: document.documentElement.dataset.motionTier, curtain: document.querySelector('.site-shell')?.dataset.footerCurtain, reservedHeight: document.querySelector('.site-shell')?.style.getPropertyValue('--footer-height') ?? '', footerInert: document.querySelector('.site-footer')?.inert, footerVisibility: getComputedStyle(document.querySelector('.site-footer')).visibility, footerPosition: getComputedStyle(document.querySelector('.site-footer')).position, lenis: Boolean(window.__lenis), triggers: window.__stCount ?? 0, pins: document.querySelectorAll('.pin-spacer').length, pressed: document.querySelector('.motion-toggle')?.getAttribute('aria-pressed'), storage: localStorage.getItem('dos-orillas:motion'), loaderVisible: Boolean(document.querySelector('.preloader') && getComputedStyle(document.querySelector('.preloader')).display !== 'none'), cursorVisible: Boolean(document.querySelector('.custom-cursor') && getComputedStyle(document.querySelector('.custom-cursor')).display !== 'none') }));
  verify(`${key}: reducing motion cleans enhancement state`, reduced.tier === '0' && reduced.curtain === 'false' && !reduced.lenis && reduced.triggers === 0 && reduced.pins === 0 && !reduced.reservedHeight && !reduced.footerInert && reduced.footerVisibility === 'visible' && reduced.footerPosition === 'relative' && !reduced.loaderVisible && !reduced.cursorVisible, reduced);
  verify(`${key}: toggle exposes and persists preference`, reduced.pressed === 'true' && reduced.storage === 'reduce', reduced);
  await showWordmark(page);
  const staticWordmark = await footerState(page);
  verify(`${key}: reduced footer keeps its visible logo`, staticWordmark.imageLoaded && staticWordmark.intersectsViewport && staticWordmark.uncovered && staticWordmark.opacity >= .95, staticWordmark);
  await screenshot(page, key + '-reduced');
  await toggle.click();
  await page.waitForFunction(() => ['1', '2'].includes(document.documentElement.dataset.motionTier) && document.querySelector('.motion-toggle')?.getAttribute('aria-pressed') === 'false', null, { timeout: 10000 });
  verify(`${key}: enabling motion removes reduced preference`, await page.evaluate(() => localStorage.getItem('dos-orillas:motion') === 'full'));
  await showWordmark(page);
  const restored = await footerState(page);
  verify(`${key}: footer remains accessible after re-enabling motion`, restored.imageLoaded && !restored.inert && restored.intersectsViewport && restored.uncovered, restored);
  report.telemetry[key] = { initial: initialTelemetry, shown, reduced, restored, wordmarkRequests };
}

async function noJSChecks(page, width) {
  const key = width === 375 ? 'no-js-mobile' : 'no-js-desktop';
  await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
  verify(`${key}: no app enhancement has run`, await page.evaluate(() => !document.documentElement.dataset.motionReady && !window.__lenis && document.documentElement.dataset.motionTier === '0'));
  const navigation = await page.locator('header a[href^="#"], noscript nav a[href^="#"]').evaluateAll(links => links.map(link => {
    const box = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    return { href: link.getAttribute('href'), label: link.textContent.trim(), visible: box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none', withinWidth: box.left >= 0 && box.right <= innerWidth, target: Boolean(document.querySelector(link.getAttribute('href'))) };
  }));
  const usable = navigation.filter(link => link.visible && link.withinWidth && link.target);
  verify(`${key}: main navigation links remain visible and usable`, new Set(usable.map(link => link.href)).size >= 5, navigation);
  if (width === 375) {
    const visibleJSControls = await page.locator('.menu-toggle,.motion-toggle,.mobile-menu-close,.preloader-skip').evaluateAll(nodes => nodes.filter(node => {
      const style = getComputedStyle(node);
      return node.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }).map(node => ({ className: node.className, label: node.getAttribute('aria-label') ?? node.textContent.trim() })));
    verify(`${key}: controls that require JS are hidden`, visibleJSControls.length === 0, visibleJSControls);
  }
  await screenshot(page, key + '-navigation');
  const destination = usable.find(link => link.href === '#contacto') ?? usable[0];
  if (destination) {
    const link = page.locator('header a[href^="#"]:visible, noscript nav a[href^="#"]:visible').filter({ hasText: destination.label }).first();
    await link.click();
    await page.waitForURL(url => url.hash === destination.href, { timeout: 3000 });
    const targetBox = await page.locator(destination.href).evaluate(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom, viewport: innerHeight }));
    verify(`${key}: native navigation actually reaches its section`, targetBox.bottom > 0 && targetBox.top < targetBox.viewport, { href: destination.href, ...targetBox });
  } else verify(`${key}: native navigation actually reaches its section`, false, 'No visible navigation link can be activated.');
  const readableFooter = page.locator('footer:visible');
  const readableWordmark = readableFooter.locator('.footer-wordmark-frame');
  await readableWordmark.locator('img.footer-wordmark').waitFor({ state: 'attached', timeout: 10000 });
  await readableWordmark.waitFor({ state: 'visible', timeout: 3000 });
  await readableWordmark.scrollIntoViewIfNeeded();
  await waitWordmark(page, false);
  const state = await footerState(page);
  verify(`${key}: SSR noscript logo is visible without app JS`, state.imageLoaded && /\/brand\/logo-light\.svg$/.test(state.imageSource ?? '') && state.opacity >= .95 && state.intersectsViewport && state.uncovered && !state.inert && state.position === 'relative', state);
  verify(`${key}: meaningful footer navigation survives`, await readableFooter.locator('nav a[href]').count() >= 4 && await readableFooter.locator('a[href^="mailto:"]').count() === 1);
  await screenshot(page, key + '-wordmark');
  const beforeBackToTop = await page.evaluate(() => scrollY);
  await readableFooter.locator('.back-to-top').click();
  await page.waitForURL(url => url.hash === '#main-content', { timeout: 3000 });
  const returned = await page.evaluate(() => {
    const main = document.getElementById('main-content').getBoundingClientRect();
    const title = document.querySelector('main h1').getBoundingClientRect();
    return { scrollY, viewport: innerHeight, mainTop: main.top, titleTop: title.top, titleBottom: title.bottom, titleWidth: title.width };
  });
  // Native anchors may preserve scroll-margin or an in-flow mobile header.
  // Check that the beginning of main and its title are reached and exposed.
  verify(`${key}: back-to-top anchor works without JS`, returned.scrollY < beforeBackToTop && returned.mainTop >= -2 && returned.mainTop < returned.viewport / 2 && returned.titleBottom > 0 && returned.titleTop < returned.viewport && returned.titleWidth > 0, { beforeScrollY: beforeBackToTop, ...returned });
}

async function navThresholdChecks(page, key) {
  for (const [y, condensed] of [[0, 'false'], [81, 'true'], [0, 'false'], [240, 'true']]) {
    await nativeScroll(page, y);
    const correct = await page.waitForFunction(value => document.querySelector('.site-nav')?.dataset.condensed === value, condensed, { timeout: 3000 }).then(() => true).catch(() => false);
    verify(`${key}: navigation threshold at ${y}px`, correct, await page.evaluate(() => ({ scrollY, condensed: document.querySelector('.site-nav')?.dataset.condensed })));
  }
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
  await ready(page);
  const restored = await page.waitForFunction(() => scrollY > 80 && document.querySelector('.site-nav')?.dataset.condensed === 'true', null, { timeout: 3000 }).then(() => true).catch(() => false);
  verify(`${key}: navigation follows restored scroll on reload`, restored, await page.evaluate(() => ({ scrollY, condensed: document.querySelector('.site-nav')?.dataset.condensed })));
  await nativeScroll(page, 0);
  verify(`${key}: navigation expands after returning to top`, await page.waitForFunction(() => document.querySelector('.site-nav')?.dataset.condensed === 'false', null, { timeout: 3000 }).then(() => true).catch(() => false));
}

async function runCase(name) {
  const width = name.includes('mobile') ? 375 : 1440;
  const js = !name.startsWith('no-js');
  const context = await browser.newContext({ viewport: { width, height: width === 375 ? 667 : 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', javaScriptEnabled: js });
  const page = await context.newPage();
  const consoleErrors = [];
  const wordmarkRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/brand/logo-light.svg') wordmarkRequests.push({ url: request.url(), at: Date.now() }); });
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  if (js) await context.addInitScript(installRecorder);
  // Isolate footer geometry from intro effects; fresh cases intentionally never set this key.
  if (name.startsWith('footer')) await context.addInitScript(() => sessionStorage.setItem('do-intro', '1'));
  let deadline;
  try {
    const execution = name === 'fresh-mobile-menu' ? menuDuringIntro(page) : name.startsWith('fresh') ? freshIntro(page, width) : name.startsWith('footer') ? footerChecks(page, width, wordmarkRequests) : noJSChecks(page, width);
    const checks = async () => {
      await execution;
      if (name === 'fresh-mobile' || name === 'fresh-desktop') await navThresholdChecks(page, name);
    };
    await Promise.race([checks(), new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('Case exceeded 30 seconds')), 30000); })]);
  } catch (error) {
    verify(`${name}: completed`, false, error.message);
    report.errors.push({ case: name, error: error.stack ?? error.message });
    await screenshot(page, name + '-failure').catch(() => {});
    if (js) report.telemetry[name] ??= await page.evaluate(() => window.__shellQA).catch(() => null);
  } finally {
    clearTimeout(deadline);
    verify(`${name}: no runtime errors`, consoleErrors.length === 0, consoleErrors);
    await context.close();
  }
}

try {
  await mkdir(out, { recursive: true });
  const { chromium } = requireProject('@playwright/test');
  const windowsChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : existsSync(windowsChrome) ? windowsChrome : undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const name of selected) await runCase(name);
} catch (error) {
  verify('harness', false, error.message);
  report.errors.push({ error: error.stack ?? error.message });
} finally {
  await browser?.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.status === 'pass');
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Shell extra: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(out, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
