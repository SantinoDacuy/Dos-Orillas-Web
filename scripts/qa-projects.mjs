import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Run against an already-built server; never starts one or edits data.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(repository, 'package.json'));
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const profiles = [
  ...[[375, 667], [768, 900], [1024, 900], [1440, 900], [1920, 1080]].map(([width, height]) => ({ name: `full-${width}`, width, height })),
  { name: 'reduced-375', width: 375, height: 667, reduced: true },
  { name: 'reduced-1440', width: 1440, height: 900, reduced: true },
  { name: 'no-js-375', width: 375, height: 667, noJS: true },
  { name: 'no-js-768', width: 768, height: 900, noJS: true },
  { name: 'no-js-1440', width: 1440, height: 900, noJS: true },
  { name: 'text200-320', width: 320, height: 667, text200: true },
  { name: 'text200-375', width: 375, height: 667, text200: true },
  { name: 'text200-1440', width: 1440, height: 900, text200: true },
  { name: 'cleanup-resize', width: 1440, height: 900, cleanup: true },
  { name: 'native-lite-cv', width: 375, height: 812, nativeCV: true },
  { name: 'native-lite-keyboard', width: 375, height: 812, nativeKeyboard: true },
  { name: 'native-lite-hash', width: 375, height: 812, nativeHash: true },
];
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-projects.mjs [--url http://127.0.0.1:3000] [--cases ' + profiles.map(profile => profile.name).join(',') + '] [--out qa-results/F5/projects] [--data data/projects.ts]');
  console.log('Uses the project’s installed Playwright/axe and CHROME_PATH, if provided. Cases are sequential; project counts come from the current data file.');
  process.exit(0);
}
const selected = option('--cases', profiles.map(profile => profile.name).join(',')).split(',').filter(Boolean);
assert.ok(selected.length && selected.every(name => profiles.some(profile => profile.name === name)), 'Unknown --cases. See --help.');
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const outputDirectory = path.resolve(repository, option('--out', 'qa-results/F5/projects'));
const report = { phase: 'F5', baseURL, createdAt: new Date().toISOString(), cases: [], expected: {}, passed: false };
let browser;
let AxeBuilder;
let expected;

