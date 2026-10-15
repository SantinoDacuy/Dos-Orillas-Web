import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Copy to repo/scripts. Uses a running production server, sequential contexts,
// real project source and actual navigation. Never starts a build or server.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(repository, 'package.json'));
const profiles = [
  ...[375, 768, 1024, 1440, 1920].map(width => ({ name: `width-${width}`, width, height: width < 768 ? 812 : 900, axe: width === 375 || width === 1440 })),
  { name: 'text200-320', width: 320, height: 812, text200: true },
  { name: 'text200-375', width: 375, height: 812, text200: true },
  { name: 'text200-1440', width: 1440, height: 900, text200: true },
  { name: 'short', width: 393, height: 450 },
  { name: 'reduced-375', width: 375, height: 812, reduced: true },
  { name: 'no-js-375', width: 375, height: 812, noJS: true },
  { name: 'activity-375', width: 375, height: 812, activity: true },
  { name: 'activity-1440', width: 1440, height: 900, activity: true },
];
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
if (process.argv.includes('--help')) {
  console.log('node scripts/qa-cases-extra.mjs [--url http://127.0.0.1:3000] [--cases ' + profiles.map(item => item.name).join(',') + '] [--out qa-results/F6/extra] [--data data/projects.ts]');
  console.log('Index and every case: five widths, 200% text, short/reduced/no-JS, captures/axe. Activity profiles use the real router via temporary native test anchors; no mocked route or motion state. CHROME_PATH supported.');
  process.exit(0);
}
const names = option('--cases', profiles.map(item => item.name).join(',')).split(',');
assert.ok(names.length && names.every(name => profiles.some(item => item.name === name)), 'Unknown --cases.');
const selected = profiles.filter(item => names.includes(item.name));
const baseURL = option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000');
const output = path.resolve(repository, option('--out', 'qa-results/F6/extra'));
const report = { phase: 'F6', baseURL, createdAt: new Date().toISOString(), browser: null,
  scope: 'Case/index layout and active ARIA/SVG references after real cached navigation',
  limitations: 'Axe incomplete entries and screenshot contrast require visual review. Hidden Activity duplicate IDs are recorded, not treated as failures unless an active reference resolves to the hidden instance.',
  cases: [], errors: [], passed: false };
