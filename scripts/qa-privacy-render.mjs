import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Focused diagnosis only: privacy notFound versus an unknown route, JS/no-JS.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const requireProject = createRequire(path.join(repository, 'package.json'));
const { chromium } = requireProject('@playwright/test');
const output = path.resolve(repository, option('--out', 'qa-results/F8/privacy-render'));
assert.ok(!path.relative(repository, output).startsWith('..'), 'QA output must remain within the repository.');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const report = { createdAt: new Date().toISOString(), scope: 'Focused local privacy/unknown route diagnostic', cases: [], passed: false };
try {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 375, height: 812 } });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) await route.continue();
      else await route.abort();
    });
    for (const route of ['/privacidad', '/qa-puente-inexistente']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'domcontentloaded' });
      if (javaScriptEnabled) await page.waitForSelector('h1', { state: 'visible', timeout: 5000 }).catch(() => {});
      const details = await page.evaluate(() => ({ htmlID: document.documentElement.id, h1: [...document.querySelectorAll('h1')].map(heading => ({ text: heading.textContent, visible: heading.getClientRects().length > 0 })), main: document.querySelector('main')?.textContent, bodyText: document.body.innerText.slice(0, 600), shell: Boolean(document.querySelector('.site-shell')), robots: [...document.querySelectorAll('meta[name="robots"]')].map(meta => meta.content) }));
      const name = `${route.slice(1)}-${javaScriptEnabled ? 'js' : 'no-js'}`;
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      report.cases.push({ route, javaScriptEnabled, status: response?.status(), details, errors, passed: response?.status() === 404 && details.h1.length === 1 && details.h1[0].visible && details.robots.some(value => value.includes('noindex')) && errors.length === 0 });
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
report.passed = report.cases.every(entry => entry.passed);
await writeFile(path.join(output, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.passed ? 0 : 1;
