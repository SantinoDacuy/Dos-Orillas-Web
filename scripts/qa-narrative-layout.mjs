import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Functional checks only. This uses an already running build, never starts a
// server, downloads a browser, or edits application files.
// Staging copy. Restore the repository-relative `..` when integrating in scripts/.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requireProject = createRequire(path.join(project, 'package.json'));
const names = ['initial', 'scroll', 'hash', 'text200', 'reduced', 'no-js'];
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-narrative-layout.mjs [--url http://127.0.0.1:3000] [--widths 375,768] [--cases ' + names.join(',') + '] [--out qa-results/F4/layout]');
  console.log('Uses the repository Playwright and installed Chrome. Run only after the production server is ready and Lighthouse has finished.');
  process.exit(0);
}
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const widths = option('--widths', '375,768').split(',').map(Number);
const selected = option('--cases', names.join(',')).split(',').filter(Boolean);
assert.ok(widths.length && widths.every(width => [375, 768].includes(width)), 'Supported widths: 375,768.');
assert.ok(selected.length && selected.every(name => names.includes(name)), 'Unknown case. See --help.');
const out = path.resolve(project, option('--out', 'qa-results/F4/layout'));
const report = {
  phase: 'F4', baseURL, createdAt: new Date().toISOString(), browser: null,
  scope: 'Lite narrative content-visibility, native anchors/focus and complete fallback content',
  checks: [], screenshots: [], telemetry: {}, errors: [], passed: false,
};
let browser;

