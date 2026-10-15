import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const staging = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = staging;
const requireRepo = createRequire(path.join(repo, 'package.json'));
const option = (name, fallback) => { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; };
const baseURL = new URL(option('--url', process.env.QA_BASE_URL ?? 'http://127.0.0.1:3000'));
if (!['127.0.0.1', 'localhost', '[::1]'].includes(baseURL.hostname)) throw new Error('Run only against the local integrated app. No public/network target is permitted.');
const output = path.resolve(option('--output', path.join(repo, 'qa-results/F7/contact')));
const report = { phase: 'F7', scope: 'contact-client-mocked', createdAt: new Date().toISOString(), executed: false, passed: false, baseURL: baseURL.href, browser: null, cases: [], checks: [], screenshots: [], errors: [], expectedAPIConsoleErrors: [], blockedExternalRequests: [], realEmailRequests: 0 };
const planned = [];
let browser;

// Read canonical copy, not an inline duplicate of the interface strings.
function contentModule(file, cache = new Map()) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
  const ts = requireRepo('typescript'); const transpiledModule = { exports: {} }; cache.set(file, transpiledModule);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const localRequire = request => {
    if (request !== '@/content/site') throw new Error(`Unexpected copy dependency: ${request}`);
    return contentModule(path.join(repo, 'content/site.ts'), cache);
  };
  new vm.Script(`(function(require,module,exports){${compiled}\n})`, { filename: file }).runInNewContext()(localRequire, transpiledModule, transpiledModule.exports);
  return transpiledModule.exports;
}
const { contactCopy, siteConfig } = contentModule(path.join(repo, 'content/site.ts'));
const feedbackFile = fs.existsSync(path.join(repo, 'content/contact-feedback.ts')) ? path.join(repo, 'content/contact-feedback.ts') : path.join(staging, 'content/contact-feedback.ts');
const { contactFeedback } = contentModule(feedbackFile);
const limitsFile = fs.existsSync(path.join(repo, 'lib/contact/limits.ts')) ? path.join(repo, 'lib/contact/limits.ts') : path.join(staging, 'lib/contact/limits.ts');
const { contactLimits } = contentModule(limitsFile);
const fixture = { name: 'Nombre QA', email: 'qa-visitor@example.test', organization: 'Organización QA', message: 'Mensaje sintético de QA. No debe enviarse a ningún proveedor.' };