async function currentProjects() {
  // Only this standalone data module is evaluated. A sixth fixture added to it
  // becomes the expected count automatically; no production dataset is changed.
  const filename = path.resolve(repository, option('--data', 'data/projects.ts'));
  if (filename.endsWith('.json')) return JSON.parse(await readFile(filename, 'utf8'));
  const typescript = requireProject('typescript');
  const source = await readFile(filename, 'utf8');
  const compiled = typescript.transpileModule(source, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS } }).outputText;
  const transpiledModule = { exports: {} };
  vm.runInNewContext(compiled, { module: transpiledModule, exports: transpiledModule.exports, require: requireProject }, { filename, timeout: 1500 });
  assert.ok(Array.isArray(transpiledModule.exports.projects), 'The data module must export projects.');
  return transpiledModule.exports.projects;
}
function check(result, name, condition, detail) {
  result.checks.push({ name, status: condition ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${result.name}: ${name}`);
  return condition;
}
async function capture(page, result, label) {
  const filename = `${result.name}-${label}.png`;
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage: false });
  result.screenshots.push(filename);
}
async function scroll(page, y, settle = 350) {
  await page.evaluate(target => {
    window.__lenis?.scrollTo(target, { immediate: true, force: true });
    window.scrollTo({ top: target, behavior: 'instant' });
  }, Math.max(0, y));
  await page.waitForTimeout(settle);
}
async function show(page, selector, offset = 112, settle = 350) {
  const y = await page.locator(selector).first().evaluate((node, inset) => node.getBoundingClientRect().top + scrollY - inset, offset);
  await scroll(page, y, settle);
}
async function loaded(page, settings) {
  const response = await page.goto(baseURL + (settings.nativeHash ? '#todos-los-proyectos' : ''), { waitUntil: 'networkidle', timeout: 30000 });
  assert.ok(response?.ok(), `HTTP ${response?.status()}`);
  await page.locator('#proyectos').waitFor({ state: 'attached', timeout: 15000 });
  await page.locator('#todos-los-proyectos').waitFor({ state: 'attached', timeout: 15000 });
  if (!settings.noJS) await page.evaluate(() => document.fonts.ready);
  else await page.waitForTimeout(400); // Native font loading settles outside the JS-disabled page realm.
  if (!settings.noJS) await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true'
    && document.documentElement.dataset.intro !== 'true' && !document.querySelector('main')?.inert, undefined, { timeout: 15000 });
}
async function enlargeText(page) {
  const count = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('#proyectos *, #todos-los-proyectos *, [data-brand-separator] *')).filter(node => node instanceof HTMLElement && Array.from(node.childNodes).some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()));
    const sizes = nodes.map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize) }));
    for (const { node, size } of sizes) if (Number.isFinite(size)) node.style.setProperty('font-size', `${size * 2}px`, 'important');
    window.dispatchEvent(new Event('resize'));
    return nodes.length;
  });
  await page.waitForTimeout(500);
  return count;
}
async function semanticContent(page, result) {
  const actual = await page.evaluate(() => {
    const normalize = text => (text ?? '').replace(/\s+/g, ' ').trim();
    return {
      featured: Array.from(document.querySelectorAll('#proyectos [data-featured-slide]')).map(slide => ({
        index: slide.dataset.featuredSlide, slug: slide.dataset.projectSlug,
        title: normalize(slide.querySelector('h3')?.getAttribute('aria-label') ?? slide.querySelector('h3')?.textContent),
        category: normalize(slide.querySelector('.featured-category')?.textContent),
        links: Array.from(slide.querySelectorAll('a[href]')).map(link => link.getAttribute('href')),
      })),
      grid: Array.from(document.querySelectorAll('#todos-los-proyectos .project-grid-card')).map(card => ({
        slug: card.dataset.projectSlug, title: normalize(card.querySelector('h3')?.textContent),
        meta: normalize(card.querySelector('.project-card-meta')?.textContent),
        href: card.querySelector('.project-card-link')?.getAttribute('href'),
        cta: normalize(card.querySelector('.project-card-cta-original')?.textContent),
        cursor: card.querySelector('.project-card-link')?.dataset.cursor,
      })),
      invitation: normalize(document.querySelector('.project-grid-invitation-link')?.textContent),
      invitationHref: document.querySelector('.project-grid-invitation-link')?.getAttribute('href'),
      more: document.querySelector('.project-grid-more-link')?.getAttribute('href') ?? null,
    };
  });
  result.content = actual;
  const selectedProjects = [...expected].filter(project => project.featured).sort((a, b) => a.order - b.order);
  const gridProjects = [...expected].sort((a, b) => a.order - b.order).slice(0, 8);
  check(result, 'featured-count-matches-current-data', actual.featured.length === selectedProjects.length, { expected: selectedProjects.length, actual: actual.featured.length });
  check(result, 'grid-count-respects-eight-limit', actual.grid.length === gridProjects.length, { expected: gridProjects.length, actual: actual.grid.length });
  selectedProjects.forEach((project, index) => {
    const item = actual.featured[index];
    check(result, `featured-real-content-${project.slug}`, item?.index === String(index) && item.slug === project.slug && item.title.toLocaleLowerCase() === project.title.toLocaleLowerCase() && item.category === project.categoryLabel && item.links.length >= 1 && item.links.every(href => href === `/projects/${project.slug}`), item);
  });
  gridProjects.forEach((project, index) => {
    const item = actual.grid[index];
    const meta = [project.categoryLabel, project.year].filter(value => value !== null && value !== '').join(' · ');
    check(result, `grid-real-content-${project.slug}`, item?.slug === project.slug && item.title.toLocaleLowerCase() === project.title.toLocaleLowerCase() && item.meta === meta && item.href === `/projects/${project.slug}` && item.cta === 'VER PROYECTO →' && item.cursor === 'ver', item);
  });
  check(result, 'invitation-is-a-distinct-real-contact-link', actual.invitation === '¿Tu proyecto es el próximo? Contanos qué querés resolver →' && actual.invitationHref === '#contacto', actual);
  check(result, 'view-all-only-when-more-than-eight', actual.more === (expected.length > 8 ? '/projects' : null), actual.more);
  return actual;
}
async function accessibility(page, result, label) {
  const analysis = await new AxeBuilder({ page }).include('#proyectos').include('#todos-los-proyectos').include('[data-brand-separator]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  check(result, `axe-AA-${label}`, analysis.violations.length === 0, analysis.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
}
async function geometry(page, result, label, selector) {
  const state = await page.evaluate(target => {
    const root = document.querySelector(target);
    if (!root) return { missing: true };
    const nodes = Array.from(root.querySelectorAll('h3, .project-card-meta, .project-card-cta-original, .featured-category, .featured-context, .featured-project-link, .project-grid-invitation-copy')).filter(node => !node.closest('[inert], [aria-hidden="true"]'));
    const overflowing = nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { class: node.className, width: node.clientWidth, scroll: node.scrollWidth, left: box.left, right: box.right };
    }).filter(node => node.scroll > node.width + 3 || node.left < -3 || node.right > innerWidth + 3);
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, overflowing };
  }, selector);
  result.geometry.push({ label, selector, ...state });
  check(result, `no-horizontal-overflow-${label}`, !state.missing && state.documentWidth <= state.viewport + 3 && state.overflowing.length === 0, state);
}
async function primeFeatured(page, result, settings) {
  if (settings.noJS || settings.reduced) return { mode: 'flow', range: null };
  await scroll(page, 12, 250);
  await show(page, '#proyectos', 200, 700);
  await page.waitForFunction(() => {
    const root = document.querySelector('#proyectos');
    return root?.dataset.featuredReady === 'true' && ['flow', 'arc'].includes(root.dataset.featuredMode);
  }, undefined, { timeout: 20000 });
  const profile = await page.evaluate(() => ({ mode: document.querySelector('#proyectos').dataset.featuredMode,
    tier: document.documentElement.dataset.motionTier, range: window.__sceneRanges?.featured ?? null,
    pins: document.querySelectorAll('#proyectos .pin-spacer').length }));
  result.featuredProfile = profile;
  check(result, 'featured-valid-native-profile', ['flow', 'arc'].includes(profile.mode), profile);
  check(result, 'featured-never-owns-a-scroll-pin-or-range', profile.range === null && profile.pins === 0, profile);
  if (!settings.text200 && settings.width >= 340 && settings.height >= 580) check(result, 'native-arc-available-at-normal-text', profile.mode === 'arc', profile);
  if (settings.text200 || settings.width < 340 || settings.height < 580) check(result, 'large-text-or-small-viewport-uses-readable-flow', profile.mode === 'flow', profile);
  return profile;
}
async function waitFeaturedIndex(page, index, settle = 0) {
  await page.waitForFunction(value => Number(document.querySelector('#proyectos')?.dataset.featuredIndex) === value, index, { timeout: 6000 });
  if (settle) await page.waitForTimeout(settle);
}
async function featuredIndex(page, index) {
  const dot = page.locator(`#proyectos [data-featured-select="${index}"]`);
  if (await dot.isVisible()) await dot.click();
  else {
    await page.locator('#proyectos .featured-list').focus();
    await page.keyboard.press('Home');
    for (let step = 0; step < index; step += 1) await page.keyboard.press('ArrowRight');
  }
  await waitFeaturedIndex(page, index, 900);
}
async function activeAccess(page, result, label, index, count) {
  const state = await page.evaluate(value => {
    const root = document.querySelector('#proyectos');
    const list = root.querySelector('.featured-list');
    const slides = Array.from(root.querySelectorAll('[data-featured-slide]'));
    const active = slides[value];
    const card = active?.querySelector('.featured-card-scale');
    const bounds = card?.getBoundingClientRect();
    const listBounds = list.getBoundingClientRect();
    return { index: Number(root.dataset.featuredIndex), slides: slides.map((slide, position) => ({ position,
      inert: slide.inert, hidden: slide.getAttribute('aria-hidden'), active: slide.dataset.featuredActive })),
      centered: Boolean(bounds && Math.abs((bounds.left + bounds.right) / 2 - (listBounds.left + listBounds.right) / 2) <= 6),
      opacity: active ? Number(getComputedStyle(active).opacity) : 0,
      links: Array.from(active?.querySelectorAll('a[href]') ?? []).map(link => ({ href: link.getAttribute('href'),
        source: link.dataset.projectTransitionSource, slug: link.dataset.projectTransitionLink })), slug: active?.dataset.projectSlug };
  }, index);
  check(result, `only-central-card-accessible-${label}`, state.index === index && state.slides.length === count
    && state.slides.every(slide => slide.position === index ? !slide.inert && slide.hidden !== 'true' && slide.active === 'true'
      : slide.inert && slide.hidden === 'true' && slide.active === 'false') && state.centered && state.opacity >= .98, state);
  check(result, `central-native-case-links-and-source-ids-${label}`, state.links.length === 2 && state.links.every(link =>
    link.href === `/projects/${state.slug}` && link.source === `featured:${state.slug}` && link.slug === state.slug), state.links);
}
async function featuredLegibility(page, result, label, index, mode) {
  const selector = `#proyectos [data-featured-slide="${index}"]`;
  const inset = await page.evaluate(() => Math.max(104, document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0) + 16);
  await show(page, `${selector} ${mode === 'arc' ? '.featured-card-scale' : '.featured-copy'}`, inset, 950);
  const state = await page.locator(selector).evaluate((slide, currentMode) => {
    const navBottom = Math.max(0, document.querySelector('.site-nav')?.getBoundingClientRect().bottom ?? 0);
    const card = slide.querySelector('.featured-card-scale');
    const nodes = Array.from(slide.querySelectorAll('h3,.featured-category,.featured-context,.featured-project-link'));
    if (currentMode === 'arc') nodes.push(...slide.querySelectorAll('.kv-caption,.kv-legend'));
    const readings = nodes.map(node => {
      const bounds = node.getBoundingClientRect();
      const clipped = [];
      for (let parent = node.parentElement; parent && parent !== slide.parentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        const x = ['hidden', 'clip'].includes(style.overflowX);
        const y = ['hidden', 'clip'].includes(style.overflowY);
        if (x && (bounds.left < box.left - 3 || bounds.right > box.right + 3) || y && (bounds.top < box.top - 3 || bounds.bottom > box.bottom + 3)) clipped.push(parent.className);
      }
      return { class: node.className, top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right,
        width: node.clientWidth, scrollWidth: node.scrollWidth, height: node.clientHeight, scrollHeight: node.scrollHeight,
        visible: getComputedStyle(node).visibility !== 'hidden', clipped };
    });
    const link = slide.querySelector('.featured-project-link');
    const target = link.getBoundingClientRect();
    const hit = document.elementFromPoint((target.left + target.right) / 2, (target.top + target.bottom) / 2);
    return { viewport: innerHeight, width: innerWidth, navBottom, readings, cardHeight: card.getBoundingClientRect().height,
      targetHeight: target.height, targetUncovered: Boolean(hit && link.contains(hit)), inert: Boolean(slide.closest('[inert]')) };
  }, mode);
  result.geometry.push({ label, selector, ...state });
  check(result, `central-copy-readable-below-nav-without-clipping-${label}`, !state.inert && state.readings.length >= 4
    && state.readings.every(node => node.visible && node.top >= state.navBottom - 3 && node.bottom <= state.viewport + 3
      && node.left >= -3 && node.right <= state.width + 3 && node.scrollWidth <= node.width + 3 && node.clipped.length === 0)
    && state.targetHeight >= 44 && state.targetUncovered, state);
  await geometry(page, result, label, selector);
}
async function featuredCaptures(page, result, profile, count) {
  for (const [beat, index] of [['inicio', 0], ['medio', Math.floor((count - 1) / 2)], ['final', count - 1]]) {
    if (profile.mode === 'arc') await featuredIndex(page, index);
    await featuredLegibility(page, result, `featured-${beat}`, index, profile.mode);
    if (profile.mode === 'arc') await activeAccess(page, result, beat, index, count);
    await capture(page, result, `featured-${beat}`);
  }
  // Every real title can be longer than the first card; test all, not only three.
  for (let index = 0; index < count; index += 1) {
    if (profile.mode === 'arc') await featuredIndex(page, index);
    await featuredLegibility(page, result, `featured-all-${index}`, index, profile.mode);
  }
}
async function featuredControls(page, result, profile, count) {
  if (profile.mode !== 'arc') return;
  const beforeURL = page.url();
  await featuredIndex(page, 0);
  const previous = page.locator('#proyectos [data-featured-direction="-1"]');
  const next = page.locator('#proyectos [data-featured-direction="1"]');
  const list = page.locator('#proyectos .featured-list');
  const controls = page.locator('#proyectos .featured-controls');
  // Locator.isDisabled also reads aria-disabled. Boundary controls deliberately
  // remain native-enabled/focusable while ARIA announces the finite boundary.
  // Their boundary state and no-wrap behavior are checked separately below.
  check(result, 'arc-controls-are-native-enabled-and-visible', await controls.isVisible()
    && await previous.evaluate(button => !button.disabled) && await next.evaluate(button => !button.disabled)
    && await list.getAttribute('tabindex') === '0');
  const targets = await controls.evaluate(root => Array.from(root.querySelectorAll('button')).filter(button => button.getClientRects().length > 0)
    .map(button => ({ label: button.getAttribute('aria-label'), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
  check(result, 'visible-glass-controls-have-labels-and-44px-targets', targets.length >= 2 && targets.every(target => target.label && target.width >= 44 && target.height >= 44), targets);
  check(result, 'previous-boundary-aria-disabled', await previous.getAttribute('aria-disabled') === 'true');
  await previous.focus();
  await page.keyboard.press('Enter');
  check(result, 'previous-boundary-does-not-wrap', await page.locator('#proyectos').getAttribute('data-featured-index') === '0');
  for (let index = 1; index < count; index += 1) {
    await next.click();
    await waitFeaturedIndex(page, index);
    check(result, `next-click-advances-once-${index}`, await page.locator('#proyectos').getAttribute('data-featured-index') === String(index));
  }
  check(result, 'next-boundary-aria-disabled', await next.getAttribute('aria-disabled') === 'true');
  await next.focus();
  await page.keyboard.press('Enter');
  check(result, 'next-boundary-does-not-wrap', await page.locator('#proyectos').getAttribute('data-featured-index') === String(count - 1));
  for (let index = count - 2; index >= 0; index -= 1) { await previous.click(); await waitFeaturedIndex(page, index); }
  check(result, 'previous-click-visits-every-real-card', await page.locator('#proyectos').getAttribute('data-featured-index') === '0');
  if (count > 1) {
    await next.focus(); await page.keyboard.press('Enter'); await waitFeaturedIndex(page, 1);
    check(result, 'next-Enter-keeps-control-focus', await next.evaluate(node => node === document.activeElement));
    if (count > 2) { await page.keyboard.press('Space'); await waitFeaturedIndex(page, 2); check(result, 'next-Space-advances-once', await page.locator('#proyectos').getAttribute('data-featured-index') === '2'); }
  }
  const dots = page.locator('#proyectos [data-featured-select]');
  check(result, 'dot-count-matches-real-featured-data', await dots.count() === count);
  if (await dots.first().isVisible()) {
    for (let index = 0; index < count; index += 1) {
      await dots.nth(index).click(); await waitFeaturedIndex(page, index);
      check(result, `dot-selects-real-project-${index}`, await dots.nth(index).getAttribute('aria-current') === 'true'
        && await page.locator('#proyectos [data-featured-select][aria-current="true"]').count() === 1);
    }
  }
  await list.focus(); await page.keyboard.press('Home'); await waitFeaturedIndex(page, 0);
  if (count > 1) { await page.keyboard.press('ArrowRight'); await waitFeaturedIndex(page, 1); await page.keyboard.press('ArrowLeft'); await waitFeaturedIndex(page, 0); }
  await page.keyboard.press('End'); await waitFeaturedIndex(page, count - 1);
  check(result, 'list-keyboard-Home-End-and-arrows-use-real-indices', await page.locator('#proyectos').getAttribute('data-featured-index') === String(count - 1));
  await featuredIndex(page, 0);
  const firstLink = page.locator('#proyectos [data-featured-slide="0"] .featured-project-link');
  await firstLink.focus(); await page.keyboard.press('End'); await waitFeaturedIndex(page, count - 1, 950);
  const focus = await page.evaluate(() => { const node = document.activeElement; const box = node.getBoundingClientRect(); const style = getComputedStyle(node);
    return { slide: node.closest('[data-featured-slide]')?.dataset.featuredSlide, inert: Boolean(node.closest('[inert]')),
      top: box.top, bottom: box.bottom, outline: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) }; });
  check(result, 'card-keyboard-focus-transfers-to-visible-current-link', focus.slide === String(count - 1) && !focus.inert
    && focus.top >= 0 && focus.bottom <= result.settings.height + 3 && focus.outline !== 'none' && focus.outlineWidth >= 1, focus);
  await page.keyboard.press('Tab');
  check(result, 'Tab-exits-active-card-without-hidden-focus', await page.evaluate(() => !document.activeElement.closest('[data-featured-slide][inert],[aria-hidden="true"]')));
  const live = await page.locator('#proyectos [data-featured-live]').textContent();
  check(result, 'manual-change-announcement-includes-real-title', count === 1 ? !live?.trim()
    : live?.includes(result.content.featured[count - 1]?.title), live);
  check(result, 'arc-controls-and-keyboard-never-auto-navigate', page.url() === beforeURL);
}
async function featuredSwipe(page, result, profile, count) {
  if (profile.mode !== 'arc' || result.settings.width >= 768 || count < 2) return;
  const session = await page.context().newCDPSession(page);
  const beforeURL = page.url();
  const gesture = async (x, y, dx, dy) => {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 5, radiusY: 5 }] });
    for (let step = 1; step <= 5; step += 1) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 5, y: y + dy * step / 5, id: 1, radiusX: 5, radiusY: 5 }] });
      await page.waitForTimeout(30);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const point = async () => page.locator('#proyectos [data-featured-active="true"] .featured-image-link').evaluate(link => {
    const box = link.getBoundingClientRect(); return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }; });
  try {
    await featuredIndex(page, 0); await featuredLegibility(page, result, 'swipe-start', 0, 'arc');
    let start = await point(); await gesture(start.x, start.y, -80, 0); await waitFeaturedIndex(page, 1, 950);
    check(result, 'real-touch-horizontal-swipe-advances', await page.locator('#proyectos').getAttribute('data-featured-index') === '1');
    check(result, 'swipe-does-not-activate-case-link', page.url() === beforeURL);
    await featuredLegibility(page, result, 'swipe-card-one', 1, 'arc');
    start = await point(); await gesture(start.x, start.y, 80, 0); await waitFeaturedIndex(page, 0, 950);
    check(result, 'real-touch-reverse-swipe-returns', await page.locator('#proyectos').getAttribute('data-featured-index') === '0');
    await featuredLegibility(page, result, 'vertical-swipe-start', 0, 'arc');
    const beforeScroll = await page.evaluate(() => scrollY);
    start = await point(); await gesture(start.x, start.y, 0, -90); await page.waitForTimeout(650);
    const vertical = await page.evaluate(() => ({ index: document.querySelector('#proyectos').dataset.featuredIndex, y: scrollY }));
    check(result, 'real-touch-vertical-travel-preserves-card-and-native-scroll', vertical.index === '0' && vertical.y > beforeScroll + 5, { beforeScroll, ...vertical });
  } finally { await session.detach(); }
}


