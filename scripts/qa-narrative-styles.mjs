import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Install under repo/scripts before running. This only tests an existing server.
// Six sequential contexts; never execute alongside Lighthouse or other browser QA.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(project, 'package.json'));
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
const names = ['fresh-click-1200', 'fresh-tab-2500', 'first-hash', 'history', 'no-js', 'reduced'];
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-narrative-styles.mjs [--url http://127.0.0.1:3000] [--cases ' + names.join(',') + '] [--out qa-results/F4/styles]');
  console.log('Real CSS responses are held; genuine click/Tab/native anchors are exercised. No app edits, email sends, CSS overrides, RAF loop, or server startup.');
  process.exit(0);
}
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const selected = option('--cases', names.join(',')).split(',').filter(Boolean);
if (!selected.length || selected.some(name => !names.includes(name))) throw new Error('Unknown --cases. See --help.');
const out = path.resolve(project, option('--out', 'qa-results/F4/styles'));
const report = {
  phase: 'F4', baseURL, createdAt: new Date().toISOString(), browser: null,
  scope: 'External narrative CSS delivery, early native anchors/keyboard, initial hash, restoration and static fallbacks',
  viewport: { width: 375, height: 812 }, cases: [], errors: [], passed: false,
};
let browser;

function check(result, name, condition, detail) {
  const passed = Boolean(condition);
  result.checks.push({ name, status: passed ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${result.name}: ${name}${detail === undefined ? '' : ': ' + JSON.stringify(detail)}`);
  return passed;
}

function installRecorder() {
  const state = window.__narrativeStylesQA = { events: [], sequence: 0, errorDetails: [] };
  const record = (kind, extra = {}) => {
    if (state.events.length >= 200) return;
    const root = document.documentElement;
    const link = document.getElementById('dos-orillas-narrative-css');
    state.events.push({
      sequence: ++state.sequence, atMs: performance.now(), kind,
      cssState: root?.dataset.narrativeCss ?? null,
      cssLoaded: root?.dataset.narrativeCssLoaded ?? null,
      media: link?.getAttribute('media') ?? null,
      sheetExists: Boolean(link?.sheet), motionReady: root?.dataset.motionReady ?? null,
      ...extra,
    });
  };
  new MutationObserver(records => {
    for (const item of records) {
      const textParent = item.target instanceof Element ? item.target : item.target.parentElement;
      const region = textParent?.closest('.motion-toggle,.scroll-progress-label,.footer-clock,.preloader-connected,.preloader-skip');
      if (region && (item.type === 'characterData' || item.type === 'childList')) {
        record('dynamic-text', { region: region.className, old: item.type === 'characterData' ? item.oldValue : Array.from(item.removedNodes).map(node => node.textContent ?? '').join('').slice(0, 240), value: region.textContent?.slice(0, 240) ?? null });
      }
      if (!(item.target instanceof Element)) continue;
      if (item.type === 'childList') {
        if (Array.from(item.addedNodes).some(node => node instanceof Element && (node.id === 'dos-orillas-narrative-css' || node.querySelector?.('#dos-orillas-narrative-css')))) record('sheet-inserted');
      } else if (item.target === document.documentElement || item.target.id === 'dos-orillas-narrative-css') {
        record('attribute', { attribute: item.attributeName, old: item.oldValue, value: item.target.getAttribute(item.attributeName) });
      }
    }
  }).observe(document, {
    subtree: true, childList: true, attributes: true, attributeOldValue: true,
    characterData: true, characterDataOldValue: true,
    attributeFilter: ['media', 'data-narrative-css', 'data-narrative-css-loaded', 'data-motion-ready'],
  });
  window.addEventListener('error', event => {
    const error = event.error;
    const detail = {
      atMs: performance.now(), message: event.message, filename: event.filename,
      line: event.lineno, column: event.colno, name: error?.name ?? null,
      stack: error?.stack ?? null, ownKeys: error ? Object.getOwnPropertyNames(error) : [],
      componentStack: typeof error?.componentStack === 'string' ? error.componentStack : null,
      cause: error?.cause ? { name: error.cause.name ?? null, message: error.cause.message ?? String(error.cause), stack: error.cause.stack ?? null } : null,
      motionTier: document.documentElement.dataset.motionTier,
      motionReady: document.documentElement.dataset.motionReady ?? null,
      texts: ['.motion-toggle', '.scroll-progress-label', '.footer-clock time', '.preloader-connected'].map(selector => ({ selector, text: document.querySelector(selector)?.textContent ?? null })),
    };
    state.errorDetails.push(detail);
    record('window-error', detail);
    // Never preventDefault, filter, or reinterpret a recoverable React error.
  }, true);
  document.addEventListener('load', event => {
    if (event.target instanceof HTMLLinkElement && event.target.href.includes('/styles/narrative.css')) record('css-load');
  }, true);
  window.addEventListener('pageshow', event => record('pageshow', { persisted: event.persisted }), true);
  for (const type of ['pointerdown', 'keydown', 'wheel']) window.addEventListener(type, event => {
    record(type, { key: event.key ?? null, deltaY: event.deltaY ?? null, target: event.target instanceof Element ? event.target.tagName : null });
  }, true);
  window.addEventListener('scroll', () => record('scroll', { y: scrollY }), { passive: true });
  // Attribute notifications never read layout. These two geometry samples are
  // deliberately confined to the genuine contact click, to expose the exact
  // pre/post React delegation state while a stylesheet response is still held.
  for (const capture of [true, false]) document.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || anchor.getAttribute('href') !== '#contacto') return;
    const target = document.getElementById('contacto');
    const box = target?.getBoundingClientRect();
    record(capture ? 'contact-click-capture' : 'contact-click-bubble', {
      targetTop: box?.top ?? null, targetDocumentTop: box ? box.top + scrollY : null,
      targetHeight: box?.height ?? null, hash: location.hash,
      manifestoReady: document.getElementById('manifiesto')?.dataset.narrativeLayoutReady ?? null,
      solutionsReady: document.getElementById('soluciones')?.dataset.narrativeLayoutReady ?? null,
      processReady: document.getElementById('proceso')?.dataset.narrativeLayoutReady ?? null,
    });
  }, capture);
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) record('paint', { name: entry.name, startTime: entry.startTime });
    }).observe({ type: 'paint', buffered: true });
  } catch { record('paint-observer-unavailable'); }
}

async function snapshot(page) {
  return page.evaluate(() => {
    const css = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      return { fontSize: parseFloat(style.fontSize), fontFamily: style.fontFamily, display: style.display, color: style.color, background: style.backgroundColor, contentVisibility: style.contentVisibility };
    };
    const root = document.documentElement;
    const links = Array.from(document.querySelectorAll('link[href*="/styles/narrative.css"]')).map(link => ({ id: link.id || null, media: link.media, sheetExists: Boolean(link.sheet), href: link.getAttribute('href'), parent: link.parentElement?.tagName ?? null, parentId: link.parentElement?.id || null, inNoscript: Boolean(link.closest('noscript')) }));
    const active = document.activeElement;
    const box = active instanceof Element ? active.getBoundingClientRect() : null;
    return {
      atMs: performance.now(), href: location.href, hash: location.hash,
      navigationType: performance.getEntriesByType('navigation')[0]?.type ?? null,
      cssState: root.dataset.narrativeCss ?? null, cssLoaded: root.dataset.narrativeCssLoaded ?? null,
      motionReady: root.dataset.motionReady ?? null, tier: root.dataset.motionTier,
      links, overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - innerWidth,
      manifesto: css('.manifesto-statement'), manifestoStage: css('.manifesto-first-stage'),
      solutionsTitle: css('.solutions-header h2'), trigger: css('.solutions-trigger'),
      process: css('#proceso'), processNumber: css('.process-step-number'),
      roots: ['manifiesto', 'soluciones', 'proceso'].map(id => ({ id, ...css('#' + id) })),
      active: { tag: active?.tagName ?? null, href: active?.getAttribute('href') ?? null, heroContact: active?.matches('.hero-primary[href="#contacto"]') ?? false,
        focusVisible: active instanceof Element && active.matches(':focus-visible'),
        bounds: box ? { top: box.top, bottom: box.bottom, width: box.width, height: box.height } : null,
        transform: active instanceof Element ? getComputedStyle(active).transform : null,
        visible: Boolean(box && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight) },
      events: window.__narrativeStylesQA?.events ?? null,
      errorDetails: window.__narrativeStylesQA?.errorDetails ?? null,
      noscriptNodes: Array.from(document.querySelectorAll('noscript')).slice(0, 5).map(element => ({ firstChildName: element.firstChild?.nodeName ?? null, firstChildType: element.firstChild?.nodeType ?? null, html: element.innerHTML.slice(0, 160) })),
    };
  });
}

function canonicalStyles(state) {
  // Concrete baseline values from the unchanged mobile canonical rules, not
  // comparisons against another rendering of this implementation.
  return Boolean(state.manifesto?.fontFamily.includes('display') && Math.abs(state.manifesto.fontSize - 46) < .3
    && state.manifestoStage?.display === 'block'
    && state.solutionsTitle?.fontFamily.includes('display') && Math.abs(state.solutionsTitle.fontSize - 42) < .3
    && state.trigger?.display === 'grid'
    && state.process?.background === 'rgb(16, 38, 62)'
    && Math.abs((state.processNumber?.fontSize ?? 0) - 62) < .3
    && state.processNumber?.color === 'rgb(127, 166, 207)'
    && state.overflow <= 1);
}

async function waitLoaded(page, js = true) {
  if (!js) await page.waitForLoadState('load', { timeout: 20000 });
  else await page.waitForFunction(() => document.documentElement.dataset.narrativeCssLoaded === 'true'
    && Array.from(document.querySelectorAll('link[href*="/styles/narrative.css"]')).some(link => link.media === 'all' && link.sheet), null, { timeout: 20000, polling: 100 });
  return snapshot(page);
}

async function landing(page, target) {
  return page.evaluate(id => {
    const destination = document.getElementById(id);
    const text = id === 'contacto' ? destination?.querySelector('.contact-email') : destination?.querySelector('.process-meta h2');
    const box = text?.getBoundingClientRect();
    const section = destination?.getBoundingClientRect();
    const nav = document.querySelector('.site-nav')?.getBoundingClientRect();
    const style = text ? getComputedStyle(text) : null;
    return { hash: location.hash, y: scrollY, sectionTop: section?.top ?? null, textTop: box?.top ?? null,
      textBottom: box?.bottom ?? null, textWidth: box?.width ?? null, navBottom: nav?.bottom ?? 0,
      text: text?.textContent?.trim() ?? null,
      readable: Boolean(box && box.width > 0 && box.height > 0 && box.top >= Math.max(0, nav?.bottom ?? 0) - 3 && box.bottom <= innerHeight + 2 && style?.display !== 'none' && style?.visibility === 'visible' && Number(style?.opacity) >= .65) };
  }, target);
}

async function stableLanding(page, target) {
  // Driver timeouts, never an in-page RAF loop (including no-JS documents).
  let previous = null;
  let stable = 0;
  let latest = null;
  for (let sample = 0; sample < 30; sample += 1) {
    latest = await landing(page, target);
    stable = previous && latest.readable && Math.abs(latest.textTop - previous.textTop) <= 2 ? stable + 1 : 0;
    if (stable >= 3) break;
    previous = latest;
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(650);
  const later = await landing(page, target);
  return { first: latest, later, stable, jumpPx: latest?.textTop === null || later.textTop === null ? null : Math.abs(latest.textTop - later.textTop) };
}

async function screenshot(page, result, suffix) {
  const filename = `${result.name}-${suffix}.png`;
  await page.screenshot({ path: path.join(out, filename), fullPage: false });
  result.screenshots.push(filename);
}

async function runCase(name) {
  const result = { name, checks: [], snapshots: {}, cssRequests: [], runtimeErrors: [], screenshots: [] };
  report.cases.push(result);
  const js = name !== 'no-js';
  const context = await browser.newContext({ viewport: report.viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1, javaScriptEnabled: js, reducedMotion: name === 'reduced' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  let delayMs = name === 'fresh-click-1200' ? 1200 : name === 'fresh-tab-2500' ? 2500 : 1500;
  let requestsHeld = 0;
  page.on('pageerror', error => result.runtimeErrors.push({ type: 'pageerror', message: error.message, stack: error.stack ?? null }));
  page.on('console', message => { if (message.type() === 'error') result.runtimeErrors.push({ type: 'console', message: message.text() }); });
  try {
    if (js) await context.addInitScript(installRecorder);
    await context.route('**/styles/narrative.css*', async route => {
      const request = { url: route.request().url(), delayMs, requestedAt: Date.now(), releasedAt: null, fulfilled: false };
      result.cssRequests.push(request);
      requestsHeld += 1;
      try {
        const response = await route.fetch();
        if (request.delayMs) await page.waitForTimeout(request.delayMs);
        request.releasedAt = Date.now();
        await route.fulfill({ response });
        request.fulfilled = true;
      } catch (error) {
        request.error = error.message;
        await route.abort().catch(() => {});
      } finally { requestsHeld -= 1; }
    });
    const url = name === 'first-hash' ? baseURL.replace(/\/$/, '') + '/#proceso' : baseURL;
    if (name === 'no-js') delayMs = 0;
    const response = await page.goto(url, { waitUntil: 'commit', timeout: 20000 });
    check(result, 'HTTP response', Boolean(response?.ok()), response?.status());
    await page.locator('main .hero-primary[href="#contacto"]').waitFor({ state: 'attached', timeout: 15000 });

    if (name.startsWith('fresh-')) {
      await page.locator('main .hero-primary[href="#contacto"]').waitFor({ state: 'visible', timeout: 10000 });
      result.snapshots.before = await snapshot(page);
      check(result, 'CSS response still held before genuine interaction', requestsHeld > 0 && result.snapshots.before.links.every(link => !link.sheetExists), { requestsHeld, links: result.snapshots.before.links, motionReady: result.snapshots.before.motionReady });
      if (name === 'fresh-tab-2500') {
        await page.keyboard.press('Tab');
        result.snapshots.firstTabImmediate = await snapshot(page);
        check(result, 'first native Tab assigns real keyboard focus before delivery', result.snapshots.firstTabImmediate.active.tag !== 'BODY' && result.snapshots.firstTabImmediate.active.focusVisible && requestsHeld > 0,
          { active: result.snapshots.firstTabImmediate.active, requestsHeld });
        // A skip link starts outside the viewport and has an existing .2 s focus
        // transition in shell.css. Sampling as keyup returns can precede its
        // first visible frame. Require visible focus within a bounded 500 ms,
        // before taking the next Tab; do not override or finish its animation.
        const focusBecameVisible = await page.waitForFunction(() => {
          const active = document.activeElement;
          if (!(active instanceof Element) || active === document.body || !active.matches(':focus-visible')) return false;
          const box = active.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight;
        }, null, { timeout: 500, polling: 25 }).then(() => true).catch(() => false);
        result.snapshots.firstTab = await snapshot(page);
        check(result, 'first focused element becomes fully readable promptly before delivery', focusBecameVisible && result.snapshots.firstTab.active.visible && requestsHeld > 0,
          { immediate: result.snapshots.firstTabImmediate.active, settled: result.snapshots.firstTab.active, requestsHeld });
        let active = result.snapshots.firstTab.active;
        for (let tab = 0; tab < 14 && !active.heroContact; tab += 1) {
          await page.keyboard.press('Tab');
          active = (await snapshot(page)).active;
        }
        check(result, 'keyboard reaches the actual hero contact link', active.heroContact, active);
        result.snapshots.beforeActivate = await snapshot(page);
        result.interactionAt = Date.now();
        if (active.heroContact) await page.keyboard.press('Enter');
      } else {
        result.interactionAt = Date.now();
        await page.locator('main .hero-primary[href="#contacto"]').click({ timeout: 10000 });
      }
      result.snapshots.afterInteraction = await snapshot(page);
      const interaction = result.snapshots.afterInteraction.events?.find(event => event.kind === 'contact-click-capture');
      check(result, 'contact activation genuinely happened before CSS delivery', Boolean(interaction && !interaction.sheetExists) && result.cssRequests.some(request => request.releasedAt === null || request.releasedAt > result.interactionAt), { interaction, interactionAt: result.interactionAt });
      result.snapshots.loaded = await waitLoaded(page);
      check(result, 'external sheet finishes with canonical mobile styles', canonicalStyles(result.snapshots.loaded), result.snapshots.loaded);
      result.landing = await stableLanding(page, 'contacto');
      check(result, 'native contact landing is readable beneath the nav', result.landing.later.hash === '#contacto' && result.landing.later.readable, result.landing);
      check(result, 'loaded contact landing remains stable', result.landing.stable >= 3 && result.landing.jumpPx !== null && result.landing.jumpPx <= 4, result.landing);
      await screenshot(page, result, 'landing');
      if (name === 'fresh-tab-2500') {
        // A second real document reuses this context, keeping the total at six.
        // A query change ensures navigation rather than a same-document removal
        // of the previous #contacto hash. It does not alter any app feature flag.
        const wheelURL = new URL(baseURL);
        wheelURL.searchParams.set('styles-wheel-qa', '1');
        wheelURL.hash = '';
        await page.goto(wheelURL.href, { waitUntil: 'commit', timeout: 20000 });
        await page.locator('main .hero-primary[href="#contacto"]').waitFor({ state: 'visible', timeout: 10000 });
        result.cancelledWheel = { before: await snapshot(page) };
        let active = result.cancelledWheel.before.active;
        for (let tab = 0; tab < 14 && !active.heroContact; tab += 1) {
          await page.keyboard.press('Tab');
          active = (await snapshot(page)).active;
        }
        check(result, 'cancellation scenario reaches real hero link before CSS delivery', active.heroContact && requestsHeld > 0,
          { active, requestsHeld });
        if (active.heroContact) await page.keyboard.press('Enter');
        result.cancelledWheel.enter = await snapshot(page);
        const earlyClick = result.cancelledWheel.enter.events?.find(event => event.kind === 'contact-click-capture');
        check(result, 'cancellation scenario has a genuine early Enter anchor', Boolean(earlyClick && !earlyClick.sheetExists), earlyClick);
        result.cancelledWheel.beforeWheel = await landing(page, 'contacto');
        const delta = result.cancelledWheel.beforeWheel.y > 800 ? -600 : 600;
        await page.mouse.move(200, 400);
        await page.mouse.wheel(0, delta);
        await page.waitForTimeout(160);
        result.cancelledWheel.afterWheel = await landing(page, 'contacto');
        result.cancelledWheel.afterWheelState = await snapshot(page);
        const wheel = result.cancelledWheel.afterWheelState.events?.find(event => event.kind === 'wheel');
        check(result, 'explicit user wheel is delivered while CSS is still held', Boolean(wheel && !wheel.sheetExists) && requestsHeld > 0,
          { wheel, requestsHeld, before: result.cancelledWheel.beforeWheel, after: result.cancelledWheel.afterWheel });
        check(result, 'user wheel actually changes the viewport', Math.abs(result.cancelledWheel.afterWheel.y - result.cancelledWheel.beforeWheel.y) >= 40,
          { delta, before: result.cancelledWheel.beforeWheel, after: result.cancelledWheel.afterWheel });
        result.cancelledWheel.loaded = await waitLoaded(page);
        check(result, 'cancelled-anchor document still loads canonical CSS', canonicalStyles(result.cancelledWheel.loaded), result.cancelledWheel.loaded);
        // Allow the existing document-load + two-frame correction to occur. A
        // cancelled intent must not recenter the contact text beneath the nav.
        // Exact scrollY is not compared: legitimate CSS layout can change it.
        await page.waitForLoadState('load', { timeout: 15000 });
        await page.waitForTimeout(800);
        result.cancelledWheel.afterLoad = await landing(page, 'contacto');
        check(result, 'CSS delivery respects the wheel instead of reanchoring contact', result.cancelledWheel.afterLoad.hash === '#contacto' && !result.cancelledWheel.afterLoad.readable,
          result.cancelledWheel.afterLoad);
        await screenshot(page, result, 'cancelled-wheel');
      }
    } else if (name === 'first-hash') {
      result.snapshots.before = await snapshot(page);
      check(result, 'initial hash activates media immediately while CSS is held', result.snapshots.before.links.some(link => link.media === 'all') && requestsHeld > 0, { links: result.snapshots.before.links, requestsHeld });
      result.snapshots.loaded = await waitLoaded(page);
      check(result, 'initial hash has canonical CSS', canonicalStyles(result.snapshots.loaded), result.snapshots.loaded);
      result.landing = await stableLanding(page, 'proceso');
      check(result, 'first process heading is readable below nav', result.landing.later.hash === '#proceso' && result.landing.later.readable, result.landing);
      await screenshot(page, result, 'process');
    } else if (name === 'history') {
      result.snapshots.initial = await waitLoaded(page);
      check(result, 'initial CSS loaded', canonicalStyles(result.snapshots.initial), result.snapshots.initial);
      delayMs = 1200;
      await page.reload({ waitUntil: 'commit', timeout: 20000 });
      await page.locator('#dos-orillas-narrative-css').waitFor({ state: 'attached', timeout: 10000 });
      result.snapshots.reloadBefore = await snapshot(page);
      check(result, 'reload activates matching CSS before delivery', result.snapshots.reloadBefore.navigationType === 'reload' && result.snapshots.reloadBefore.links.some(link => link.media === 'all'), result.snapshots.reloadBefore);
      result.snapshots.reloadLoaded = await waitLoaded(page);
      check(result, 'reload preserves canonical CSS', canonicalStyles(result.snapshots.reloadLoaded), result.snapshots.reloadLoaded);
      await page.goto(baseURL.replace(/\/$/, '') + '/motion-lab', { waitUntil: 'load', timeout: 20000 });
      await page.goBack({ waitUntil: 'commit', timeout: 20000 });
      await page.locator('#dos-orillas-narrative-css').waitFor({ state: 'attached', timeout: 10000 });
      result.snapshots.backBefore = await snapshot(page);
      check(result, 'back navigation keeps matching CSS', result.snapshots.backBefore.links.some(link => link.media === 'all'), result.snapshots.backBefore);
      result.snapshots.backLoaded = await waitLoaded(page);
      check(result, 'back navigation retains canonical CSS', canonicalStyles(result.snapshots.backLoaded), result.snapshots.backLoaded);
      await page.goForward({ waitUntil: 'load', timeout: 20000 });
      check(result, 'forward reaches actual motion lab document', new URL(page.url()).pathname === '/motion-lab', page.url());
      await page.goBack({ waitUntil: 'commit', timeout: 20000 });
      result.snapshots.secondBack = await waitLoaded(page);
      check(result, 'second back has matching loaded sheet and styles', result.snapshots.secondBack.links.some(link => link.media === 'all' && link.sheetExists) && canonicalStyles(result.snapshots.secondBack), result.snapshots.secondBack);
    } else if (name === 'no-js') {
      result.snapshots.normal = await waitLoaded(page, false);
      check(result, 'no-JS normal document uses native matching CSS', result.snapshots.normal.links.some(link => link.media === 'all' && link.sheetExists) && canonicalStyles(result.snapshots.normal), result.snapshots.normal);
      delayMs = 1700;
      await page.reload({ waitUntil: 'commit', timeout: 20000 });
      result.snapshots.delayed = await waitLoaded(page, false);
      check(result, 'no-JS delayed document has real canonical styling', result.cssRequests.some(request => request.delayMs === 1700 && request.fulfilled) && canonicalStyles(result.snapshots.delayed), result.snapshots.delayed);
      check(result, 'no-JS narrative remains ordinary visible flow', result.snapshots.delayed.roots.every(root => root.contentVisibility === 'visible'), result.snapshots.delayed.roots);
      await page.locator('main .hero-primary[href="#contacto"]').click();
      result.landing = await stableLanding(page, 'contacto');
      check(result, 'no-JS real anchor reaches a readable stable destination', result.landing.later.hash === '#contacto' && result.landing.later.readable && result.landing.jumpPx <= 4, result.landing);
      await screenshot(page, result, 'native-contact');
    } else if (name === 'reduced') {
      result.snapshots.before = await snapshot(page);
      check(result, 'reduced mode activates media immediately', result.snapshots.before.tier === '0' && result.snapshots.before.links.some(link => link.media === 'all') && requestsHeld > 0, { tier: result.snapshots.before.tier, links: result.snapshots.before.links, requestsHeld });
      result.snapshots.loaded = await waitLoaded(page);
      check(result, 'reduced reading keeps canonical mobile styles', canonicalStyles(result.snapshots.loaded) && result.snapshots.loaded.roots.every(root => root.contentVisibility === 'visible'), result.snapshots.loaded);
    }
  } catch (error) {
    check(result, 'case completed', false, error.message);
    report.errors.push({ case: name, error: error.stack ?? error.message });
    result.snapshots.failure = await snapshot(page).catch(() => null);
  } finally {
    check(result, 'no browser runtime errors', result.runtimeErrors.length === 0, result.runtimeErrors);
    result.cssRequestsFailed = result.cssRequests.filter(request => request.error);
    check(result, 'held CSS requests completed without errors', result.cssRequests.length > 0 && result.cssRequestsFailed.length === 0 && result.cssRequests.every(request => request.fulfilled), result.cssRequests);
    await context.close();
  }
}

try {
  await mkdir(out, { recursive: true });
  const { chromium } = requireProject('@playwright/test');
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  if (executablePath && !existsSync(executablePath)) throw new Error(`Chrome not found: ${executablePath}`);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const name of selected) await runCase(name);
} catch (error) {
  report.errors.push({ error: error.stack ?? error.message });
  console.error(error.message);
} finally {
  await browser?.close();
  report.passed = report.errors.length === 0 && report.cases.length === selected.length && report.cases.every(result => result.checks.length && result.checks.every(item => item.status === 'pass'));
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Narrative CSS delivery: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(out, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