function verify(name, condition, detail) {
  const pass = Boolean(condition);
  report.checks.push({ name, status: pass ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ': ' + JSON.stringify(detail)}`);
  return pass;
}
async function capture(page, name) {
  const file = name + '.png';
  // Full-page capture can render distant CV subtrees and invalidate the initial
  // reserve check. Every screenshot here captures only the current viewport.
  await page.screenshot({ path: path.join(out, file), fullPage: false });
  report.screenshots.push(file);
}
function installRecorder() {
  sessionStorage.setItem('do-intro', '1');
  const state = window.__layoutQA = { events: [], sequence: 0 };
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (!(record.target instanceof Element) || !['manifiesto', 'soluciones', 'proceso'].includes(record.target.id)) continue;
      state.events.push({
        sequence: ++state.sequence, at: performance.now(), id: record.target.id,
        attribute: record.attributeName, old: record.oldValue,
        value: record.target.getAttribute(record.attributeName),
        layoutReady: record.target.getAttribute('data-narrative-layout-ready'),
      });
    }
  });
  observer.observe(document, { subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['data-narrative-layout-ready', 'data-manifesto-mode', 'data-manifesto-ready', 'data-services-motion-mode', 'data-services-motion', 'data-process-mode'] });
}
async function ready(page, js = true) {
  await page.locator('main h1').waitFor({ state: 'visible', timeout: 15000 });
  if (js) await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true', null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
}
async function settleScroll(page) {
  return page.evaluate(() => new Promise(resolve => {
    const started = performance.now();
    let last = window.scrollY;
    let stable = 0;
    let ended = false;
    const onEnd = () => { ended = true; };
    window.addEventListener('scrollend', onEnd);
    const tick = () => {
      const now = window.scrollY;
      stable = Math.abs(now - last) <= .25 ? stable + 1 : 0;
      last = now;
      if (stable >= 24 || performance.now() - started > 6000) {
        window.removeEventListener('scrollend', onEnd);
        resolve({ y: now, stable, scrollend: ended, timedOut: stable < 24 });
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
}
async function scrollBy(page, distance) {
  await page.evaluate(delta => {
    const top = window.scrollY + delta;
    window.__lenis?.scrollTo(top, { immediate: true, force: true });
    window.scrollTo({ top, behavior: 'instant' });
  }, distance);
  return settleScroll(page);
}
async function scrollToText(page, selector, scriptCallbacks = true) {
  await page.locator(selector).first().evaluate(element => {
    const y = element.getBoundingClientRect().top + window.scrollY - 108;
    window.__lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo({ top: y, behavior: 'instant' });
  });
  // In a JS-disabled context injected synchronous evaluation works, but a page
  // RAF callback cannot run. Wait from Playwright instead of awaiting that RAF.
  if (scriptCallbacks) await settleScroll(page);
  else await page.waitForTimeout(450);
  await page.waitForTimeout(800);
}
async function roots(page) {
  return page.evaluate(() => ['manifiesto', 'soluciones', 'proceso'].map(id => {
    const element = document.getElementById(id);
    if (!element) return { id, missing: true };
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { id, top: rect.top, height: rect.height,
      cv: style.contentVisibility, intrinsic: style.containIntrinsicSize,
      intrinsicHeight: style.containIntrinsicHeight,
      layoutReady: element.dataset.narrativeLayoutReady,
      mode: id === 'manifiesto' ? element.dataset.manifestoMode : id === 'soluciones' ? element.dataset.servicesMotionMode : element.dataset.processMode,
    };
  }));
}
async function overflow(page, name) {
  const value = await page.evaluate(() => ({ width: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  verify(name, value.html <= value.width + 1 && value.body <= value.width + 1, value);
}
async function landing(page, id, name) {
  const settled = await settleScroll(page);
  const value = await page.locator('#' + id).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const header = Array.from(document.querySelectorAll('.site-nav-inner')).find(node => node.getClientRects().length);
    const navBottom = header?.getBoundingClientRect().bottom ?? 88;
    const labelId = element.getAttribute('aria-labelledby')?.split(/\s+/)[0];
    const label = labelId ? document.getElementById(labelId) : null;
    const labelBox = label?.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, labelId, labelTop: labelBox?.top, labelBottom: labelBox?.bottom, navBottom, viewport: innerHeight, hash: location.hash, y: scrollY };
  });
  const sectionVisible = value.top >= value.navBottom - 3 && value.top <= Math.max(128, value.navBottom + 40);
  // Proceso has 88/96px of empty top padding. Its section border may move above
  // the fixed Nav while its actual heading remains fully visible underneath it.
  // Check the named reading target only in that case; retain strict section
  // landing for Contact and for sections whose first content is lower down.
  const processHeadingVisible = id === 'proceso' && value.top < value.navBottom - 3 && Number.isFinite(value.labelTop) &&
    value.labelTop >= value.navBottom - 3 && value.labelTop <= Math.max(128, value.navBottom + 40) && value.labelBottom <= value.viewport;
  verify(name, !settled.timedOut && value.hash === '#' + id && (sectionVisible || processHeadingVisible), { ...value, settled, readingTarget: processHeadingVisible ? value.labelId : id });
}
async function assertUnlocked(page, name) {
  const value = await roots(page);
  verify(name, value.every(root => root.layoutReady === 'true' && root.cv === 'visible'), value);
}
async function nativeModes(page, name, requireSolutions = true) {
  const value = await page.evaluate(() => {
    const process = document.getElementById('proceso');
    const solutions = document.getElementById('soluciones');
    return { tier: document.documentElement.dataset.motionTier,
      processMode: process?.dataset.processMode,
      processRange: window.__sceneRanges?.process ?? null,
      processPins: process?.querySelectorAll('.pin-spacer').length ?? 0,
      manifestoMode: document.getElementById('manifiesto')?.dataset.manifestoMode,
      manifestoPins: document.getElementById('manifiesto')?.querySelectorAll('.pin-spacer').length ?? 0,
      solutionsMode: solutions?.dataset.servicesMotionMode,
      solutionsMotion: solutions?.dataset.servicesMotion,
      solutionsRange: window.__sceneRanges?.solutions ?? null,
      solutionsPins: solutions?.querySelectorAll('.pin-spacer').length ?? 0,
      globalTriggerCount: window.__stCount ?? 0,
    };
  });
  // Hero/Distance may legitimately use ScrollTrigger in tier1. These narrative
  // sections must not own a pin or a horizontal process range.
  verify(name, value.tier === '1' && value.processMode === 'vertical' && value.processRange === null && value.processPins === 0 && value.manifestoPins === 0 && value.manifestoMode !== 'full' && (!requireSolutions || (value.solutionsMode === 'lite' && value.solutionsMotion === 'true')) && value.solutionsRange === null && value.solutionsPins === 0, value);
}
async function markerOrder(page, name) {
  const events = await page.evaluate(() => window.__layoutQA?.events ?? []);
  const work = events.filter(event => (event.attribute === 'data-process-mode' && event.value === 'vertical') ||
    (event.attribute === 'data-manifesto-mode' && event.value === 'lite') ||
    (event.attribute === 'data-services-motion-mode' && event.value === 'lite') ||
    (event.attribute === 'data-manifesto-ready' && event.value === 'true'));
  const ordered = work.every(event => event.layoutReady === 'true' && events.some(flag => flag.id === event.id && flag.attribute === 'data-narrative-layout-ready' && flag.value === 'true' && flag.sequence < event.sequence));
  verify(name, work.length > 0 && ordered, { work, flags: events.filter(event => event.attribute === 'data-narrative-layout-ready') });
}
async function textGeometry(page, name) {
  const value = await page.evaluate(() => {
    const selectors = ['.manifesto-first', '.manifesto-second', '.manifesto-description', '.solutions-name-inner', '.solutions-description', '.solutions-full-title', '.solutions-ai-text', '.process-step-title', '.process-step-description'];
    const bad = [];
    let textNodes = 0;
    let fullyMaskedFragments = 0;
    for (const selector of selectors) for (const element of document.querySelectorAll(selector)) {
      // Enhanced accordions intentionally hide closed panels. Each panel is
      // opened and checked separately; hidden copy is still covered in SSR.
      if (element.closest('[hidden],[inert],[aria-hidden="true"]')) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent?.trim()) continue;
        textNodes++;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width < .5 || rect.height < .5) continue;
          const clips = [];
          const visible = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          for (let parent = element; parent && parent !== document.body; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            const box = parent.getBoundingClientRect();
            const clipX = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
            const clipY = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY);
            if (clipX || clipY) clips.push({ parent, box, clipX, clipY });
            if (clipX) { visible.left = Math.max(visible.left, box.left); visible.right = Math.min(visible.right, box.right); }
            if (clipY) { visible.top = Math.max(visible.top, box.top); visible.bottom = Math.min(visible.bottom, box.bottom); }
          }
          // A pending offscreen WAAPI reveal deliberately places this text
          // completely outside its overflow:clip mask. It paints no fragment.
          // Only skip fully masked fragments: partial visible clipping remains
          // a failure below. The final AI reveal is checked explicitly afterward.
          if (visible.right - visible.left <= .5 || visible.bottom - visible.top <= .5) { fullyMaskedFragments++; continue; }
          if (rect.left < -1 || rect.right > innerWidth + 1) bad.push({ selector, text: node.textContent.trim(), left: rect.left, right: rect.right, width: innerWidth });
          for (const { parent, box, clipX, clipY } of clips) {
            if ((clipX && (rect.left < box.left - 2 || rect.right > box.right + 2)) || (clipY && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2))) {
              bad.push({ selector, text: node.textContent.trim(), clippingAncestor: parent.className, rect: { top: rect.top, bottom: rect.bottom }, box: { top: box.top, bottom: box.bottom } });
              break;
            }
          }
        }
      }
    }
    return { textNodes, fullyMaskedFragments, bad };
  });
  verify(name, value.textNodes > 10 && value.bad.length === 0, value);
}
async function initialCase(page, prefix) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready(page);
  const initial = await roots(page);
  const viewport = page.viewportSize();
  verify(prefix + ': tier1 at top', await page.evaluate(() => document.documentElement.dataset.motionTier === '1' && scrollY <= 1));
  for (const root of initial) {
    const intrinsic = String(root.intrinsicHeight).match(/\d+(?:\.\d+)?px/g)?.map(Number.parseFloat) ?? [];
    verify(prefix + ': ' + root.id + ' offscreen CV reserve', !root.missing && root.top >= viewport.height && root.cv === 'auto' && root.height > 0 && intrinsic.some(size => size > 0), root);
  }
  await capture(page, prefix + '-initial');
  await page.locator('.hero-primary[href="#contacto"]').click();
  await page.waitForFunction(() => location.hash === '#contacto');
  await assertUnlocked(page, prefix + ': native click unlocks heights');
  await landing(page, 'contacto', prefix + ': Hero contact landing');
  await capture(page, prefix + '-contact');
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForFunction(() => location.hash === '');
  await settleScroll(page);
  verify(prefix + ': back restores top', await page.evaluate(() => scrollY <= 2));
  await page.goForward({ waitUntil: 'commit' });
  await page.waitForFunction(() => location.hash === '#contacto');
  await landing(page, 'contacto', prefix + ': forward restores contact');

  // A fresh document ensures that the click did not pre-unlock the Tab check.
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await page.keyboard.press('Tab');
  await assertUnlocked(page, prefix + ': Tab unlocks before native focus');
  verify(prefix + ': Tab reaches visible focus', await page.evaluate(() => {
    const element = document.activeElement;
    return element instanceof HTMLElement && element !== document.body && element.getClientRects().length > 0 && element.matches(':focus-visible');
  }));
  await overflow(page, prefix + ': horizontal overflow');
}
async function approach(page, id) {
  const height = page.viewportSize().height;
  for (let step = 0; step < 45; step++) {
    const rect = await page.locator('#' + id).boundingBox();
    assert.ok(rect, id + ' has a box');
    // Solutions has a second deferred controller with a 400px root margin.
    // A 650px approach can mount the island while legitimately leaving native
    // motion unloaded; reach inside every nested owner before asserting it.
    if (rect.y < height + 350) break;
    await scrollBy(page, Math.min(height * .65, Math.max(80, rect.y - height - 250)));
    if (step === 44) throw new Error('Could not approach ' + id);
  }
  // Ensure a real scroll event even when this section was already near at top.
  await scrollBy(page, 2);
  await page.waitForFunction(scene => document.getElementById(scene)?.dataset.narrativeLayoutReady === 'true', id, { timeout: 15000 });
  await page.waitForFunction(scene => {
    const element = document.getElementById(scene);
    if (scene === 'proceso') return element?.dataset.processMode === 'vertical';
    if (scene === 'soluciones') return element?.dataset.servicesMotionMode === 'lite' && element.dataset.servicesMotion === 'true';
    return element?.dataset.manifestoReady === 'true';
  }, id, { timeout: 15000 });
}
async function solutionPanels(page, prefix) {
  const buttons = page.locator('#soluciones h3 button');
  const count = await buttons.count();
  verify(prefix + ': four native solution triggers', count === 4, count);
  for (let index = 0; index < count; index++) {
    const button = buttons.nth(index);
    await button.focus();
    if (await button.getAttribute('aria-expanded') !== 'true') await page.keyboard.press('Enter');
    const panelId = await button.getAttribute('aria-controls');
    assert.ok(panelId, 'Solution trigger controls a panel');
    await page.waitForFunction(id => {
      const panel = document.getElementById(id);
      const trigger = document.querySelector(`[aria-controls="${id}"]`);
      return trigger?.getAttribute('aria-expanded') === 'true' && panel instanceof HTMLElement && !panel.inert && panel.getAttribute('aria-hidden') !== 'true';
    }, panelId, { timeout: 10000 });
    await page.waitForTimeout(650);
    const geometry = await button.evaluate(element => {
      const panel = document.getElementById(element.getAttribute('aria-controls'));
      const row = element.closest('.solutions-row');
      const copy = panel?.querySelector('.solutions-description');
      const panelBox = panel?.getBoundingClientRect();
      const copyBox = copy?.getBoundingClientRect();
      const media = panel?.querySelector('.solutions-media');
      return { expanded: element.getAttribute('aria-expanded'), focused: document.activeElement === element,
        panelHeight: panelBox?.height ?? 0, copyHeight: copyBox?.height ?? 0,
        contained: Boolean(panelBox && copyBox && copyBox.top >= panelBox.top - 2 && copyBox.bottom <= panelBox.bottom + 2),
        mediaHeight: media?.getBoundingClientRect().height ?? 0, active: row?.getAttribute('data-active') };
    });
    verify(prefix + ': solution panel ' + (index + 1) + ' usable', geometry.expanded === 'true' && geometry.focused && geometry.panelHeight > 0 && geometry.copyHeight > 0 && geometry.contained && geometry.mediaHeight > 0, geometry);
    const rail = await page.evaluate(() => {
      const values = ['.solutions-ai-line', '.solutions-exit-line'].map(selector => getComputedStyle(document.querySelector(selector)).transform);
      return { values, valid: values.every(value => value === 'none' || !value.includes('NaN')),
        mode: document.getElementById('soluciones')?.dataset.servicesMotionMode,
        pins: document.querySelectorAll('#soluciones .pin-spacer').length };
    });
    verify(prefix + ': cached native rail after panel ' + (index + 1), rail.valid && rail.mode === 'lite' && rail.pins === 0, rail);
    await overflow(page, prefix + ': solution panel ' + (index + 1) + ' overflow');
    await textGeometry(page, prefix + ': solution panel ' + (index + 1) + ' readable copy');
    await capture(page, prefix + '-solution-panel-' + (index + 1));
  }
  // Opening the panels must not be mistaken for revealing the distant AI copy.
  // Enter that copy's actual trigger and verify its final painted state, so the
  // masked-fragment filter above cannot hide missing or permanently cut text.
  await scrollToText(page, '.solutions-ai');
  await page.waitForTimeout(400);
  const ai = await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('.solutions-ai-text'));
    return {
      count: texts.length,
      readable: texts.every(element => {
        const mask = element.closest('.solutions-ai-mask');
        const box = mask?.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return Boolean(box && rect.width > 0 && rect.height > 0 && rect.top >= box.top - 2 && rect.bottom <= box.bottom + 2 &&
          rect.left >= box.left - 2 && rect.right <= box.right + 2 && rect.top >= 0 && rect.top < innerHeight &&
          element.textContent?.trim().length && element.getAnimations().length === 0);
      }),
    };
  });
  verify(prefix + ': complete AI copy after native reveal', ai.count === 2 && ai.readable, ai);
  await textGeometry(page, prefix + ': revealed AI text within masks');
  await capture(page, prefix + '-ai-revealed');
}
async function scrollCase(page, prefix) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready(page);
  for (const [id, selector] of [['manifiesto', '.manifesto-first'], ['soluciones', '.solutions-name-inner'], ['proceso', '.process-step-title']]) {
    await approach(page, id);
    const root = (await roots(page)).find(value => value.id === id);
    verify(prefix + ': ' + id + ' layout restored before motion', root?.layoutReady === 'true' && root.cv === 'visible', root);
    await scrollToText(page, selector);
    await capture(page, prefix + '-' + id + '-entry');
    const before = await page.locator(selector).first().evaluate(element => ({ y: element.getBoundingClientRect().top + scrollY, height: element.getBoundingClientRect().height }));
    await scrollBy(page, 140);
    const after = await page.locator(selector).first().evaluate(element => ({ y: element.getBoundingClientRect().top + scrollY, height: element.getBoundingClientRect().height }));
    verify(prefix + ': ' + id + ' readable text does not jump', Math.abs(after.y - before.y) <= 3 && Math.abs(after.height - before.height) <= 3, { before, after });
    await overflow(page, prefix + ': ' + id + ' overflow');
    if (id === 'soluciones') await solutionPanels(page, prefix);
  }
  await nativeModes(page, prefix + ': native scenes without narrative pins');
  await markerOrder(page, prefix + ': layout flag precedes motion mode');
  await scrollToText(page, '.process-step:last-child .process-step-title');
  await capture(page, prefix + '-process-end');
  await textGeometry(page, prefix + ': all narrative text within bounds');
}
async function hashCase(page, prefix) {
  for (const id of ['contacto', 'proceso']) {
    await page.goto(new URL('/#' + id, baseURL).href, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await landing(page, id, prefix + ': direct hash ' + id);
    const value = await roots(page);
    verify(prefix + ': initial hash bypasses CV ' + id, value.every(root => root.cv === 'visible'), value);
    if (id === 'proceso') {
      await page.waitForFunction(() => document.getElementById('proceso')?.dataset.processMode === 'vertical', null, { timeout: 15000 });
      // A direct process hash may legitimately skip mounting distant Solutions.
      await nativeModes(page, prefix + ': process hash native mode', false);
    }
    await capture(page, prefix + '-' + id);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await landing(page, id, prefix + ': reload hash ' + id);
    await overflow(page, prefix + ': hash overflow ' + id);
  }
}
async function doubleText(page) {
  await page.evaluate(() => {
    // Read every original size before any write, so nested text is doubled once.
    const elements = Array.from(document.querySelectorAll('h1,h2,h3,p,a,button,span,label,input,textarea'));
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
    elements.forEach((element, index) => { if (Number.isFinite(sizes[index])) element.style.setProperty('font-size', `${sizes[index] * 2}px`, 'important'); });
  });
  await page.waitForTimeout(1000);
}
async function textCase(page, prefix) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await doubleText(page);
  await page.keyboard.press('Tab');
  await assertUnlocked(page, prefix + ': text200 Tab resolves real heights');
  await approach(page, 'manifiesto');
  await scrollToText(page, '.manifesto-first');
  await capture(page, prefix + '-manifesto');
  await approach(page, 'soluciones');
  await scrollToText(page, '.solutions-name-inner');
  await solutionPanels(page, prefix);
  await approach(page, 'proceso');
  await scrollToText(page, '.process-step-title');
  await capture(page, prefix + '-process');
  await overflow(page, prefix + ': text200 document width');
  await textGeometry(page, prefix + ': text200 complete lines');
  await nativeModes(page, prefix + ': text200 native mode');
}
async function fallbackCase(page, prefix, js) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await ready(page, js);
  const initial = await roots(page);
  verify(prefix + ': static layout complete without CV', initial.every(root => root.cv === 'visible' && root.height > 0), initial);
  const content = await page.evaluate(() => ({
    first: document.querySelector('.manifesto-first')?.textContent,
    second: document.querySelector('.manifesto-second')?.textContent,
    description: document.querySelector('.manifesto-description')?.textContent,
    titles: Array.from(document.querySelectorAll('#proceso h3')).map(element => element.textContent),
    descriptions: Array.from(document.querySelectorAll('.process-step-description')).map(element => element.textContent),
    solutionTitles: Array.from(document.querySelectorAll('#soluciones .solutions-name-inner')).map(element => element.textContent),
    solutionDescriptions: Array.from(document.querySelectorAll('#soluciones .solutions-description')).map(element => element.textContent),
    solutionPanels: Array.from(document.querySelectorAll('#soluciones .solutions-panel')).map(element => ({
      hidden: element.hasAttribute('hidden'), inert: element.inert, ariaHidden: element.getAttribute('aria-hidden'), height: element.getBoundingClientRect().height,
    })),
    solutionsMode: document.getElementById('soluciones')?.dataset.servicesMotionMode,
    mode: document.getElementById('proceso')?.dataset.processMode,
    range: window.__sceneRanges?.process ?? null,
  }));
  verify(prefix + ': complete semantic copy', content.first?.includes('PORQUE SÍ.') && content.second?.includes('MEJORAR ALGO.') && content.description?.includes('se adapte al negocio') && content.titles.length === 4 && content.descriptions.every(text => text?.trim().length > 20), content);
  verify(prefix + ': all solution copy visible in fallback', content.solutionTitles.length === 4 && content.solutionDescriptions.length === 4 && content.solutionDescriptions.every(text => text?.trim().length > 30) && content.solutionPanels.every(panel => !panel.hidden && !panel.inert && panel.ariaHidden !== 'true' && panel.height > 0) && content.solutionsMode !== 'lite', content);
  verify(prefix + ': static process mode', content.mode === 'flow' && content.range === null, content.mode);
  for (const [name, selector] of [['manifesto', '.manifesto-first'], ['solutions', '.solutions-name-inner'], ['process-end', '.process-step:last-child .process-step-title']]) {
    await scrollToText(page, selector, js);
    await capture(page, prefix + '-' + name);
  }
  await overflow(page, prefix + ': static document width');
  await textGeometry(page, prefix + ': static text complete');
}
async function runCase(name, width) {
  const prefix = name + '-' + width;
  const js = name !== 'no-js';
  const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    reducedMotion: name === 'reduced' ? 'reduce' : 'no-preference', javaScriptEnabled: js });
  if (js) await context.addInitScript(installRecorder);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    if (name === 'initial') await initialCase(page, prefix);
    if (name === 'scroll') await scrollCase(page, prefix);
    if (name === 'hash') await hashCase(page, prefix);
    if (name === 'text200') await textCase(page, prefix);
    if (name === 'reduced' || name === 'no-js') await fallbackCase(page, prefix, js);
  } catch (error) {
    verify(prefix + ': completed', false, error.message);
    report.errors.push({ case: prefix, error: error.stack ?? error.message });
    await capture(page, prefix + '-failure').catch(() => {});
  } finally {
    if (js) report.telemetry[prefix] = await page.evaluate(() => window.__layoutQA).catch(() => null);
    verify(prefix + ': no runtime errors', errors.length === 0, errors);
    await context.close();
  }
}
try {
  await mkdir(out, { recursive: true });
  const { chromium } = requireProject('@playwright/test');
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : existsSync(installedChrome) ? installedChrome : undefined;
  assert.ok(executablePath, 'Installed Chrome is required. Set CHROME_PATH; this script does not download a browser.');
  browser = await chromium.launch({ headless: true, executablePath });
  report.browser = { version: browser.version(), executablePath };
  for (const width of widths) for (const name of selected) await runCase(name, width);
} catch (error) {
  verify('harness', false, error.message);
  report.errors.push({ error: error.stack ?? error.message });
} finally {
  await browser?.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.status === 'pass');
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`F4 layout: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(out, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