async function runCase(name, width, options, run) {
  const { expect } = requireRepo('@playwright/test');
  const axeModule = requireRepo('@axe-core/playwright'); const AxeBuilder = axeModule.default ?? axeModule;
  const context = await browser.newContext({ viewport: { width, height: width === 375 ? 667 : 900 }, deviceScaleFactor: 1, reducedMotion: options.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: !options.noJS, serviceWorkers: 'block' });
  const state = { name, requests: [], queue: [], expectedAPIError: false, errors: [], releases: [], closing: false };
  await context.addInitScript(() => {
    try { sessionStorage.setItem('do-intro', '1'); } catch { /* No storage is needed by the no-JS alternative. */ }
    window.__qaClipboardWrites = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__qaClipboardWrites.push(text); } } });
    // Remember the first server-rendered contact section, before React's motion
    // classification. A later replacement can lose scroll, input and focus.
    const identity = window.__qaContactIdentity = { initial: null, replacements: 0 };
    let last = null;
    const observeContact = () => {
      const current = document.querySelector('#contacto');
      if (!current) return;
      identity.initial ??= current;
      if (last && last !== current) identity.replacements += 1;
      last = current;
    };
    new MutationObserver(observeContact).observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', observeContact, { once: true });
  });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== baseURL.origin) { report.blockedExternalRequests.push({ case: name, origin: url.origin }); state.errors.push('External request blocked by the local-only harness.'); await route.abort('blockedbyclient'); return; }
    if (url.pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(route.request().method())) { state.errors.push('API/mutating request escaped the page mock and was blocked.'); await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'unavailable' }) }); return; }
    await route.continue();
  });
  const page = await context.newPage();
  await page.route(url => url.origin === baseURL.origin && url.pathname === '/api/contact', async route => {
    const request = route.request();
    let payload = null;
    try { payload = request.postDataJSON(); } catch { state.errors.push('Contact request body is not valid JSON/form data.'); }
    if (request.method() !== 'POST') state.errors.push('Unexpected contact HTTP method; request still mocked.');
    state.requests.push({ method: request.method(), payload });
    const mock = state.queue.shift();
    if (!mock) state.errors.push('Unexpected contact submit; blocked with a mock 503.');
    try {
      if (mock?.wait) await mock.wait;
      if (mock?.abort) await route.abort('failed');
      else await route.fulfill({ status: mock?.status ?? 503, contentType: 'application/json', body: JSON.stringify(mock?.body ?? { ok: false, code: 'unavailable' }) });
    } catch (error) { if (!state.closing && !state.expectedAPIError) state.errors.push(`Mock fulfillment failed: ${String(error)}`); }
  });
  page.on('pageerror', error => state.errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    let api = false; try { api = new URL(message.location().url).pathname === '/api/contact'; } catch { /* Keep unknown locations as real errors. */ }
    if (api && state.expectedAPIError && /^Failed to load resource/.test(message.text())) report.expectedAPIConsoleErrors.push({ case: name, message: message.text() });
    else state.errors.push(message.text());
  });
  const check = async (label, assertion) => {
    try { await assertion(); report.checks.push({ name: `${name}: ${label}`, status: 'pass' }); }
    catch (error) { report.checks.push({ name: `${name}: ${label}`, status: 'fail', error: String(error) }); throw error; }
  };
  const capture = async label => { const filename = `${name}-${label}.png`; await page.locator('#contacto').screenshot({ path: path.join(output, filename), animations: 'disabled' }); report.screenshots.push(filename); };
  const axe = async label => { const findings = await new AxeBuilder({ page }).include('#contacto').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); await check(label, () => expect(findings.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([])); };
  try {
    const response = await page.goto(baseURL.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await check('HTTP local OK', () => expect(response?.ok()).toBe(true));
    const contact = page.locator('#contacto'); await contact.waitFor({ state: 'visible', timeout: 20000 });
    await contact.scrollIntoViewIfNeeded();
    if (!options.noJS) { await page.evaluate(() => document.fonts.ready); await expect(contact.locator('.contact-submit')).toBeEnabled({ timeout: 15000 }); }
    if (!options.noJS) await check('Contacto SSR conserva identidad durante hidratación', async () => {
      const identity = await page.evaluate(() => ({ connected: window.__qaContactIdentity?.initial?.isConnected,
        same: window.__qaContactIdentity?.initial === document.querySelector('#contacto'), replacements: window.__qaContactIdentity?.replacements }));
      expect(identity).toEqual({ connected: true, same: true, replacements: 0 });
    });
    const api = { page, context, contact, state, check, capture, axe, expect };
    await run(api);
    if (!options.noJS) await check('Interacción conserva el bloque y su foco/scroll', async () => {
      const identity = await page.evaluate(() => ({ connected: window.__qaContactIdentity?.initial?.isConnected,
        same: window.__qaContactIdentity?.initial === document.querySelector('#contacto'), replacements: window.__qaContactIdentity?.replacements }));
      expect(identity).toEqual({ connected: true, same: true, replacements: 0 });
    });
    await check('Sin errores JS/consola inesperados', () => expect(state.errors).toEqual([]));
    report.cases.push({ name, width, reduced: Boolean(options.reduced), noJS: Boolean(options.noJS), passed: true, mockedRequests: state.requests.length });
  } catch (error) {
    report.cases.push({ name, width, passed: false, error: String(error), mockedRequests: state.requests.length });
    report.errors.push({ case: name, message: String(error) });
    try { await capture('failure'); } catch { /* Contact may not have been integrated yet. */ }
  } finally {
    state.closing = true; for (const release of state.releases) release(); await context.close();
    if (state.errors.length) {
      const recorded = report.cases.find(item => item.name === name);
      if (recorded) { recorded.passed = false; recorded.consoleOrHarnessErrors = [...state.errors]; }
      report.errors.push({ case: name, message: 'Unexpected console/harness errors.', errors: [...state.errors] });
    }
  }
}

