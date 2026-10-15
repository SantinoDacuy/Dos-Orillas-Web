import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phaseOption = process.argv.indexOf('--phase');
const phase = phaseOption < 0 ? 'F4' : process.argv[phaseOption + 1];
if (!/^F(?:[0-9]|10)$/.test(phase)) throw new Error('Use --phase F4 … F10.');
const output = path.join(root, 'qa-results', phase, 'narrative');
const url = process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000';
const report = { createdAt: new Date().toISOString(), phase, url, cases: [], passed: false };
let browser;
function check(result, name, pass, detail) {
  result.checks.push({ name, status: pass ? 'pass' : 'fail', detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${result.name}: ${name}${pass ? '' : ` ${JSON.stringify(detail ?? '')}`}`);
}
async function scroll(page, y) {
  await page.evaluate(position => {
    window.__lenis?.scrollTo(position, { immediate: true, force: true });
    window.scrollTo({ top: position, behavior: 'instant' });
  }, y);
  await page.waitForTimeout(950);
}
async function capture(page, result, suffix) {
  const filename = `${result.name}-${suffix}.png`;
  await page.screenshot({ path: path.join(output, filename), animations: 'disabled' });
  result.screenshots.push(filename);
}
async function inspectText(page, result, section, suffix) {
  const geometry = await page.locator(section).evaluate(element => {
    const clips = [];
    const fragments = [];
    const blocks = new Map();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode())) {
      if (!text.textContent.trim()) continue;
      const parent = text.parentElement;
      if (!parent || parent.closest('[aria-hidden="true"],.sr-only,script,style,noscript')) continue;
      let ancestor = parent;
      let hidden = false;
      let opacity = 1;
      const masks = [];
      while (ancestor && ancestor !== element.parentElement) {
        const style = getComputedStyle(ancestor);
        opacity *= Number(style.opacity);
        if (style.display === 'none' || style.visibility === 'hidden' || ancestor.hidden) hidden = true;
        if (['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)) {
          const box = ancestor.getBoundingClientRect();
          masks.push({ box, x: ['hidden', 'clip'].includes(style.overflowX), y: ['hidden', 'clip'].includes(style.overflowY) });
        }
        ancestor = ancestor.parentElement;
      }
      if (hidden || opacity < .55) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const block = parent.closest('h1,h2,h3,p,button,a') ?? parent;
      if (!blocks.has(block)) blocks.set(block, blocks.size + 1);
      for (const rect of range.getClientRects()) {
        const visible = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        for (const mask of masks) {
          if (mask.x) { visible.left = Math.max(visible.left, mask.box.left); visible.right = Math.min(visible.right, mask.box.right); }
          if (mask.y) { visible.top = Math.max(visible.top, mask.box.top); visible.bottom = Math.min(visible.bottom, mask.box.bottom); }
        }
        // Translated text beyond its reveal mask is not painted, so it cannot
        // overlap the reading layer. Inspect only the fragment actually visible.
        if (visible.right - visible.left <= 1 || visible.bottom - visible.top <= 1) continue;
        if (rect.width > 1 && (rect.left < -2 || rect.right > innerWidth + 2)) clips.push({ text: text.textContent.trim(), left: rect.left, right: rect.right });
        fragments.push({ text: text.textContent.trim(), block: blocks.get(block), ...visible });
      }
    }
    const clashes = [];
    for (let i = 0; i < fragments.length; i++) for (let j = i + 1; j < fragments.length; j++) {
      const a = fragments[i];
      const b = fragments[j];
      if (a.block === b.block) continue;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 3 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3) clashes.push({ a: a.text, b: b.text });
    }
    return { clips, clashes, viewport: innerWidth, document: document.documentElement.scrollWidth };
  });
  check(result, `ancho-${suffix}`, geometry.document <= geometry.viewport, geometry);
  check(result, `texto-sin-recortes-${suffix}`, geometry.clips.length === 0, geometry.clips);
  check(result, `texto-sin-solapamientos-${suffix}`, geometry.clashes.length === 0, geometry.clashes);
}
async function enlarge(page) {
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('body *')).filter(element => element instanceof HTMLElement && Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
    const sizes = items.map(element => [element, parseFloat(getComputedStyle(element).fontSize)]);
    for (const [element, size] of sizes) if (Number.isFinite(size)) element.style.setProperty('font-size', `${size * 2}px`, 'important');
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(1300);
}
async function runCase(options) {
  const { name, width, height = 900, reduced = false, noJS = false, zoom = false, touch = false } = options;
  const result = { name, options, checks: [], screenshots: [], errors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: !noJS, hasTouch: touch, isMobile: touch });
  if (!noJS) await context.addInitScript(() => sessionStorage.setItem('do-intro', '1'));
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('main h1').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    if (!noJS) await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true');
    if (zoom) await enlarge(page);
    for (const section of ['manifiesto', 'soluciones', 'proceso']) {
      await page.locator(`#${section}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      if (section !== 'proceso' || width < 1024 || reduced || noJS || zoom || height < 680) await inspectText(page, result, `#${section}`, section);
      await capture(page, result, section);
    }
    check(result, 'tres-secciones-unicas', await page.locator('#manifiesto,#soluciones,#proceso').count() === 3);
    check(result, 'lista-proceso-cuatro-etapas', await page.locator('#proceso ol > li').count() === 4);
    const descriptions = await page.locator('#soluciones').innerText();
    if (reduced || noJS) {
      check(result, 'soluciones-completas-fallback', ['Sitios web, experiencias digitales', 'Herramientas adaptadas', 'Conectar herramientas', 'Transformar información dispersa'].every(text => descriptions.includes(text)), descriptions);
      check(result, 'proceso-completo-fallback', await page.locator('#proceso').innerText().then(text => text.includes('Implementamos, probamos y acompañamos')));
      check(result, 'sin-pin-fallback', await page.locator('.pin-spacer').count() === 0);
    } else if (width < 1024 && !zoom) {
      const buttons = page.locator('#soluciones h3 button');
      check(result, 'cuatro-disparadores-acordeon', await buttons.count() === 4);
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        await button.scrollIntoViewIfNeeded();
        await button.focus();
        if (await button.getAttribute('aria-expanded') !== 'true') await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        const id = await button.getAttribute('aria-controls');
        check(result, `acordeon-${i}-aria`, Boolean(id) && await button.getAttribute('aria-expanded') === 'true' && await page.locator(`#${id}`).isVisible());
        check(result, `acordeon-${i}-exclusivo`, await buttons.evaluateAll(items => items.filter(item => item.getAttribute('aria-expanded') === 'true').length) === 1);
        check(result, `acordeon-${i}-foco`, await button.evaluate(element => element === document.activeElement));
        await inspectText(page, result, '#soluciones', `acordeon-${i}`);
        if (i === 2) await capture(page, result, 'acordeon-automatizacion');
      }
      await page.keyboard.press('Home');
      check(result, 'acordeon-home-foco-visible', await buttons.first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return document.activeElement === element && rect.top >= -2 && rect.bottom <= innerHeight + 2;
      }));
      await page.keyboard.press('ArrowUp');
      check(result, 'acordeon-arrow-wrap-foco-visible', await buttons.last().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return document.activeElement === element && rect.top >= -2 && rect.bottom <= innerHeight + 2;
      }));
    } else if (width >= 1024 && !reduced && !noJS && !zoom && height >= 680) {
      const button = page.locator('#soluciones h3 button').first();
      await button.scrollIntoViewIfNeeded();
      await button.focus();
      await page.waitForTimeout(800);
      const preview = page.locator('.solutions-row').first().locator('.solutions-media');
      const bounds = await preview.boundingBox();
      check(result, 'preview-focus-dentro-viewport', Boolean(bounds) && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, bounds);
      const focusedAxe = await new AxeBuilder({ page }).include('#soluciones').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const focusedSerious = focusedAxe.violations.filter(item => ['serious', 'critical'].includes(item.impact));
      check(result, 'preview-focus-contraste-aa', focusedSerious.length === 0, focusedSerious.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      await capture(page, result, 'preview-focus');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      check(result, 'preview-escape-conserva-foco', await button.evaluate(element => document.activeElement === element) && await page.locator('#soluciones').getAttribute('data-services-active') === 'false');
      await page.locator('main').evaluate(element => element.focus({ preventScroll: true }));
      await button.hover();
      await page.waitForTimeout(600);
      check(result, 'preview-hover-activa', await page.locator('#soluciones').getAttribute('data-services-active') === 'true');
      await page.keyboard.press('Escape');
      check(result, 'preview-hover-escape-global', await page.locator('#soluciones').getAttribute('data-services-active') === 'false');
    }
    if (!noJS) {
      await page.locator('#soluciones').scrollIntoViewIfNeeded();
      const axe = await new AxeBuilder({ page }).include('#manifiesto').include('#soluciones').include('#proceso').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = axe.violations.filter(item => ['serious', 'critical'].includes(item.impact));
      await writeFile(path.join(output, `${name}-axe.json`), JSON.stringify(axe, null, 2));
      check(result, 'axe-serias-criticas', serious.length === 0, serious.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
    }
    check(result, 'sin-errores-runtime', result.errors.length === 0, result.errors);
  } catch (error) {
    check(result, 'caso-completo', false, error.stack ?? error.message);
  } finally { await context.close(); }
}
async function runInteractions() {
  const result = { name: 'cadena-contador-cambios-tier', checks: [], screenshots: [], errors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => sessionStorage.setItem('do-intro', '1'));
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(error.message));
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.motionReady === 'true');
    await scroll(page, 12);
    await page.locator('#proceso').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Boolean(window.__sceneRanges?.process));
    const chain = await page.evaluate(() => {
      const a = document.querySelector('#soluciones').getBoundingClientRect();
      const b = document.querySelector('#proceso').getBoundingClientRect();
      return { gap: b.top - a.bottom, segments: Array.from(document.querySelectorAll('[data-bridge-chain]')).map(item => item.dataset.bridgeChain) };
    });
    check(result, 'frontera-soluciones-proceso-continua', Math.abs(chain.gap) < 2 && chain.segments.includes('solutions-exit') && chain.segments.includes('process-entry') && chain.segments.includes('process-exit'), chain);
    for (let index = 0; index < 4; index++) {
      const stage = page.locator(`#proceso [data-process-step="${index}"]`);
      if (index === 0) await stage.evaluate(element => element.focus({ preventScroll: true }));
      else await page.keyboard.press('Tab');
      await page.waitForTimeout(1300);
      const state = await page.evaluate(() => {
        const root = document.querySelector('#proceso');
        const stages = Array.from(root.querySelectorAll('[data-process-step]')).map(item => {
          const rect = item.getBoundingClientRect();
          return { index: Number(item.dataset.processStep), left: rect.left, right: rect.right, center: rect.left + rect.width / 2 };
        });
        const nearest = stages.reduce((a, b) => Math.abs(a.center - innerWidth / 2) < Math.abs(b.center - innerWidth / 2) ? a : b);
        return { index: Number(root.dataset.processIndex), nearest, stages, activeStep: document.activeElement?.dataset.processStep, mode: root.dataset.processMode };
      });
      check(result, `foco-etapa-${index}`, Number(state.activeStep) === index && state.nearest.index === index, state);
      check(result, `contador-etapa-${index}`, state.index === index, state);
      await capture(page, result, `etapa-${index}`);
    }
    check(result, 'pulso-final-completo', await page.locator('#proceso .process-pulse').evaluate(element => Number(getComputedStyle(element).opacity) <= .01));
    check(result, 'capitulo-soluciones-en-proceso', await page.locator('.scroll-progress-rail').getAttribute('data-chapter') === 'soluciones');
    check(result, 'tema-navy-en-proceso', await page.locator('html').getAttribute('data-current-theme') === 'navy');
    for (let cycle = 1; cycle <= 3; cycle++) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.documentElement.dataset.motionTier === '0');
      await page.waitForTimeout(500);
      check(result, `reduced-${cycle}-sin-pins`, await page.locator('.pin-spacer').count() === 0);
      check(result, `reduced-${cycle}-sin-triggers`, await page.evaluate(() => (window.__stCount ?? 0) === 0));
      check(result, `reduced-${cycle}-sin-rango-proceso`, await page.evaluate(() => !window.__sceneRanges?.process));
      check(result, `reduced-${cycle}-bridge-completa`, await page.locator('#proceso .process-progress-fill').evaluate(element => {
        const transform = getComputedStyle(element).transform;
        return transform === 'none' || new DOMMatrixReadOnly(transform).isIdentity;
      }));
      check(result, `reduced-${cycle}-soluciones-completas`, await page.locator('#soluciones').innerText().then(text => text.includes('Transformar información dispersa')));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(() => document.documentElement.dataset.motionTier === '2');
      await page.locator('#proceso').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Boolean(window.__sceneRanges?.process));
      check(result, `full-${cycle}-pin-proceso-unico`, await page.locator('#proceso .pin-spacer').count() === 1);
    }
    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForFunction(() => document.documentElement.dataset.motionTier === '1');
    await page.waitForTimeout(600);
    check(result, 'tablet-proceso-vertical', await page.locator('#proceso').getAttribute('data-process-mode') !== 'horizontal' && await page.locator('#proceso .pin-spacer').count() === 0);
    await page.locator('#proceso li:last-child').scrollIntoViewIfNeeded();
    await capture(page, result, 'tablet-vertical');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#proceso').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Boolean(window.__sceneRanges?.process));
    check(result, 'desktop-restaurado-un-pin', await page.locator('#proceso .pin-spacer').count() === 1);
    check(result, 'sin-errores-runtime', result.errors.length === 0, result.errors);
  } catch (error) { check(result, 'interacciones-completas', false, error.stack ?? error.message); }
  finally { await context.close(); }
}
try {
  await mkdir(output, { recursive: true });
  const executablePath = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const options of [
    { name: 'mobile-se', width: 375, height: 667, touch: true },
    { name: 'desktop', width: 1440 },
    { name: 'landscape', width: 720, height: 450, touch: true },
    { name: 'texto200-mobile', width: 375, height: 812, zoom: true, touch: true },
    { name: 'texto200-desktop', width: 1440, zoom: true },
    { name: 'reduced-mobile', width: 375, height: 812, reduced: true, touch: true },
    { name: 'reduced-desktop', width: 1440, reduced: true },
    { name: 'nojs-mobile', width: 375, height: 812, noJS: true },
    { name: 'nojs-tablet', width: 768, noJS: true },
    { name: 'nojs-desktop', width: 1440, noJS: true },
  ]) await runCase(options);
  await runInteractions();
} catch (error) { report.error = error.stack ?? error.message; }
finally {
  await browser?.close();
  report.passed = !report.error && report.cases.length === 11 && report.cases.every(item => item.checks.every(check => check.status === 'pass'));
  await writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
  console.log(`Narrativa ${phase}: ${report.passed ? 'PASS' : 'FAIL'}. ${output}`);
  if (!report.passed) process.exitCode = 1;
}