let browser;
let AxeBuilder;
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
  assert.ok(Array.isArray(transpiledModule.exports.projects) && transpiledModule.exports.projects.length > 0, 'Nonempty real projects export required.');
  return [...transpiledModule.exports.projects].sort((a, b) => a.order - b.order);
}
function check(result, name, condition, detail) {
  const passed = Boolean(condition);
  result.checks.push({ name, status: passed ? 'pass' : 'fail', ...(detail === undefined ? {} : { detail }) });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${result.name}: ${name}`);
}
async function visible(page, selector) {
  const matches = page.locator(selector);
  for (let index = 0; index < await matches.count(); index += 1) {
    const candidate = matches.nth(index);
    if (await candidate.evaluate(element => element.getClientRects().length > 0)) return candidate;
  }
  throw new Error(`No visible instance: ${selector}`);
}
async function settle(page, noJS = false) {
  if (!noJS) {
    await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true', null, { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector('.project-transition-clone,.project-transition-curtain'), null, { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
  }
  // JavaScript-disabled contexts cannot execute asynchronous page callbacks.
  await page.waitForTimeout(noJS ? 450 : 250);
}
async function show(page, selector) {
  const target = await visible(page, selector);
  await target.evaluate(element => {
    const y = Math.max(0, element.getBoundingClientRect().top + scrollY - 110);
    window.__lenis?.resize();
    window.__lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo({ top: y, behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  return target;
}
async function capture(page, result, label) {
  const filename = `${result.name}-${label}.png`;
  await page.screenshot({ path: path.join(output, filename), fullPage: false });
  result.screenshots.push(filename);
}
function contrastRatio(foreground, background) {
  const luminance = value => {
    const channels = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    if (channels.length !== 3) return null;
    const linear = channels.map(channel => {
      const normalized = channel / 255;
      return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return a === null || b === null ? null : (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
async function initialNavPalette(page, result, label, casePage, { homePage = false } = {}) {
  const state = await page.evaluate(() => {
    const nav = Array.from(document.querySelectorAll('.site-nav')).find(element => element.getClientRects().length > 0);
    const hero = Array.from(document.querySelectorAll('.case-hero,#estudio')).find(element => element.getClientRects().length > 0);
    const index = Array.from(document.querySelectorAll('#projects-index')).find(element => element.getClientRects().length > 0);
    const navStyle = nav && getComputedStyle(nav);
    const shell = document.querySelector('.site-shell');
    const logo = nav?.querySelector('.nav-logo-dark');
    // This is test-driver inspection, outside the production ThemeController.
    // No application layout read or initial theme bootstrapping is added.
    const opaque = navStyle?.backgroundColor && !['rgba(0, 0, 0, 0)', 'transparent'].includes(navStyle.backgroundColor);
    return { pathname: location.pathname, y: scrollY, navColor: navStyle?.color ?? null,
      background: opaque ? navStyle.backgroundColor : getComputedStyle(hero ?? index ?? document.body).backgroundColor,
      logoFilter: logo ? getComputedStyle(logo).filter : null,
      caseFlag: shell?.getAttribute('data-case') ?? null, homeFlag: shell?.getAttribute('data-home') ?? null,
      themeStarted: document.documentElement.dataset.currentTheme ?? null,
      navDataset: document.documentElement.dataset.nav ?? null,
      navExists: Boolean(nav), caseExists: Boolean(hero?.classList.contains('case-hero')) };
  });
  const darkHeader = casePage || homePage;
  const expectedColor = darkHeader ? 'rgb(242, 238, 230)' : 'rgb(17, 17, 17)';
  const ratio = state.navColor && state.background ? contrastRatio(state.navColor, state.background) : null;
  result.initialNavPalettes.push({ label, ...state, ratio });
  check(result, `${label}: initial Nav palette matches the real route`, state.navExists && state.y === 0
    && state.caseExists === casePage
    && state.navColor === expectedColor && (darkHeader ? state.logoFilter?.includes('invert(1)') : state.logoFilter === 'none'), { ...state, expectedColor });
  check(result, `${label}: initial Nav text contrast meets AA`, ratio !== null && ratio >= 4.5, { ratio, color: state.navColor, background: state.background });
}
async function doubleText(page, selector) {
  const target = await visible(page, selector);
  return target.evaluate(root => {
    const elements = [root, ...root.querySelectorAll('h1,h2,h3,p,dd,dt,a,li,span')]
      .filter(element => !element.closest('svg,.sr-only') && element.getClientRects().length > 0);
    const sizes = elements.map(element => ({ element, original: parseFloat(getComputedStyle(element).fontSize) }));
    for (const { element, original } of sizes) element.style.fontSize = `${original * 2}px`;
    return sizes.filter(({ element, original }) => Math.abs(parseFloat(getComputedStyle(element).fontSize) - original * 2) > .5)
      .map(({ element, original }) => ({ tag: element.tagName, original, applied: parseFloat(getComputedStyle(element).fontSize) }));
  });
}
async function inspect(page, result, selector, label, { referencesOnly = false } = {}) {
  const root = await visible(page, selector);
  const value = await root.evaluate((root, { referencesOnly }) => {
    const isPageActive = element => {
      const owner = element.closest('[data-project-case],#projects-index,[data-page-pathname],[data-scene]');
      return owner ? owner.getClientRects().length > 0 : !element.closest('[hidden],[aria-hidden="true"]');
    };
    const references = [];
    const nodes = [...root.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')];
    if (root.matches('[aria-labelledby],[aria-describedby],[aria-controls]')) nodes.unshift(root);
    for (const element of nodes) {
      if (!element.getClientRects().length || !isPageActive(element) || element.closest('[hidden],[inert],[aria-hidden="true"]')) continue;
      for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
        for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) {
          const target = document.getElementById(id);
          references.push({ attribute, id, source: element.tagName + '.' + element.className,
            found: Boolean(target), active: Boolean(target && isPageActive(target)),
            inOwnRoot: Boolean(target && root.contains(target)), targetText: target?.textContent?.trim().slice(0, 160) ?? null });
        }
      }
    }
    const svgReferences = [];
    for (const element of root.querySelectorAll('svg [marker-end],svg [marker-start],svg [clip-path],svg [mask],svg [fill],svg [filter],svg use[href]')) {
      if (!element.getClientRects().length || !isPageActive(element) || element.closest('svg')?.closest('[hidden],[inert],[aria-hidden="true"]')) continue;
      for (const attribute of ['marker-end', 'marker-start', 'clip-path', 'mask', 'fill', 'filter', 'href']) {
        const text = element.getAttribute(attribute) ?? '';
        const id = text.match(/url\(["']?#([^"')]+)["']?\)/)?.[1] ?? (attribute === 'href' && text.startsWith('#') ? text.slice(1) : null);
        if (!id) continue;
        const target = document.getElementById(id);
        svgReferences.push({ id, attribute, found: Boolean(target), active: Boolean(target && isPageActive(target)),
          sameSVG: Boolean(target && element.closest('svg') === target.closest('svg')) });
      }
    }
    const duplicates = [];
    const counts = new Map();
    for (const element of document.querySelectorAll('[id]')) {
      const list = counts.get(element.id) ?? [];
      list.push({ visible: element.getClientRects().length > 0, active: isPageActive(element), tag: element.tagName });
      counts.set(element.id, list);
    }
    for (const [id, instances] of counts) if (instances.length > 1) duplicates.push({ id, instances });
    const badText = [];
    let fragments = 0;
    for (const element of referencesOnly ? [] : root.querySelectorAll('h1,h2,h3,p,dd,a,.case-technology-list li,.case-next-title')) {
      if (!element.getClientRects().length || element.closest('svg,.sr-only,[hidden],[inert]')) continue;
      const elementBox = element.getBoundingClientRect();
      if (elementBox.bottom <= 0 || elementBox.top >= innerHeight) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent?.trim() || node.parentElement?.closest('svg,.sr-only')) continue;
        if (node.parentElement?.closest('[aria-hidden="true"]') && !node.parentElement.closest('h1,h3')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rectangle of range.getClientRects()) {
          if (rectangle.width < .5 || rectangle.height < .5) continue;
          fragments += 1;
          if (rectangle.left < -1 || rectangle.right > innerWidth + 1) badText.push({ reason: 'viewport', text: node.textContent.trim(), left: rectangle.left, right: rectangle.right });
          for (let ancestor = node.parentElement; ancestor && root.contains(ancestor); ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            const box = ancestor.getBoundingClientRect();
            if (['hidden', 'clip'].includes(style.overflowX) && (rectangle.left < box.left - 1 || rectangle.right > box.right + 1)) badText.push({ reason: 'horizontal clip', text: node.textContent.trim(), ancestor: ancestor.className });
            if (['hidden', 'clip'].includes(style.overflowY) && (rectangle.top < box.top - 2 || rectangle.bottom > box.bottom + 2)) badText.push({ reason: 'vertical clip', text: node.textContent.trim(), ancestor: ancestor.className });
          }
        }
      }
    }
    const pageRoots = Array.from(document.querySelectorAll('[data-project-case],#projects-index,#estudio')).map(element => ({
      id: element.id || null, slug: element.getAttribute('data-project-case'), pathname: element.getAttribute('data-page-pathname'),
      visible: element.getClientRects().length > 0,
    }));
    return { width: innerWidth, htmlWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, pageRoots,
      h1: Array.from(document.querySelectorAll('main h1')).filter(element => element.getClientRects().length > 0)
        .map(element => element.getAttribute('aria-label') ?? element.textContent.trim()),
      references, svgReferences, duplicates, fragments, badText,
      rootPath: root.getAttribute('data-page-pathname'), rootCase: root.getAttribute('data-project-case'),
      overlays: document.querySelectorAll('.project-transition-clone,.project-transition-curtain').length };
  }, { referencesOnly });
  result.snapshots.push({ label, ...value });
  if (!referencesOnly) check(result, `${label}: one visible h1 and no horizontal overflow`, value.h1.length === 1 && value.htmlWidth <= value.width + 1 && value.bodyWidth <= value.width + 1, { width: value.width, htmlWidth: value.htmlWidth, bodyWidth: value.bodyWidth, h1: value.h1 });
  check(result, `${label}: active ARIA references resolve inside the current page`, value.references.every(item => item.found && item.active && item.inOwnRoot), value.references.filter(item => !item.found || !item.active || !item.inOwnRoot));
  check(result, `${label}: active SVG references resolve to their own diagram`, value.svgReferences.every(item => item.found && item.active && item.sameSVG), value.svgReferences.filter(item => !item.found || !item.active || !item.sameSVG));
  if (!referencesOnly) check(result, `${label}: text remains unmasked and readable`, value.fragments > 0 && value.badText.length === 0, value.badText);
  check(result, `${label}: transition overlays cleaned`, value.overlays === 0, value.overlays);
  return value;
}
async function axe(page, result, selector, label) {
  // A fresh document has one page instance. Activity profiles use explicit
  // reference checks instead of selecting a hidden duplicate with axe.include.
  const analysis = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const filename = `${result.name}-${label}-axe.json`;
  await writeFile(path.join(output, filename), JSON.stringify(analysis, null, 2));
  result.axe.push({ file: filename, violations: analysis.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })),
    incomplete: analysis.incomplete.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })) });
  check(result, `${label}: axe reports no WCAG A/AA violations`, analysis.violations.length === 0, result.axe.at(-1));
}
async function inspectIndex(page, result, profile) {
  const response = await page.goto(`${baseURL}/projects`, { waitUntil: 'networkidle', timeout: 30000 });
  check(result, 'index HTTP 200', response?.status() === 200, response?.status());
  await settle(page, profile.noJS);
  await initialNavPalette(page, result, 'index', false);
  if (profile.text200) check(result, 'index uses measured 200% text', (await doubleText(page, '#projects-index')).length === 0);
  const root = await visible(page, '#projects-index');
  const actual = await root.locator('.project-card-link').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), labelledby: link.getAttribute('aria-labelledby') })));
  check(result, 'index contains the actual ordered project array', JSON.stringify(actual.map(item => item.href)) === JSON.stringify(projects.map(item => `/projects/${item.slug}`)), actual);
  check(result, 'index cards use a page-specific ARIA prefix', actual.every(item => item.labelledby?.startsWith('projects-index-grid-')), actual);
  await capture(page, result, 'index-start');
  for (let index = 0; index < projects.length; index += 1) {
    await show(page, `#projects-index [data-project-slug="${projects[index].slug}"]`);
    await inspect(page, result, '#projects-index', `index card ${index + 1}`);
  }
  await capture(page, result, 'index-last');
  if (profile.axe) await axe(page, result, '#projects-index', 'index');
}
async function inspectProject(page, result, profile, project) {
  const selector = `[data-project-case="${project.slug}"]`;
  const response = await page.goto(`${baseURL}/projects/${project.slug}`, { waitUntil: 'networkidle', timeout: 30000 });
  check(result, `${project.slug}: HTTP 200`, response?.status() === 200, response?.status());
  await settle(page, profile.noJS);
  await initialNavPalette(page, result, project.slug, true);
  if (profile.text200) check(result, `${project.slug}: measured 200% text`, (await doubleText(page, selector)).length === 0);
  await inspect(page, result, selector, `${project.slug} Hero`);
  await capture(page, result, `${project.slug}-hero`);
  const root = await visible(page, selector);
  const chapters = await root.locator('[data-project-chapter]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.projectChapter, hash: node.id })));
  check(result, `${project.slug}: public chapter fragments preserved`, chapters.every(item => item.hash === `project-${item.id}`), chapters);
  for (const chapter of chapters) {
    await show(page, `${selector} [data-project-chapter="${chapter.id}"]`);
    await inspect(page, result, selector, `${project.slug} ${chapter.id}`);
  }
  await capture(page, result, `${project.slug}-chapters`);
  if (await root.locator('[data-project-next]').count()) {
    await show(page, `${selector} [data-project-next]`);
    await inspect(page, result, selector, `${project.slug} Next`);
    await capture(page, result, `${project.slug}-next`);
  }
  if (profile.axe) await axe(page, result, selector, project.slug);
}

async function routerNavigate(page, href) {
  // There is intentionally no public debug link. A temporary native anchor
  // reaches the production document click listener/router, exercising RSC and
  // Activity rather than replacing history/state or mocking page instances.
  const url = new URL(href, baseURL);
  await page.evaluate(href => {
    document.querySelector('[data-case-navigation-probe]')?.remove();
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = 'QA de navegación';
    anchor.dataset.caseNavigationProbe = 'true';
    Object.assign(anchor.style, { position: 'fixed', top: '4px', left: '4px', zIndex: '2147483647', padding: '8px', background: '#fff', color: '#000' });
    document.body.append(anchor);
  }, `${url.pathname}${url.search}${url.hash}`);
  await page.locator('[data-case-navigation-probe]').click();
  await page.waitForURL(candidate => candidate.pathname === url.pathname && candidate.search === url.search && candidate.hash === url.hash, { timeout: 15000 });
  await page.evaluate(() => document.querySelector('[data-case-navigation-probe]')?.remove());
  await settle(page);
}
async function menuState(page, result, label, expectedOpen) {
  const state = await page.evaluate(() => {
    const dialog = document.querySelector('dialog.mobile-menu');
    const toggle = document.querySelector('.menu-toggle');
    const target = document.getElementById(toggle?.getAttribute('aria-controls') ?? '');
    return { open: dialog?.open ?? false, expanded: toggle?.getAttribute('aria-expanded'),
      targetIsDialog: target === dialog, menuFlag: document.documentElement.dataset.menuOpen ?? null,
      overflow: document.documentElement.style.overflow,
      activeMainsInert: Array.from(document.querySelectorAll('main')).filter(element => element.getClientRects().length > 0).map(element => element.inert) };
  });
  check(result, `${label}: dialog and aria-expanded agree`, state.open === expectedOpen && state.expanded === String(expectedOpen) && state.targetIsDialog, state);
  check(result, `${label}: modal document state restored`, expectedOpen ? state.menuFlag === 'true' && state.activeMainsInert.every(Boolean)
    : state.menuFlag === null && state.overflow !== 'clip' && state.activeMainsInert.every(value => !value), state);
}
async function openMenu(page, result, label) {
  await page.locator('.menu-toggle').click();
  await page.locator('dialog.mobile-menu').waitFor({ state: 'visible' });
  await page.waitForTimeout(1200);
  await menuState(page, result, label, true);
}
async function rootReferenceCheck(page, result, label) {
  const selector = await page.evaluate(() => location.pathname === '/' ? 'main' : location.pathname === '/projects'
    ? '#projects-index' : `[data-project-case="${location.pathname.split('/').at(-1)}"]`);
  await inspect(page, result, selector, label, { referencesOnly: selector === 'main' });
}
async function publicCaseHash(page, result, slug, label) {
  const root = await visible(page, `[data-project-case="${slug}"]`);
  const link = root.locator('.case-scroll-link');
  if (!await link.count()) return;
  await link.click();
  await page.waitForTimeout(1600);
  const state = await root.evaluate(root => {
    const target = root.querySelector('#project-body');
    const box = target?.getBoundingClientRect();
    const nativeTarget = document.getElementById('project-body');
    return { hash: location.hash, top: box?.top, bottom: box?.bottom, height: innerHeight,
      nativeTargetInCurrentPage: Boolean(nativeTarget && root.contains(nativeTarget)), currentTargetVisible: Boolean(box && box.bottom > 88 && box.top < innerHeight) };
  });
  // Public fragment IDs may repeat in hidden Activity. The actual anchor must
  // still bring the active reading target into view; native resolution is saved
  // as evidence to locate failures rather than making duplication alone fail.
  check(result, `${label}: public body anchor reaches active content`, state.hash === '#project-body' && state.currentTargetVisible, state);
}
async function activityProfile(page, result, profile) {
  await page.goto(`${baseURL}/projects`, { waitUntil: 'networkidle' });
  await settle(page);
  await routerNavigate(page, '/');
  await initialNavPalette(page, result, 'Home before scroll', false, { homePage: true });
  await rootReferenceCheck(page, result, 'Home after index');
  await show(page, '#todos-los-proyectos');
  await inspect(page, result, '#todos-los-proyectos', 'Home grid after index');
  await routerNavigate(page, '/?debug=f6');
  await rootReferenceCheck(page, result, 'Home query Activity');
  await show(page, '#todos-los-proyectos');
  await inspect(page, result, '#todos-los-proyectos', 'Home grid query Activity');
  await routerNavigate(page, '/projects?debug=f6');
  await inspect(page, result, '#projects-index', 'index query with retained Home');
  await routerNavigate(page, `/projects/${projects[0].slug}`);
  await rootReferenceCheck(page, result, 'first case after index/Home');
  await routerNavigate(page, `/projects/${projects[1 % projects.length].slug}`);
  await rootReferenceCheck(page, result, 'second case with first retained');
  await publicCaseHash(page, result, projects[1 % projects.length].slug, 'second case');
  await routerNavigate(page, `/projects/${projects[1 % projects.length].slug}?debug=f6`);
  await rootReferenceCheck(page, result, 'case query Activity');
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForURL(url => url.pathname === `/projects/${projects[1 % projects.length].slug}` && !url.search);
  await settle(page);
  await rootReferenceCheck(page, result, 'case query browser Back');
  await page.goForward({ waitUntil: 'commit' });
  await page.waitForURL(url => url.search === '?debug=f6');
  await settle(page);
  await rootReferenceCheck(page, result, 'case query browser Forward');
  if (profile.width < 1024) {
    await openMenu(page, result, 'case menu open');
    await capture(page, result, 'case-menu-open');
    await axe(page, result, '.mobile-menu', 'case-menu');
    await page.locator('.mobile-menu-link[href="/#proyectos"]').click();
    await page.waitForURL(url => url.pathname === '/' && url.hash === '#proyectos');
    await settle(page);
    await menuState(page, result, 'menu navigation to Home', false);
    await rootReferenceCheck(page, result, 'Home after menu navigation');
    await openMenu(page, result, 'menu reopened after route');
    await page.keyboard.press('Escape');
    await page.locator('dialog.mobile-menu').waitFor({ state: 'hidden' });
    await menuState(page, result, 'Escape after cached route', false);
    await openMenu(page, result, 'menu before query route');
    // A browser route while modal is open must dispose it and restore the page.
    await page.evaluate(() => history.back());
    await page.waitForURL(url => url.pathname.startsWith('/projects/'));
    await settle(page);
    await menuState(page, result, 'browser Back closes modal', false);
    await rootReferenceCheck(page, result, 'case after modal browser Back');
  }
  await routerNavigate(page, '/projects');
  await inspect(page, result, '#projects-index', 'final retained index');
  await capture(page, result, 'activity-final-index');
}
async function runProfile(profile) {
  const result = { name: profile.name, checks: [], screenshots: [], snapshots: [], initialNavPalettes: [], axe: [], runtimeErrors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: 1,
    reducedMotion: profile.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: !profile.noJS });
  try {
    const page = await context.newPage();
    page.on('pageerror', error => result.runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.runtimeErrors.push(message.text()); });
    if (profile.activity) await activityProfile(page, result, profile);
    else {
      await inspectIndex(page, result, profile);
      for (const project of projects) await inspectProject(page, result, profile, project);
    }
  } catch (error) {
    check(result, 'profile completed', false, error.message);
    report.errors.push({ profile: profile.name, error: error.stack ?? error.message });
  } finally {
    check(result, 'no browser runtime errors', result.runtimeErrors.length === 0, result.runtimeErrors);
    await context.close();
  }
}
try {
  await mkdir(output, { recursive: true });
  projects = await readProjects();
  const { chromium } = requireProject('@playwright/test');
  AxeBuilder = requireProject('@axe-core/playwright').default;
  const installedChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  if (executablePath) assert.ok(existsSync(executablePath), `Chrome not found: ${executablePath}`);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const profile of selected) await runProfile(profile);
} catch (error) {
  report.errors.push({ error: error.stack ?? error.message });
} finally {
  await browser?.close();
  report.passed = report.errors.length === 0 && report.cases.length === selected.length
    && report.cases.every(result => result.checks.length > 0 && result.checks.every(item => item.status === 'pass'));
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`F6 extra: ${report.passed ? 'PASS' : 'FAIL'} — ${path.join(output, 'summary.json')}`);
  if (!report.passed) process.exitCode = 1;
}