async function fill({ contact }, values = fixture) { for (const field of ['name', 'email', 'organization', 'message']) await contact.locator(`[name="${field}"]`).fill(values[field]); }
async function reading({ page, contact, check, expect }, label) {
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('#contacto'); const failures = []; const boxes = [];
    const selectors = 'h2,h3,label,.contact-channel-label,.contact-email,.contact-instagram,.contact-location,.contact-helper,.contact-field-error,.contact-nojs,.contact-email-alternative,button,input:not([name="website"]),textarea';
    for (const element of root.querySelectorAll(selectors)) {
      const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || style.display === 'none' || style.visibility === 'hidden') continue;
      if (rect.left < -1 || rect.right > innerWidth + 1) failures.push(`${element.tagName}: box outside viewport width`);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(walker.currentNode);
        for (const line of range.getClientRects()) {
          if (line.left < -2 || line.right > innerWidth + 2) failures.push(`${element.tagName}: text outside viewport width`);
          for (let ancestor = element; ancestor && ancestor !== root.parentElement; ancestor = ancestor.parentElement) {
            const clipping = getComputedStyle(ancestor); const box = ancestor.getBoundingClientRect();
            if (['hidden', 'clip'].includes(clipping.overflowX) && (line.left < box.left - 2 || line.right > box.right + 2)) failures.push(`${element.tagName}: horizontal text clipping`);
            if (['hidden', 'clip'].includes(clipping.overflowY) && (line.top < box.top - 2 || line.bottom > box.bottom + 2)) failures.push(`${element.tagName}: vertical text clipping`);
          }
        }
      }
      boxes.push({ element, rect });
    }
    for (let a = 0; a < boxes.length; a += 1) for (let b = a + 1; b < boxes.length; b += 1) {
      if (boxes[a].element.contains(boxes[b].element) || boxes[b].element.contains(boxes[a].element)) continue;
      const first = boxes[a].rect; const second = boxes[b].rect;
      if (Math.min(first.right, second.right) - Math.max(first.left, second.left) > 2 && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 2) failures.push(`${boxes[a].element.tagName}/${boxes[b].element.tagName}: overlapping boxes`);
    }
    return { width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, failures };
  });
  await check(`${label}: overflow horizontal`, () => expect(Math.max(metrics.document, metrics.body)).toBeLessThanOrEqual(metrics.width + 1));
  await check(`${label}: lectura sin recortes/choques`, () => expect(metrics.failures).toEqual([]));
  await check(`${label}: mailto real disponible`, () => expect(contact.locator(`a[href="${siteConfig.emailHref}"]`).first()).toBeVisible());
}
async function fieldSemantics({ contact, check, expect }) {
  for (const field of ['name', 'email', 'organization', 'message']) {
    const input = contact.locator(`[name="${field}"]`); const label = contact.locator(`label[for="contact-${field}"]`);
    await check(`${field}: label visible`, async () => { await expect(label).toBeVisible(); await expect(label).toContainText(contactCopy.fields[field]); await expect(input).toHaveAttribute('id', `contact-${field}`); });
    if (field !== 'message') await check(`${field}: autocomplete`, () => expect(input).toHaveAttribute('autocomplete', field));
  }
  await check('Email inputmode', () => expect(contact.locator('[name="email"]')).toHaveAttribute('inputmode', 'email'));
  await check('Textarea helper asociado', () => expect(contact.locator('[name="message"]')).toHaveAttribute('aria-describedby', /contact-message-helper/));
  await check('Honeypot oculto y fuera de Tab', async () => { await expect(contact.locator('[name="website"]')).toBeHidden(); await expect(contact.locator('[name="website"]')).toHaveAttribute('tabindex', '-1'); });
}
async function validation(api) {
  const { contact, check, expect, state, axe } = api; const submit = contact.locator('.contact-submit');
  await submit.click(); const summary = contact.locator('.contact-error-summary');
  await check('Submit vacío: resumen focalizado', async () => { await expect(summary).toBeFocused(); await expect(summary).toHaveAttribute('role', 'alert'); await expect(summary).toContainText(contactCopy.errors.summary); });
  for (const field of ['name', 'email', 'message']) await check(`${field}: error ARIA asociado`, async () => {
    await expect(contact.locator(`[name="${field}"]`)).toHaveAttribute('aria-invalid', 'true'); await expect(contact.locator(`[name="${field}"]`)).toHaveAttribute('aria-describedby', new RegExp(`contact-${field}-error`)); await expect(contact.locator(`#contact-${field}-error`)).toHaveText(contactCopy.errors[field]);
  });
  await summary.locator('a[href="#contact-name"]').click(); await check('Link de resumen mueve foco al campo', () => expect(contact.locator('[name="name"]')).toBeFocused());
  await check('Campo focalizado con anillo visible y sin ocultarse bajo Nav', async () => {
    const focus = await contact.locator('[name="name"]').evaluate(input => {
      const style = getComputedStyle(input); const box = input.getBoundingClientRect();
      const fixed = Array.from(document.querySelectorAll('header,nav')).filter(element => {
        const rect = element.getBoundingClientRect();
        return ['fixed', 'sticky'].includes(getComputedStyle(element).position) && rect.top <= 1 && rect.bottom < innerHeight * .4 && rect.left < box.right && rect.right > box.left;
      });
      const ceiling = Math.max(0, ...fixed.map(element => element.getBoundingClientRect().bottom));
      return { ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 || style.boxShadow !== 'none', visible: box.top >= ceiling - 1 && box.bottom <= innerHeight + 1 };
    }); expect(focus.ring).toBe(true); expect(focus.visible).toBe(true);
  });
  await submit.click(); await check('Segundo submit inválido vuelve a focalizar resumen', () => expect(summary).toBeFocused());
  await check('Validación cliente no llama API', () => expect(state.requests).toHaveLength(0));
  await axe('Axe con errores visibles');
}