async function gridChecks(page, result, settings, content) {
  for (const item of content.grid) {
    const selector = `#todos-los-proyectos .project-grid-card[data-project-slug="${item.slug}"]`;
    await show(page, selector, 104, settings.noJS || settings.reduced ? 250 : 1750);
    const usable = await page.locator(selector).evaluate(card => {
      const link = card.querySelector('.project-card-link');
      const title = card.querySelector('h3');
      const cta = card.querySelector('.project-card-cta-original');
      const frame = card.querySelector('.project-card-frame');
      const frameBox = frame.getBoundingClientRect();
      const visual = frame.querySelector('.key-visual');
      const contains = box => box.width > 0 && box.height > 0 && box.left >= frameBox.left - 3
        && box.right <= frameBox.right + 3 && box.top >= frameBox.top - 3 && box.bottom <= frameBox.bottom + 3;
      const readings = [];
      if (visual) {
        for (const block of visual.querySelectorAll('.kv-caption,.kv-legend')) {
          const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim() || node.parentElement.closest('.sr-only,[hidden],[aria-hidden="true"]')) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const box of range.getClientRects()) if (box.width > .5 && box.height > .5) {
              readings.push({ text: node.textContent.trim(), contained: contains(box),
                left: box.left, right: box.right, top: box.top, bottom: box.bottom });
            }
          }
        }
      }
      return { linkHeight: link.getBoundingClientRect().height, titleVisible: getComputedStyle(title).visibility !== 'hidden', ctaVisible: getComputedStyle(cta).visibility !== 'hidden' && parseFloat(getComputedStyle(cta).opacity) > 0, frameHeight: frameBox.height, inert: Boolean(link.closest('[inert]')),
        conceptual: Boolean(visual), visualContained: visual ? contains(visual.getBoundingClientRect()) : null,
        svgContained: visual ? Boolean(visual.querySelector('svg') && contains(visual.querySelector('svg').getBoundingClientRect())) : null,
        readings, frameBounds: { left: frameBox.left, right: frameBox.right, top: frameBox.top, bottom: frameBox.bottom } };
    });
    check(result, `grid-link-title-cta-usable-${item.slug}`, usable.linkHeight >= 44 && usable.frameHeight > 0 && usable.titleVisible && usable.ctaVisible && !usable.inert, usable);
    if (usable.conceptual) check(result, `grid-conceptual-caption-legend-and-svg-unclipped-${item.slug}`,
      usable.visualContained && usable.svgContained && usable.readings.length > 0 && usable.readings.every(reading => reading.contained), usable);
    await geometry(page, result, `grid-${item.slug}`, '#todos-los-proyectos');
    await capture(page, result, `grid-${item.slug}`);
    await show(page, `${selector} .project-card-info`, 112, 200);
    const caption = await page.locator(`${selector} .project-card-info`).evaluate(info => {
      const title = info.querySelector('h3').getBoundingClientRect();
      const cta = info.querySelector('.project-card-cta').getBoundingClientRect();
      return { titleTop: title.top, titleBottom: title.bottom, ctaTop: cta.top, ctaBottom: cta.bottom, viewport: innerHeight };
    });
    check(result, `grid-caption-reachable-by-native-scroll-${item.slug}`, caption.titleTop >= -3 && caption.titleBottom > 0 && caption.ctaTop >= 0 && caption.ctaBottom <= caption.viewport + 3, caption);
  }
  const layout = await page.locator('.project-grid-list').evaluate(list => Array.from(list.querySelectorAll('.project-grid-item')).map(item => {
    const style = getComputedStyle(item);
    const box = item.getBoundingClientRect();
    const frameNode = item.querySelector('.project-card-frame');
    const frame = frameNode.getBoundingClientRect();
    const declared = frameNode.style.aspectRatio.split('/').map(Number);
    return { start: style.gridColumnStart, span: style.gridColumnEnd, row: style.gridRowStart, side: item.dataset.gridSide, margin: parseFloat(style.marginTop), left: box.left, right: box.right, width: box.width, parentWidth: list.clientWidth, ratio: frame.width / frame.height,
      preferredRatio: declared.length === 2 ? declared[0] / declared[1] : declared[0],
      mediaKind: frameNode.querySelector('.key-visual') ? 'conceptual' : frameNode.querySelector('img') ? 'image' : 'placeholder' };
  }));
  if (settings.width >= 1024) {
    const slots = [[1, 7, 1], [8, 5, 1], [1, 5, 2], [6, 7, 2], [1, 4, 3], [5, 4, 3], [9, 4, 3]];
    check(result, 'desktop-twelve-column-index-pattern', layout.every((item, index) => { const slot = slots[index % 7]; return Number(item.start) === slot[0] && item.span === `span ${slot[1]}` && Number(item.row) === Math.floor(index / 7) * 3 + slot[2]; }), layout);
  } else {
    check(result, 'mobile-alternates-88-left-78-right', layout.every((item, index) => Math.abs(item.width / item.parentWidth - (index % 2 ? .78 : .88)) <= .015 && item.side === (index % 2 ? 'right' : 'left')), layout);
  }
  const ratios = [4 / 5, 16 / 10, 1, 3 / 2];
  // Preferred schema ratios remain declared for every slot. Real covers keep
  // those physical ratios; conceptual reading content may grow with its legend.
  // Its caption/legend/SVG bounds are checked above at normal and doubled text.
  check(result, 'mixed-preferred-media-ratios-declared', layout.every((item, index) => Math.abs(item.preferredRatio - ratios[index % 4]) < .015), layout);
  check(result, 'real-covers-and-placeholders-keep-actual-mixed-ratios', layout.every((item, index) => item.mediaKind === 'conceptual'
    || Math.abs(item.ratio - ratios[index % 4]) < .015), { realCovers: layout.filter(item => item.mediaKind === 'image').length,
    placeholders: layout.filter(item => item.mediaKind === 'placeholder').length, conceptual: layout.filter(item => item.mediaKind === 'conceptual').length, layout });
  const candidates = await page.locator('#todos-los-proyectos [data-project-parallax]').count();
  check(result, 'parallax-has-at-most-three-candidates', candidates <= 3, candidates);
  if (!settings.noJS && !settings.reduced) {
    const first = page.locator('#todos-los-proyectos .project-card-link').first();
    await show(page, '#todos-los-proyectos .project-card-link', 112, 1800);
    if (settings.width >= 1024) await first.hover();
    await accessibility(page, result, 'grid-hover');
    await page.keyboard.press('Tab');
    await first.focus();
    check(result, 'grid-native-focus-and-outline', await first.evaluate(node => node === document.activeElement && getComputedStyle(node).outlineStyle !== 'none' && !node.closest('[inert]')));
    await accessibility(page, result, 'grid-focus');
  }
}
async function separatorChecks(page, result, settings) {
  await show(page, '[data-brand-separator]', 140, 500);
  const band = page.locator('[data-brand-separator]').first();
  const button = band.locator('.brand-separator-pause');
  if (settings.noJS || settings.reduced) {
    check(result, 'static-band-complete-and-JS-control-hidden', await band.locator('.brand-separator-static').isVisible() && !await button.isVisible());
  } else {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => document.querySelector('[data-brand-separator]').dataset.separatorRunning === 'true', undefined, { timeout: 5000 });
    const heightBefore = await band.evaluate(node => node.getBoundingClientRect().height);
    await button.click();
    const stopped = await band.evaluate(node => ({ paused: node.dataset.separatorPaused, running: node.dataset.separatorRunning, x: node.querySelector('.brand-separator-track').style.transform }));
    await page.waitForTimeout(250);
    const later = await band.evaluate(node => ({ x: node.querySelector('.brand-separator-track').style.transform, height: node.getBoundingClientRect().height }));
    check(result, 'band-pause-stops-ticker-without-layout-change', stopped.paused === 'true' && stopped.running === 'false' && stopped.x === later.x && Math.abs(heightBefore - later.height) <= 1, { stopped, later });
    await button.click();
    await page.waitForFunction(() => document.querySelector('[data-brand-separator]').dataset.separatorRunning === 'true', undefined, { timeout: 5000 });
    check(result, 'band-resumes-on-native-button', await band.getAttribute('data-separator-paused') === 'false');
    await scroll(page, 0, 400);
    check(result, 'band-ticker-pauses-offscreen', await band.getAttribute('data-separator-running') === 'false');
    await show(page, '[data-brand-separator]', 140, 400);
  }
  await capture(page, result, 'brand-separator');
}
async function staticChecks(page, result) {
  const state = await page.evaluate(() => ({
    mode: document.querySelector('#proyectos').dataset.featuredMode,
    range: window.__sceneRanges?.featured ?? null,
    hiddenSlides: document.querySelectorAll('#proyectos [data-featured-slide][inert], #proyectos [data-featured-slide][aria-hidden="true"]').length,
    controlsVisible: Array.from(document.querySelectorAll('#proyectos [data-featured-direction]')).some(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'),
    stagePosition: getComputedStyle(document.querySelector('#proyectos .featured-stage')).position,
  }));
  check(result, 'fallback-is-complete-natural-flow', state.mode === 'flow' && state.range === null && state.hiddenSlides === 0 && !state.controlsVisible && !['fixed', 'sticky'].includes(state.stagePosition), state);
}
async function activate(page, result) {
  await show(page, '#proyectos', 200, 900);
  await page.waitForFunction(() => document.querySelector('#proyectos').dataset.featuredMode === 'arc' && document.querySelector('#proyectos').dataset.featuredReady === 'true', undefined, { timeout: 15000 });
  await show(page, '#todos-los-proyectos', 200, 800);
  await page.waitForFunction(() => document.querySelector('#todos-los-proyectos').dataset.projectsEnhanced === 'true', undefined, { timeout: 10000 });
  await show(page, '[data-brand-separator]', 140, 800);
  await page.waitForFunction(() => document.querySelector('[data-brand-separator]').dataset.separatorEnhanced === 'true', undefined, { timeout: 10000 });
  const state = await page.evaluate(() => ({ triggers: window.__stCount ?? null, range: window.__sceneRanges?.featured ?? null,
    mode: document.querySelector('#proyectos').dataset.featuredMode, pins: document.querySelectorAll('#proyectos .pin-spacer').length }));
  check(result, 'activated-arc-does-not-own-scroll-triggers-or-pin', state.range === null && state.pins === 0, state);
  result.states.push(state);
  return state;
}
async function footerToggle(page) {
  await scroll(page, await page.evaluate(() => document.documentElement.scrollHeight), 450);
  const toggle = page.locator('.motion-toggle');
  await toggle.waitFor({ state: 'visible', timeout: 8000 });
  await toggle.click();
}
async function warmEditorialOwners(page, result, label) {
  const owners = await page.locator('[data-editorial][id]').evaluateAll(roots => roots.map(root => root.id));
  for (const id of owners) {
    // Travel through the actual F7 owners before measuring a leak baseline.
    // Priming them near the viewport preserves their ordinary lazy activation.
    await show(page, `[data-editorial][id="${id}"]`, result.settings.height + 250, 250);
    await page.waitForFunction(id => {
      const root = document.getElementById(id);
      return root?.dataset.editorialLayoutReady === 'true' && Boolean(root.dataset.editorialProfile);
    }, id, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }
  // The footer visit is part of the ensuing real toggle journey as well.
  await scroll(page, await page.evaluate(() => document.documentElement.scrollHeight), 450);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  const warmed = await page.locator('[data-editorial][id]').evaluateAll(roots => roots.map(root => ({ id: root.id,
    layoutReady: root.dataset.editorialLayoutReady, profile: root.dataset.editorialProfile ?? null, ready: root.dataset.editorialReady ?? null })));
  (result.editorialWarmups ??= []).push({ label, owners: warmed });
  check(result, `all-real-editorial-owners-settled-before-${label}`, warmed.length === owners.length
    && warmed.every(owner => owner.layoutReady === 'true'
      && (['flow', 'lite', 'full'].includes(owner.profile)
        || (owner.id === 'herramientas' && owner.profile === 'marquee' && owner.ready === 'true'))), warmed);
}
async function motionCycles(page, result) {
  result.states = [];
  await scroll(page, 12, 300);
  let upperCount;
  for (let cycle = 1; cycle <= 3; cycle++) {
    await activate(page, result);
    await warmEditorialOwners(page, result, `cycle-${cycle}-baseline`);
    const full = await activate(page, result);
    assert.ok(typeof full.triggers === 'number', 'Trigger telemetry must be available.');
    upperCount ??= full.triggers;
    check(result, `full-cycle-${cycle}-does-not-grow-trigger-count`, full.triggers <= upperCount, { baseline: upperCount, current: full.triggers });
    await footerToggle(page);
    await page.waitForFunction(() => document.documentElement.dataset.motionTier === '0', undefined, { timeout: 8000 });
    await page.waitForTimeout(500);
    const reduced = await page.evaluate(() => {
      const layers = Array.from(document.querySelectorAll('#proyectos .featured-slide, #proyectos .featured-card-scale, #proyectos .featured-image-velocity, #proyectos .featured-image-dolly, #proyectos .featured-image-reveal, #proyectos .featured-image-parallax, #todos-los-proyectos .project-card-drift, #todos-los-proyectos .project-card-reveal-inner, .brand-separator-track'));
      return {
        triggers: window.__stCount ?? null, range: window.__sceneRanges?.featured ?? null,
        mode: document.querySelector('#proyectos').dataset.featuredMode,
        hiddenSlides: document.querySelectorAll('#proyectos [data-featured-slide][inert], #proyectos [data-featured-slide][aria-hidden="true"]').length,
        gridEnhanced: document.querySelector('#todos-los-proyectos').dataset.projectsEnhanced ?? null,
        bandEnhanced: document.querySelector('[data-brand-separator]').dataset.separatorEnhanced ?? null,
        staleTransforms: layers.filter(layer => { const transform = getComputedStyle(layer).transform; return transform !== 'none' && !new DOMMatrixReadOnly(transform).isIdentity; }).map(layer => layer.className),
      };
    });
    result.states.push(reduced);
    check(result, `reduced-cycle-${cycle}-cleans-pins-attrs-transforms-and-ticker`, reduced.triggers === 0 && reduced.range === null && reduced.mode === 'flow' && reduced.hiddenSlides === 0 && reduced.gridEnhanced === null && reduced.bandEnhanced === null && reduced.staleTransforms.length === 0, reduced);
    await footerToggle(page);
    await page.waitForFunction(() => Number(document.documentElement.dataset.motionTier) >= 2, undefined, { timeout: 8000 });
  }
  await activate(page, result);
  await page.setViewportSize({ width: 375, height: 667 });
  await show(page, '#proyectos', 200, 900);
  await page.waitForFunction(() => document.querySelector('#proyectos').dataset.featuredMode === 'arc' && !window.__sceneRanges?.featured, undefined, { timeout: 10000 });
  check(result, 'resize-mobile-preserves-native-arc-without-range', await page.locator('#proyectos').getAttribute('data-featured-mode') === 'arc');
  await geometry(page, result, 'resize-mobile', '#proyectos');
  await capture(page, result, 'resize-mobile');
  await page.setViewportSize({ width: 375, height: 450 });
  await show(page, '#proyectos', 104, 900);
  await page.waitForFunction(() => document.querySelector('#proyectos').dataset.featuredMode === 'flow', undefined, { timeout: 10000 });
  await staticChecks(page, result);
  await geometry(page, result, 'resize-short-readable-flow', '#proyectos');
  await capture(page, result, 'resize-short-flow');
  await page.setViewportSize({ width: 1440, height: 900 });
  await activate(page, result);
  await warmEditorialOwners(page, result, 'resize-desktop-comparison');
  await activate(page, result);
  const restored = await page.evaluate(() => ({ count: document.querySelectorAll('#proyectos [data-featured-slide]').length,
    triggers: window.__stCount, range: window.__sceneRanges?.featured ?? null,
    mode: document.querySelector('#proyectos').dataset.featuredMode, pins: document.querySelectorAll('#proyectos .pin-spacer').length }));
  check(result, 'resize-desktop-restores-arc-without-pins-or-duplicates', restored.count === expected.filter(project => project.featured).length
    && restored.range === null && restored.pins === 0 && restored.mode === 'arc' && restored.triggers <= upperCount, restored);
  await featuredIndex(page, 0);
  if (restored.count > 1) {
    await page.locator('#proyectos [data-featured-direction="1"]').click();
    await waitFeaturedIndex(page, 1);
    check(result, 'control-after-tier-and-resize-cycles-advances-once', await page.locator('#proyectos').getAttribute('data-featured-index') === '1');
  }
  await capture(page, result, 'resize-desktop');
}
async function nativeGridChecks(page, result, settings) {
  const grid = page.locator('#todos-los-proyectos');
  const initial = await grid.evaluate(root => ({
    tier: document.documentElement.dataset.motionTier,
    policy: root.dataset.gridMotionPolicy, intrinsic: root.dataset.gridIntrinsic,
    ready: root.dataset.narrativeLayoutReady ?? null, enhanced: root.dataset.projectsEnhanced ?? null,
    visibility: getComputedStyle(root).contentVisibility,
    intrinsicSize: getComputedStyle(root).containIntrinsicBlockSize,
    triggers: window.__stCount ?? 0,
  }));
  result.nativeGridInitial = initial;
  check(result, 'native-test-is-real-tier1', initial.tier === '1', initial);
  if (settings.nativeCV || settings.nativeKeyboard) check(result, 'distant-grid-CV-is-eligible-before-interaction',
    initial.policy === 'native-tier1' && initial.intrinsic === 'true' && initial.ready === null
    && initial.enhanced === null && initial.visibility === 'auto' && initial.intrinsicSize.includes('auto'), initial);
  await grid.evaluate(root => {
    window.__gridNativeQA = { firstReadyAt: null, firstEnhancedAt: null, readyAtEnhanced: null };
    const sample = () => {
      const state = window.__gridNativeQA;
      if (root.dataset.narrativeLayoutReady === 'true') state.firstReadyAt ??= performance.now();
      if (root.dataset.projectsEnhanced === 'true' && state.firstEnhancedAt === null) {
        state.firstEnhancedAt = performance.now();
        state.readyAtEnhanced = root.dataset.narrativeLayoutReady;
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(root, { attributes: true, attributeFilter: ['data-narrative-layout-ready', 'data-projects-enhanced'] });
    sample();
    window.__gridNativeQAStop = () => observer.disconnect();
  });
  try {
    if (settings.nativeKeyboard) {
      await page.keyboard.press('Tab');
      const unlocked = await grid.evaluate(root => ({ ready: root.dataset.narrativeLayoutReady,
        visibility: getComputedStyle(root).contentVisibility }));
      check(result, 'real-Tab-unlocks-layout-before-travel', unlocked.ready === 'true' && unlocked.visibility === 'visible', unlocked);
      let landed = false;
      for (let step = 0; step < 120; step += 1) {
        landed = await page.evaluate(() => Boolean(document.activeElement?.matches('#todos-los-proyectos .project-card-link')));
        if (landed) break;
        await page.keyboard.press('Tab');
      }
      check(result, 'real-keyboard-reaches-a-grid-link', landed);
    } else if (settings.nativeHash) {
      const target = await grid.evaluate(root => ({ target: root.matches(':target'), top: root.getBoundingClientRect().top,
        ready: root.dataset.narrativeLayoutReady, visibility: getComputedStyle(root).contentVisibility, viewport: innerHeight }));
      check(result, 'initial-hash-resolves-real-grid-layout', target.target && target.ready === 'true'
        && target.visibility === 'visible' && target.top < target.viewport && target.top > -20, target);
    } else {
      // A real input starts travel; measuring the section box does not read its skipped descendants.
      await page.mouse.wheel(0, 120);
      await show(page, '#todos-los-proyectos', 180, 250);
    }
    await page.waitForFunction(() => {
      const root = document.getElementById('todos-los-proyectos');
      return root?.dataset.projectsEnhanced === 'true' && root.dataset.projectsMotionMode === 'lite';
    }, undefined, { timeout: 15000 });
    const enhanced = await grid.evaluate(root => ({
      ...window.__gridNativeQA, ready: root.dataset.narrativeLayoutReady,
      mode: root.dataset.projectsMotionMode, visibility: getComputedStyle(root).contentVisibility,
      parallax: root.querySelectorAll('[data-project-parallax-active="true"]').length,
      triggers: window.__stCount ?? 0,
      otherTriggerOwners: Number(Boolean(window.__sceneRanges?.hero)) + Number(Boolean(window.__sceneRanges?.distance))
        + Number(document.querySelector('[data-brand-separator]')?.dataset.separatorEnhanced === 'true'),
    }));
    check(result, 'layout-unlocked-before-native-enhancement', enhanced.ready === 'true'
      && enhanced.readyAtEnhanced === 'true' && enhanced.firstReadyAt <= enhanced.firstEnhancedAt
      && enhanced.visibility === 'visible', enhanced);
    check(result, 'native-grid-does-not-add-scroll-triggers-or-mobile-parallax',
      enhanced.triggers <= enhanced.otherTriggerOwners && enhanced.parallax === 0, enhanced);
    const focusedLink = settings.nativeKeyboard ? page.locator('#todos-los-proyectos .project-card-link:focus')
      : grid.locator('.project-card-link').last();
    if (!settings.nativeKeyboard) await focusedLink.focus();
    const focused = await focusedLink.evaluate(link => {
      const frame = link.querySelector('.project-card-frame');
      const inner = link.querySelector('.project-card-reveal-inner');
      const box = link.getBoundingClientRect();
      const transform = getComputedStyle(inner).transform;
      return { active: document.activeElement === link, inert: Boolean(link.closest('[inert]')),
        clip: getComputedStyle(frame).clipPath, identity: transform === 'none' || new DOMMatrixReadOnly(transform).isIdentity,
        revealsRunning: [frame, inner].some(element => element.getAnimations().some(animation => ['running', 'paused'].includes(animation.playState))),
        visible: box.bottom > 0 && box.top < innerHeight, outline: getComputedStyle(link).outlineStyle };
    });
    check(result, 'focus-finishes-pending-or-active-reveal-on-the-real-link', focused.active && !focused.inert
      && focused.visible && focused.identity && !focused.revealsRunning
      && (focused.clip === 'none' || /^inset\(0(?:px|%)?(?:\s+0(?:px|%)?)*\)$/.test(focused.clip)), focused);
    await accessibility(page, result, 'native-focus');
    await capture(page, result, 'native-grid-focus');
    if (settings.nativeCV) {
      // Exercise a real same-document link. The hash disables CV before native target resolution.
      await show(page, '.project-grid-invitation-link', 120, 250);
      await page.locator('.project-grid-invitation-link').click();
      await page.waitForURL(url => url.hash === '#contacto');
      const contact = await page.locator('#contacto').evaluate(target => {
        const bounds = target.getBoundingClientRect();
        return { top: bounds.top, bottom: bounds.bottom, viewport: innerHeight };
      });
      check(result, 'real-contact-anchor-uses-unlocked-heights', contact.bottom > 0 && contact.top < contact.viewport, contact);
    }
  } finally {
    await page.evaluate(() => { window.__gridNativeQAStop?.(); delete window.__gridNativeQAStop; });
  }
}
async function runCase(settings) {
  const result = { name: settings.name, settings, checks: [], screenshots: [], geometry: [], consoleErrors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: settings.width, height: settings.height }, deviceScaleFactor: 1,
    isMobile: settings.width < 768, hasTouch: settings.width < 768,
    javaScriptEnabled: !settings.noJS, reducedMotion: settings.reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  page.on('pageerror', error => result.consoleErrors.push(error.message));
  try {
    await loaded(page, settings);
    const content = await semanticContent(page, result);
    if (settings.text200) check(result, 'actual-text-sizes-doubled', await enlargeText(page) > 0);
    if (settings.nativeCV || settings.nativeKeyboard || settings.nativeHash) await nativeGridChecks(page, result, settings);
    else if (settings.cleanup) await motionCycles(page, result);
    else {
      const profile = await primeFeatured(page, result, settings);
      if (profile.mode === 'flow') await staticChecks(page, result);
      await featuredCaptures(page, result, profile, content.featured.length);
      await featuredControls(page, result, profile, content.featured.length);
      await featuredSwipe(page, result, profile, content.featured.length);
      if (!settings.noJS) await accessibility(page, result, 'rest');
      else result.accessibilityNote = 'Axe runs in JS profiles; this no-JS profile checks actual server markup/geometry/native links without injected async document callbacks.';
      await gridChecks(page, result, settings, content);
      await separatorChecks(page, result, settings);
    }
  } catch (error) {
    check(result, 'execution-completed', false, error.stack ?? error.message);
    try { await capture(page, result, 'failure'); } catch { /* Keep the original failure. */ }
  } finally {
    check(result, 'no-browser-console-errors', result.consoleErrors.length === 0, result.consoleErrors);
    result.passed = result.checks.every(entry => entry.status === 'pass');
    await context.close();
  }
}

try {
  expected = await currentProjects();
  assert.ok(expected.length > 0 && expected.some(project => project.featured), 'F5 needs a real non-empty project dataset.');
  if (path.basename(outputDirectory) === 'projects-sixth') assert.ok(expected.length === 6
    && expected.some(project => project.slug === 'qa-prueba-de-estructura'), 'projects-sixth requires the real six-record source fixture before restoration.');
  report.expected = { projects: expected.length, featured: expected.filter(project => project.featured).length, grid: Math.min(8, expected.length), slugs: expected.map(project => project.slug) };
  const { chromium } = requireProject('@playwright/test');
  const axeModule = requireProject('@axe-core/playwright');
  AxeBuilder = axeModule.default ?? axeModule;
  const chromePath = process.env.CHROME_PATH;
  if (chromePath) assert.ok(existsSync(chromePath), `CHROME_PATH does not exist: ${chromePath}`);
  browser = await chromium.launch({ headless: !process.argv.includes('--headed'), ...(chromePath ? { executablePath: chromePath } : {}) });
  report.browser = { version: browser.version(), executablePath: chromePath ?? chromium.executablePath() };
  await mkdir(outputDirectory, { recursive: true });
  for (const name of selected) {
    await runCase(profiles.find(profile => profile.name === name));
    await writeFile(path.join(outputDirectory, 'summary.json'), JSON.stringify(report, null, 2));
  }
  report.passed = report.cases.every(result => result.passed);
} catch (error) {
  report.error = error.stack ?? error.message;
  console.error(report.error);
} finally {
  if (browser) await browser.close();
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Browser closed. F5 ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(outputDirectory, 'summary.json')}`);
  process.exitCode = report.passed ? 0 : 1;
}
