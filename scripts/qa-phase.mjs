import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const phase = option("--phase", "F3");
if (!/^F(?:[0-9]|10)$/.test(phase ?? "")) throw new Error("Use --phase F0 … F10.");
const phaseNumber = Number(phase.slice(1));
const baseURL = option("--url", process.env.QA_BASE_URL ?? "http://127.0.0.1:3000");
const outputDirectory = path.join(projectRoot, "qa-results", phase);
const report = { phase, baseURL, createdAt: new Date().toISOString(), browser: null, checks: [], screenshots: [], errors: [] };
let browser;

function record(name, pass, detail) {
  report.checks.push({ name, status: pass ? "pass" : "fail", detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? `: ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
}

function skipped(name, detail) {
  report.checks.push({ name, status: "skipped", detail });
  console.log(`SKIP ${name}: ${detail}`);
}

async function ready(page, motion = true) {
  await page.waitForSelector("main h1", { state: "visible", timeout: 20000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).filter((image) => image.complete).map((image) => image.decode().catch(() => {})));
  });
  if (motion && phaseNumber >= 1) {
    await page.waitForFunction(() => {
      const html = document.documentElement;
      return html.dataset.motionReady === "true" || (html.dataset.motionTier !== undefined && !html.classList.contains("js-motion"));
    }, undefined, { timeout: 20000 });
  }
  await page.waitForTimeout(350);
}

async function nativeScroll(page, position) {
  await page.evaluate((y) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.__lenis?.scrollTo(y, { immediate: true, force: true });
    window.scrollTo({ top: y, behavior: "instant" });
  }, position);
  await page.waitForTimeout(1100);
}

async function checkOverflow(page, name) {
  const measurements = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  record(name, measurements.document <= measurements.viewport, measurements);
}

async function capture(page, name, fullPage = false) {
  const filename = `${name}.png`;
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage, animations: "disabled" });
  report.screenshots.push(filename);
}

async function checkMobileMenu(page) {
  const opener = page.getByRole("button", { name: "Abrir menú", exact: true });
  if (await opener.count() === 0) {
    if (phaseNumber < 2) skipped("mobile-menu", "El shell mobile corresponde a F2.");
    else record("mobile-menu", false, "No existe el botón accesible Abrir menú.");
    return;
  }
  await nativeScroll(page, 0);
  await opener.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(950);
  const focusableCount = await dialog.locator('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]').count();
  let trapped = true;
  for (let index = 0; index < focusableCount + 2; index += 1) {
    await page.keyboard.press("Tab");
    trapped &&= await dialog.evaluate((element) => element.contains(document.activeElement));
  }
  record("mobile-menu-focus-trap", focusableCount > 0 && trapped, { focusableCount });
  await page.keyboard.press("Shift+Tab");
  record("mobile-menu-reverse-trap", await dialog.evaluate((element) => element.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
  record("mobile-menu-escape-and-focus-return", await opener.evaluate((element) => element === document.activeElement));
}

async function runViewport(width, AxeBuilder) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 812 : 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => sessionStorage.setItem("do-intro", "1"));
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const response = await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    record(`http-${width}`, Boolean(response?.ok()), response?.status());
    await ready(page);
    await checkOverflow(page, `overflow-${width}`);
    if (width !== 320) await capture(page, `home-${width}`, phaseNumber < 3);

    if (phaseNumber >= 3) {
      const filmHero = await page.locator('#estudio[data-hero-variant="film"]').count() > 0;
      if (filmHero) {
        record(`hero-natural-flow-${width}`, await page.locator('#estudio').evaluate(node => !node.closest('.pin-spacer') && getComputedStyle(node).position !== 'fixed'));
        const bounds = await page.locator('#estudio').evaluate(node => ({ start: node.getBoundingClientRect().top + scrollY, height: node.getBoundingClientRect().height }));
        for (const [beat, progress] of [['inicio', 0], ['fin', 1]]) {
          await nativeScroll(page, bounds.start + Math.max(0, bounds.height - page.viewportSize().height) * progress);
          await checkOverflow(page, `overflow-hero-film-${beat}-${width}`);
          if (width !== 320) await capture(page, `hero-film-${beat}-${width}`);
        }
      }
      await page.locator('#distancia').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Boolean(window.__sceneRanges?.distance), undefined, { timeout: 15000 });
      const ranges = await page.evaluate(() => window.__sceneRanges ?? null);
      record(`scene-ranges-${width}`, Boolean(ranges?.distance && (filmHero ? !ranges?.hero : ranges?.hero)), ranges);
      if (ranges) {
        for (const scene of (filmHero ? ["distance"] : ["hero", "distance"])) {
          const range = ranges[scene];
          if (!range || !Number.isFinite(range.start) || !Number.isFinite(range.end) || range.end <= range.start) {
            record(`${scene}-range-${width}`, false, range ?? "Sin rango");
            continue;
          }
          for (const [beat, progress] of [["inicio", 0.02], ["medio", 0.5], ["fin", 0.98]]) {
            await nativeScroll(page, range.start + (range.end - range.start) * progress);
            await checkOverflow(page, `overflow-${scene}-${beat}-${width}`);
            if (width !== 320) await capture(page, `${scene}-${beat}-${width}`);
          }
        }
      }
    }

    if (phaseNumber >= 4) {
      for (const id of ['manifiesto', 'soluciones']) {
        const bounds = await page.locator(`#${id}`).evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { start: rect.top + scrollY, height: rect.height };
        });
        for (const [beat, progress] of [['inicio', 0], ['medio', .5], ['fin', 1]]) {
          await nativeScroll(page, bounds.start + Math.max(0, bounds.height - page.viewportSize().height) * progress);
          await checkOverflow(page, `overflow-${id}-${beat}-${width}`);
          if (width !== 320) await capture(page, `${id}-${beat}-${width}`);
        }
      }
      await page.locator('#proceso').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1600);
      const range = await page.evaluate(() => window.__sceneRanges?.process ?? null);
      if (range) {
        record(`process-range-${width}`, range.end > range.start, range);
        for (const [beat, progress] of [['inicio', .02], ['medio', .5], ['fin', .98]]) {
          await nativeScroll(page, range.start + (range.end - range.start) * progress);
          await checkOverflow(page, `overflow-process-${beat}-${width}`);
          if (width !== 320) await capture(page, `process-${beat}-${width}`);
        }
      } else {
        for (const [beat, selector] of [['inicio', '#proceso h2'], ['medio', '#proceso li:nth-child(2)'], ['fin', '#proceso li:last-child']]) {
          await page.locator(selector).scrollIntoViewIfNeeded();
          await page.waitForTimeout(800);
          await checkOverflow(page, `overflow-process-${beat}-${width}`);
          if (width !== 320) await capture(page, `process-${beat}-${width}`);
        }
      }
      record(`narrative-copy-${width}`, await page.locator('#manifiesto').innerText().then(text => text.includes('MEJORAR ALGO.')) && await page.locator('#soluciones h3').count() === 4 && await page.locator('#proceso li').count() === 4);
    }

    if (phaseNumber >= 7) {
      for (const id of ['el-estudio', 'equipo', 'herramientas', 'hablemos', 'contacto']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(1100);
        await checkOverflow(page, `overflow-${id}-${width}`);
        record(`section-${id}-${width}`, await page.locator(`#${id} h2`).isVisible());
        if (width !== 320) await capture(page, `${id}-${width}`);
      }
      record(`team-two-members-${width}`, await page.locator('#equipo h3').count() === 2);
      record(`contact-native-email-${width}`, await page.locator('#contacto a[href="mailto:dosorillasestudio@gmail.com"]').count() > 0);
    }
    await nativeScroll(page, 0);
    if ([375, 1440].includes(width)) {
      const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = accessibility.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
      await writeFile(path.join(outputDirectory, `axe-${width}.json`), JSON.stringify(accessibility, null, 2));
      record(`axe-serious-critical-${width}`, serious.length === 0, serious.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })));
    }
    if (width === 375) await checkMobileMenu(page);
    record(`console-${width}`, errors.length === 0, errors);
  } catch (error) {
    record(`viewport-${width}`, false, error.message);
    report.errors.push({ width, error: error.stack ?? error.message });
    if (errors.length) record(`console-${width}`, false, errors);
  } finally {
    await context.close();
  }
}