for (const width of [375, 1440]) planned.push({ name: `contact-${width}`, width, options: {}, run: async api => {
  const { page, contact, state, check, capture, axe, expect } = api;
  await fieldSemantics(api); await reading(api, 'Idle'); await axe('Axe idle'); await capture('idle');
  if (width === 1440) {
    await page.setViewportSize({ width: 1024, height: 900 });
    await contact.scrollIntoViewIfNeeded();
    await reading(api, 'Escritorio 1024');
    await check('1024: título de contacto completo en una línea', async () => {
      const lineCount = await contact.locator('h2').evaluate(heading => {
        const range = document.createRange(); range.selectNodeContents(heading);
        return [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0).length;
      });
      expect(lineCount).toBe(1);
    });
    await capture('1024-title');
    await page.setViewportSize({ width: 1440, height: 900 });
    await contact.scrollIntoViewIfNeeded();
  }
  await check('Instagram real y privacidad pendiente sin publicar', async () => {
    await expect(contact.locator('.contact-instagram')).toHaveAttribute('href', siteConfig.instagram.url);
    await expect(contact.locator('.contact-instagram')).toHaveText(siteConfig.instagram.handle);
    if (contactCopy.privacy === null) { await expect(contact.locator('.contact-privacy-notice')).toHaveCount(0); await expect(contact.locator('a[href="/privacidad"]')).toHaveCount(0); }
  });
  const copy = contact.locator('.contact-copy-button'); await copy.click();
  await check('Clipboard éxito sólo después de writeText', async () => { await expect(contact.locator('.contact-copy-notice')).toHaveText(contactCopy.emailCopied); expect(await page.evaluate(() => window.__qaClipboardWrites)).toEqual([siteConfig.email]); });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })); await copy.click();
  await check('Clipboard ausente: fallback sin falso copiado', () => expect(contact.locator('.contact-copy-notice')).toHaveText(contactFeedback.copyFailed));
  await validation(api); await fill(api); state.expectedAPIError = true;
  let release; const wait = new Promise(resolve => { release = resolve; }); state.releases.push(release);
  state.queue.push({ status: 503, body: { ok: false, code: 'unavailable' }, wait }); await contact.locator('.contact-submit').click();
  await check('Loading ocupado y controles desactivados', async () => {
    await expect(contact.locator('form')).toHaveAttribute('aria-busy', 'true'); await expect(contact.locator('.contact-submit')).toBeDisabled(); await expect(contact.locator('.contact-submit')).toHaveText(contactCopy.loading);
    for (const field of ['name', 'email', 'organization', 'message']) await expect(contact.locator(`[name="${field}"]`)).toBeDisabled(); await expect(contact.locator('.contact-form-island [role="status"]')).toHaveText(contactCopy.loading);
  });
  await contact.locator('form').evaluate(form => form.requestSubmit()); await check('Doble submit no duplica request en vuelo', () => expect(state.requests).toHaveLength(1));
  await capture('loading'); release();
  await check('503 no confirma envío y conserva formulario', async () => { await expect(contact.locator('.contact-error-summary')).toBeFocused(); await expect(contact.locator('.contact-error-summary')).toContainText(contactFeedback.unavailable); await expect(contact.locator('.contact-success')).toHaveCount(0); for (const field of Object.keys(fixture)) await expect(contact.locator(`[name="${field}"]`)).toHaveValue(fixture[field]); });
  await capture('unavailable');
  state.queue.push({ status: 503, body: { ok: false, code: 'unavailable' } }); await contact.locator('.contact-submit').click(); await expect(contact.locator('.contact-error-summary')).toBeFocused();
  await check('Retry sin editar conserva clave de idempotencia', () => expect(state.requests[1].payload.requestId).toBe(state.requests[0].payload.requestId));
  await check('Clave de idempotencia presente en Chrome local', () => expect(state.requests[0].payload.requestId).toMatch(/^[a-f0-9-]{36}$/i));
  await contact.locator('[name="organization"]').fill(`${fixture.organization} editada`);
  state.queue.push({ status: 400, body: { ok: false, code: 'invalid', errors: { email: contactCopy.errors.email } } }); await contact.locator('.contact-submit').click();
  await check('Error servidor: resumen/foco/ARIA', async () => { await expect(contact.locator('.contact-error-summary')).toBeFocused(); await expect(contact.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true'); await expect(contact.locator('#contact-email-error')).toHaveText(contactCopy.errors.email); });
  await check('Editar cambia la clave de idempotencia', () => expect(state.requests[2].payload.requestId).not.toBe(state.requests[1].payload.requestId));
  await fill(api); state.queue.push({ abort: true }); await contact.locator('.contact-submit').click();
  await check('Fallo de red conserva campos y ofrece email', async () => { await expect(contact.locator('.contact-error-summary')).toContainText(contactCopy.errors.network); for (const field of Object.keys(fixture)) await expect(contact.locator(`[name="${field}"]`)).toHaveValue(fixture[field]); });
  state.queue.push({ status: 504, body: { ok: false, code: 'timeout' } }); await contact.locator('.contact-submit').click(); await check('504 expresa aceptación incierta, sin éxito', () => expect(contact.locator('.contact-error-summary')).toContainText(contactFeedback.uncertain));
  state.queue.push({ status: 408, body: { ok: false, code: 'body_timeout' } }); await contact.locator('.contact-submit').click(); await check('408 lectura no afirma envío iniciado', () => expect(contact.locator('.contact-error-summary')).toContainText(contactFeedback.bodyTimeout));
  state.queue.push({ status: 202, body: { ok: false, code: 'discarded' } }); await contact.locator('.contact-submit').click();
  await check('Respuesta 2xx descartada no se confunde con envío', async () => { await expect(contact.locator('.contact-error-summary')).toContainText(contactFeedback.invalidRequest); await expect(contact.locator('form')).toBeVisible(); await expect(contact.locator('.contact-success')).toHaveCount(0); });
  await reading(api, 'Error'); await capture('error');
  state.queue.push({ status: 200, body: { ok: true, code: 'sent' } }); await contact.locator('.contact-submit').click();
  await check('Éxito confirmado reemplaza form y focaliza título', async () => { await expect(contact.locator('form')).toHaveCount(0); await expect(contact.locator('.contact-success h3')).toHaveText(contactCopy.success); await expect(contact.locator('.contact-success h3')).toBeFocused(); await expect(contact.locator('.contact-form-island [role="status"]')).toHaveText(contactCopy.success); });
  await axe('Axe success'); await reading(api, 'Success'); await capture('success');
} });

for (const width of [375, 1440]) planned.push({ name: `contact-reduced-${width}`, width, options: { reduced: true }, run: async api => {
  const { page, contact, check, expect, state } = api; await fieldSemantics(api); await validation(api);
  await check('Reduced tier0 y sin animación Contact', async () => { expect(await page.locator('html').getAttribute('data-motion-tier')).toBe('0'); expect(await contact.evaluate(root => root.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0); });
  await reading(api, 'Reduced'); await api.capture('visible'); await fill(api); state.expectedAPIError = true; state.queue.push({ status: 503, body: { ok: false, code: 'unavailable' } }); await contact.locator('.contact-submit').click(); await check('Reduced conserva funcionalidad/foco ante fallo', () => expect(contact.locator('.contact-error-summary')).toBeFocused());
} });
for (const width of [375, 1440]) planned.push({ name: `contact-nojs-${width}`, width, options: { noJS: true }, run: async api => {
  const { contact, page, check, expect, state } = api; await fieldSemantics(api);
  await check('Sin JS: submit/copia desactivados, email real legible', async () => { await expect(contact.locator('.contact-submit')).toBeDisabled(); await expect(contact.locator('.contact-copy-button')).toBeDisabled(); await expect(contact.locator('.contact-nojs')).toHaveText(contactFeedback.noJavaScript); await expect(contact.locator('.contact-email')).toHaveAttribute('href', siteConfig.emailHref); });
  await fill(api); await contact.locator('[name="name"]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  await check('Sin JS: Enter no publica datos al endpoint', () => expect(state.requests).toHaveLength(0));
  await reading(api, 'NoJS'); await api.capture('visible');
} });
for (const width of [375, 1440]) planned.push({ name: `contact-text200-${width}`, width, options: {}, run: async api => {
  const { page, contact, check, expect } = api; const before = await contact.locator('[name="name"]').evaluate(input => parseFloat(getComputedStyle(input).fontSize));
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' }); await contact.scrollIntoViewIfNeeded();
  await check('Texto200 aumenta fuente real del campo', async () => expect(await contact.locator('[name="name"]').evaluate(input => parseFloat(getComputedStyle(input).fontSize))).toBeGreaterThanOrEqual(before * 1.85));
  await fieldSemantics(api); await reading(api, 'Texto200'); await validation(api); await reading(api, 'Texto200 error'); await api.capture('visible');
} });
planned.push({ name: 'contact-client-timeout-375', width: 375, options: {}, run: async api => {
  const { contact, state, check, expect } = api; await fill(api); state.expectedAPIError = true;
  let release; const wait = new Promise(resolve => { release = resolve; }); state.releases.push(release); state.queue.push({ status: 503, body: { ok: false, code: 'unavailable' }, wait }); await contact.locator('.contact-submit').click();
  await check('Deadline cliente real conserva campos y expresa incertidumbre', async () => {
    await expect(contact.locator('.contact-error-summary')).toContainText(contactFeedback.uncertain, { timeout: contactLimits.clientTimeoutMs + 5000 }); await expect(contact.locator('.contact-error-summary')).toBeFocused(); await expect(contact.locator('.contact-submit')).toBeEnabled();
    for (const field of Object.keys(fixture)) await expect(contact.locator(`[name="${field}"]`)).toHaveValue(fixture[field]); await expect(contact.locator('.contact-success')).toHaveCount(0);
  }); release(); await api.capture('timeout');
} });

try {
  fs.mkdirSync(output, { recursive: true });
  const { chromium } = requireRepo('@playwright/test');
  const configured = process.env.CHROME_PATH; if (configured && !fs.existsSync(configured)) throw new Error('Configured CHROME_PATH does not exist; no browser was installed.');
  const installed = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = configured ?? (fs.existsSync(installed) ? installed : chromium.executablePath());
  if (!fs.existsSync(executablePath)) throw new Error('Chrome unavailable. Configure an existing CHROME_PATH; this script never installs it.');
  browser = await chromium.launch({ executablePath, headless: !process.argv.includes('--headed'), args: ['--window-size=1350,940', '--disable-background-networking'] });
  report.executed = true; report.browser = { version: browser.version(), executablePath, headed: process.argv.includes('--headed') };
  for (const item of planned) { process.stdout.write(`Contact QA: ${item.name}\n`); await runCase(item.name, item.width, item.options, item.run); }
  report.passed = report.cases.length === planned.length && report.cases.every(item => item.passed) && report.errors.length === 0 && report.blockedExternalRequests.length === 0;
} catch (error) { report.errors.push({ case: 'setup', message: String(error) }); }
finally {
  await browser?.close(); fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'contact-summary.json'), `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${report.passed ? 'PASS' : 'FAIL'}: ${report.cases.filter(item => item.passed).length}/${planned.length} cases; all contact API requests mocked.\n${path.join(output, 'contact-summary.json')}\n`);
process.exitCode = report.passed ? 0 : 1;