async function runFallback(mode) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: mode === "reduced" ? "reduce" : "no-preference", javaScriptEnabled: mode !== "no-js" });
  if (mode !== "no-js") await context.addInitScript(() => sessionStorage.setItem("do-intro", "1"));
  const page = await context.newPage();
  try {
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    if (mode === "no-js") await page.locator("main h1").waitFor({ state: "visible" });
    else await ready(page);
    record(`${mode}-h1-visible`, await page.locator("main h1").isVisible());
    const content = await page.locator("main").innerText();
    record(`${mode}-hero-copy`, content.includes("Primero entendemos."));
    if (phaseNumber >= 3) record(`${mode}-distance-copy`, content.includes("Entre tener un problema y encontrar la herramienta correcta hay una distancia."));
    if (phaseNumber >= 4) {
      record(`${mode}-narrative-copy`, content.includes('MEJORAR ALGO.') && content.includes('No porque esté de moda.') && content.includes('Implementamos, probamos y acompañamos el funcionamiento.'));
      record(`${mode}-all-services-readable`, await page.locator('#soluciones h3').count() === 4 && await page.locator('#soluciones').innerText().then(text => text.includes('Transformar información dispersa')));
    }
    await checkOverflow(page, `${mode}-overflow`);
    if (mode === "reduced") {
      record("reduced-tier-0", await page.locator("html").getAttribute("data-motion-tier") === "0");
      record("reduced-no-pin", await page.locator(".pin-spacer").count() === 0);
      record("reduced-no-loader", await page.locator('[data-preloader]:visible, [data-loader]:visible, .preloader:visible, #preloader:visible').count() === 0);
      const hiddenContent = await page.locator("main [data-reveal]").evaluateAll((elements) => elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.visibility === "hidden" || Number(style.opacity) < 0.95;
      }).length);
      record("reduced-reveals-visible", hiddenContent === 0, hiddenContent);
    }
    await capture(page, `${mode}-375`, true);
  } catch (error) {
    record(mode, false, error.message);
    report.errors.push({ mode, error: error.stack ?? error.message });
  } finally {
    await context.close();
  }
}

try {
  await mkdir(outputDirectory, { recursive: true });
  const [{ chromium }, axeModule] = await Promise.all([import("@playwright/test"), import("@axe-core/playwright")]);
  const AxeBuilder = axeModule.default;
  const executablePath = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browser = { version: browser.version(), executablePath: executablePath ?? chromium.executablePath() };
  for (const width of [320, 375, 768, 1024, 1440, 1920]) await runViewport(width, AxeBuilder);
  await runFallback("reduced");
  await runFallback("no-js");
} catch (error) {
  record("harness", false, error.message);
  report.errors.push({ error: error.stack ?? error.message });
} finally {
  await browser?.close();
  await mkdir(outputDirectory, { recursive: true });
  report.passed = report.checks.every((check) => check.status !== "fail");
  await writeFile(path.join(outputDirectory, "qa-summary.json"), JSON.stringify(report, null, 2));
  console.log(`QA ${phase}: ${report.passed ? "PASS" : "FAIL"}. ${path.join(outputDirectory, "qa-summary.json")}`);
  if (!report.passed) process.exitCode = 1;
}
