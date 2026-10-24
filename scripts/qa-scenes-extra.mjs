import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workDirectory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(workDirectory, "..");
const requireFromRepository = createRequire(path.join(repository, "package.json"));
const { chromium } = requireFromRepository("@playwright/test");
const baseURL = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = path.join(repository, "qa-results/F3/extra-scenes");
const report = {
  baseURL,
  createdAt: new Date().toISOString(),
  scope: "F3: tamaños de texto, disposición, foco y cambios de preferencia de movimiento",
  cases: [],
  passed: false,
};

let browser;

function check(result, name, pass, detail = undefined) {
  result.checks.push({ name, status: pass ? "pass" : "fail", ...(detail === undefined ? {} : { detail }) });
  console.log(`${pass ? "PASS" : "FAIL"} ${result.name}: ${name}`);
}

async function capture(page, result, name, fullPage = false) {
  const filename = `${result.name}-${name}.png`;
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage, animations: "disabled" });
  result.screenshots.push(filename);
}

async function loaded(page, scripting = true) {
  await page.locator("main h1").waitFor({ state: "visible", timeout: 20000 });
  await page.evaluate(async () => { await document.fonts.ready; });
  if (scripting) await page.waitForFunction(() => document.documentElement.dataset.motionReady === "true", undefined, { timeout: 20000 });
}

async function scrollTo(page, y, settleMs = 1200) {
  await page.evaluate((target) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.__lenis?.scrollTo(target, { immediate: true, force: true });
    window.scrollTo({ top: target, behavior: "instant" });
  }, y);
  await page.waitForTimeout(settleMs);
}

async function primeScenes(page) {
  // An actual scroll starts the mobile enhancement, then entering the second
  // scene loads its deferred runtime. No implementation method is invoked.
  await scrollTo(page, 12);
  await page.locator('[data-scene="distance"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => ["hero", "distance"].every((name) => {
    const root = document.querySelector(`[data-scene="${name}"]`);
    if (!root) return false;
    if (document.documentElement.dataset.motionTier === "0") return true;
    const range = window.__sceneRanges?.[name];
    if (root.dataset.sceneFlow === "true") return range === undefined;
    return range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start;
  }), undefined, { timeout: 20000 });
  await page.waitForTimeout(500);
  return page.evaluate(() => Object.fromEntries(["hero", "distance"].map((name) => {
    const root = document.querySelector(`[data-scene="${name}"]`);
    const mode = document.documentElement.dataset.motionTier === "0" ? "reduced" : root?.dataset.sceneFlow === "true" ? "flow" : "timeline";
    return [name, { mode, range: window.__sceneRanges?.[name] ?? null }];
  })));
}

async function enlargeText(page) {
  const enlarged = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("body *"))
      .filter((element) => element instanceof HTMLElement && (
        Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) ||
        element.matches("input, textarea, select")
      ));
    const sizes = elements.map((element) => ({ element, size: parseFloat(getComputedStyle(element).fontSize) }));
    // Snapshot every original size before changing any inheritance. Doubling
    // only html font-size would leave this site's px/clamp text unchanged.
    for (const { element, size } of sizes) if (Number.isFinite(size)) element.style.setProperty("font-size", `${size * 2}px`, "important");
    return sizes.length;
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(1000);
  return enlarged;
}

async function checkContent(page, result, suffix) {
  const content = await page.evaluate(() => {
    const expected = [
      "Dos Orillas Estudio", "Primero entendemos.", "Después hacemos.",
      "Soluciones digitales pensadas desde el problema, no desde la herramienta.",
      "Entre tener un problema y encontrar la herramienta correcta hay una distancia.",
      "Ahí trabajamos nosotros.",
    ];
    const text = document.querySelector("main")?.textContent.replace(/\s+/g, " ") ?? "";
    const accessibleTitle = document.querySelector("main h1")?.getAttribute("aria-label") ?? "";
    return { missing: expected.filter((copy) => !text.toLocaleLowerCase().includes(copy.toLocaleLowerCase()) && accessibleTitle !== copy) };
  });
  check(result, `contenido-semántico-${suffix}`, content.missing.length === 0, content);
}

async function inspectGeometry(page, scene) {
  return page.evaluate((sceneName) => {
    const root = document.querySelector(`[data-scene="${sceneName}"]`);
    if (!root) return { error: "La escena F3 no existe.", fragments: [], clashes: [], clips: [] };
    const stage = root.querySelector(`.${sceneName}-stage`) ?? root;
    const stageRect = stage.getBoundingClientRect();
    const stageStyle = getComputedStyle(stage);
    const activePinnedViewport = Math.abs(stageRect.top) <= 2 && (
      stageStyle.position === "sticky" || stage.closest(".pin-spacer") !== null
    );
    const blocks = new Map();
    let blockIndex = 0;
    const fragments = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      const element = node.parentElement;
      if (!text || !element || element.closest('[aria-hidden="true"], .sr-only, script, style, noscript')) continue;
      let ancestor = element;
      let visible = true;
      let opacity = 1;
      while (ancestor && ancestor !== root.parentElement) {
        const style = getComputedStyle(ancestor);
        opacity *= Number(style.opacity);
        if (style.display === "none" || style.visibility === "hidden" || ancestor.hidden) visible = false;
        ancestor = ancestor.parentElement;
      }
      // Check stable readable text, not the intentionally clipped/transparent
      // intermediate frames of a reveal or the outgoing title.
      if (!visible || opacity < .95) continue;
      const block = element.closest("h1,h2,h3,p,a,button") ?? element;
      if (!blocks.has(block)) blocks.set(block, ++blockIndex);
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width < 2 || rect.height < 2) continue;
        fragments.push({ text, block: blocks.get(block), tag: block.tagName, element, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
      }
    }
    const clashes = [];
    const clips = [];
    for (let index = 0; index < fragments.length; index += 1) {
      const fragment = fragments[index];
      for (let otherIndex = index + 1; otherIndex < fragments.length; otherIndex += 1) {
        const other = fragments[otherIndex];
        if (fragment.block === other.block) continue;
        const overlapX = Math.min(fragment.right, other.right) - Math.max(fragment.x, other.x);
        const overlapY = Math.min(fragment.bottom, other.bottom) - Math.max(fragment.y, other.y);
        if (overlapX > 3 && overlapY > 3) clashes.push({ first: fragment.text, second: other.text, overlapX, overlapY });
      }
      let ancestor = fragment.element;
      while (ancestor && ancestor !== root.parentElement) {
        const style = getComputedStyle(ancestor);
        const rect = ancestor.getBoundingClientRect();
        const clipX = ["hidden", "clip", "auto", "scroll"].includes(style.overflowX);
        const clipY = ["hidden", "clip", "auto", "scroll"].includes(style.overflowY);
        if ((clipX && (fragment.x < rect.left - 2 || fragment.right > rect.right + 2)) ||
            (clipY && (fragment.y < rect.top - 2 || fragment.bottom > rect.bottom + 2))) {
          clips.push({ text: fragment.text, container: `${ancestor.tagName}.${ancestor.className}`, reason: "Contenedor recorta texto", box: { left: fragment.x, top: fragment.y, right: fragment.right, bottom: fragment.bottom }, bounds: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } });
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (activePinnedViewport && stageRect.height > innerHeight + 2 &&
          (fragment.y < -2 || fragment.bottom > innerHeight + 2)) {
        clips.push({ text: fragment.text, reason: "Texto fuera del viewport en escena sticky/pinneada más alta que la pantalla", top: fragment.y, bottom: fragment.bottom, viewportHeight: innerHeight });
      }
    }
    return {
      scrollY,
      stage: { top: stageRect.top, height: stageRect.height, activePinnedViewport },
      fragments: fragments.map((fragment) => {
        const serializable = { ...fragment };
        delete serializable.element;
        return serializable;
      }),
      clashes, clips,
      overflow: { width: innerWidth, document: document.documentElement.scrollWidth },
    };
  }, scene);
}

async function geometryCheck(page, result, scene, beat) {
  const geometry = await inspectGeometry(page, scene);
  result.geometry.push({ scene, beat, ...geometry });
  check(result, `${scene}-${beat}-textos-presentes`, !geometry.error && geometry.fragments.length > 0, geometry.error ?? geometry.fragments.length);
  check(result, `${scene}-${beat}-sin-choques`, geometry.clashes.length === 0, geometry.clashes);
  check(result, `${scene}-${beat}-sin-recortes`, geometry.clips.length === 0, geometry.clips);
  if (geometry.overflow) check(result, `${scene}-${beat}-sin-overflow`, geometry.overflow.document <= geometry.overflow.width, geometry.overflow);
  await capture(page, result, `${scene}-${beat}`);
}

async function checkFlowScene(page, result, scene) {
  const state = await page.evaluate((name) => {
    const root = document.querySelector(`[data-scene="${name}"]`);
    const stage = root?.querySelector(`.${name}-stage`);
    if (!root || !stage) return null;
    const rect = stage.getBoundingClientRect();
    return {
      flow: root.dataset.sceneFlow === "true",
      reduced: document.documentElement.dataset.motionTier === "0",
      position: getComputedStyle(stage).position,
      pins: root.querySelectorAll(".pin-spacer").length,
      range: window.__sceneRanges?.[name] ?? null,
      documentTop: scrollY + rect.top,
      height: rect.height,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
    };
  }, scene);
  if (!state) { check(result, `${scene}-flujo-existe`, false); return; }
  check(result, `${scene}-flujo-natural`, (state.flow || state.reduced) && !["fixed", "sticky"].includes(state.position), state);
  check(result, `${scene}-flujo-sin-pins-rango`, state.pins === 0 && state.range === null, { pins: state.pins, range: state.range });
  const hiddenBlocks = await page.evaluate((name) => {
    const root = document.querySelector(`[data-scene="${name}"]`);
    if (!root) return ["La escena no existe"];
    return Array.from(root.querySelectorAll("h1,h3,p,a")).filter((element) => {
      if (element.closest('[aria-hidden="true"],.sr-only')) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return true;
      let ancestor = element;
      let opacity = 1;
      while (ancestor && ancestor !== root.parentElement) {
        const style = getComputedStyle(ancestor);
        opacity *= Number(style.opacity);
        if (style.visibility === "hidden" || style.display === "none" || ancestor.hidden) return true;
        ancestor = ancestor.parentElement;
      }
      return opacity < .95;
    }).map((element) => element.textContent.trim());
  }, scene);
  check(result, `${scene}-flujo-todo-el-texto-visible`, hiddenBlocks.length === 0, hiddenBlocks);
  const travel = Math.max(0, state.height - state.viewportHeight);
  for (const [beat, progress] of [["flujo-inicio", 0], ["flujo-medio", .5], ["flujo-fin", 1]]) {
    await scrollTo(page, state.documentTop + travel * progress, 250);
    await geometryCheck(page, result, scene, beat);
  }

  // Normal flow can be taller than one screen. Verify that the first and last
  // rendered line of each semantic block can actually be brought into view;
  // merely accepting data-scene-flow would hide broken fallback layouts.
  const geometry = await inspectGeometry(page, scene);
  const grouped = new Map();
  geometry.fragments.forEach((fragment, index) => {
    const indices = grouped.get(fragment.block) ?? [];
    indices.push(index);
    grouped.set(fragment.block, indices);
  });
  const failures = [];
  for (const indices of grouped.values()) {
    for (const index of new Set([indices[0], indices[indices.length - 1]])) {
      const fragment = geometry.fragments[index];
      if (!fragment) continue;
      const target = geometry.scrollY + (fragment.y + fragment.bottom) / 2 - state.viewportHeight / 2;
      await scrollTo(page, target, 150);
      const current = (await inspectGeometry(page, scene)).fragments[index];
      if (!current || current.y < -2 || current.bottom > state.viewportHeight + 2 || current.x < -2 || current.right > state.viewportWidth + 2) {
        failures.push({ text: fragment.text, current: current ?? null });
      }
    }
  }
  check(result, `${scene}-flujo-lectura-alcanzable`, grouped.size > 0 && failures.length === 0, { blocks: grouped.size, failures });
}

async function checkMobileFocus(page, result) {
  const mode = await page.evaluate(() => {
    const root = document.querySelector('[data-scene="hero"]');
    return root?.dataset.sceneFlow === "true" || document.documentElement.dataset.motionTier === "0" ? "flow" : "timeline";
  });
  const cta = page.locator('[data-scene="hero"] a').filter({ hasText: "CONTANOS QUÉ QUERÉS RESOLVER" }).first();
  if (mode === "flow") {
    const target = await cta.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return scrollY + (rect.top + rect.bottom) / 2 - innerHeight / 2;
    });
    await scrollTo(page, target, 250);
    await cta.focus();
    await page.waitForTimeout(350);
    const focus = await cta.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { focused: document.activeElement === element, visible: style.visibility !== "hidden" && Number(style.opacity) > .95 && rect.top >= 0 && rect.bottom <= innerHeight, rect: { top: rect.top, bottom: rect.bottom }, viewportHeight: innerHeight };
    });
    check(result, "foco-CTA-flujo-visible", focus.focused && focus.visible, focus);
    await capture(page, result, "cta-focus-flujo");
    return;
  }
  const ranges = await page.evaluate(() => window.__sceneRanges);
  const hero = ranges?.hero;
  if (!hero) { check(result, "foco-CTA-móvil", false, "No se pudo recorrer la escena Hero."); return; }
  const target = hero.start + (hero.end - hero.start) * .62;
  await scrollTo(page, target);
  const before = await page.evaluate(() => scrollY);
  await cta.focus();
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => scrollY);
  check(result, "foco-CTA-móvil-conserva-progreso", after >= before - 40, { before, after, backwardsPixels: before - after });
  const focus = await cta.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { focused: document.activeElement === element, visible: style.visibility !== "hidden" && Number(style.opacity) > .95 && rect.top >= 0 && rect.bottom <= innerHeight, rect: { top: rect.top, bottom: rect.bottom }, viewportHeight: innerHeight };
  });
  check(result, "foco-CTA-móvil-visible", focus.focused && focus.visible, focus);
  await capture(page, result, "cta-focus");
}

async function runCase(settings) {
  const result = { name: settings.name, settings, checks: [], screenshots: [], geometry: [], consoleErrors: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: settings.viewport, deviceScaleFactor: 1, javaScriptEnabled: settings.scripting !== false, reducedMotion: settings.reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") result.consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => result.consoleErrors.push(error.message));
  if (settings.scripting !== false) await context.addInitScript(({ tier1 }) => {
    sessionStorage.setItem("do-intro", "1");
    localStorage.setItem("dos-orillas:motion", "full");
    if (tier1) sessionStorage.setItem("dos-orillas:motion-tier", "1");
  }, { tier1: settings.forceTier1 ?? false });
  try {
    const response = await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    check(result, "HTTP", Boolean(response?.ok()), response?.status());
    await loaded(page, settings.scripting !== false);
    await checkContent(page, result, "HTML");
    if (settings.zoomText) check(result, "texto-ampliado", await enlargeText(page) > 0);

    if (!settings.reduced && settings.scripting !== false) {
      const profiles = await primeScenes(page);
      result.sceneProfiles = profiles;
      if (Object.values(profiles).every((profile) => profile.mode === "flow" || profile.mode === "reduced")) {
        check(result, "flujo-completo-sin-pins", await page.locator(".pin-spacer").count() === 0);
      }
      const tier = await page.locator("html").getAttribute("data-motion-tier");
      const expectedTier = settings.forceTier1 || settings.viewport.width < 1024 ? "1" : "2";
      check(result, "perfil-movimiento", tier === expectedTier, { expected: expectedTier, actual: tier });
      for (const scene of ["hero", "distance"]) {
        if (profiles[scene].mode !== "timeline") {
          await checkFlowScene(page, result, scene);
          continue;
        }
        const range = await page.evaluate((name) => window.__sceneRanges?.[name], scene);
        if (!range || range.end <= range.start) { check(result, `${scene}-recorrido`, false, range); continue; }
        for (const [beat, progress] of [["inicio", .08], ["medio", .52], ["fin", .98]]) {
          await scrollTo(page, range.start + (range.end - range.start) * progress);
          await geometryCheck(page, result, scene, beat);
        }
      }
      if (expectedTier === "1") await checkMobileFocus(page, result);
    } else {
      check(result, "estático-sin-pins", await page.locator(".pin-spacer").count() === 0);
      for (const scene of ["hero", "distance"]) {
        const natural = await page.evaluate((name) => {
          const root = document.querySelector(`[data-scene="${name}"]`);
          const stage = root?.querySelector(`.${name}-stage`);
          return Boolean(stage && !["sticky", "fixed"].includes(getComputedStyle(stage).position));
        }, scene);
        if (natural) {
          await checkFlowScene(page, result, scene);
          continue;
        }
        await page.locator(`[data-scene="${scene}"]`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        await geometryCheck(page, result, scene, "estático");
      }
    }
  } catch (error) {
    check(result, "ejecución", false, error.stack ?? error.message);
    try { await capture(page, result, "error"); } catch { /* Preserve the original error. */ }
  } finally {
    check(result, "sin-errores-consola", result.consoleErrors.length === 0, result.consoleErrors);
    result.passed = result.checks.every((entry) => entry.status === "pass");
    await context.close();
  }
}

async function stateOfMotion(page) {
  return page.evaluate(() => ({
    tier: document.documentElement.dataset.motionTier,
    pins: document.querySelectorAll(".pin-spacer").length,
    triggers: typeof window.__stCount === "number" ? window.__stCount : null,
    staleSceneTransforms: Array.from(document.querySelectorAll('.hero-title, .hero-photo, .distance-track')).map((element) => {
      const transform = getComputedStyle(element).transform;
      return { class: element.className, transform, hasVisualEffect: transform !== "none" && !new DOMMatrixReadOnly(transform).isIdentity };
    }).filter((element) => element.hasVisualEffect),
  }));
}

async function runMotionCycles() {
  const result = { name: "ciclos-full-reduced-full", checks: [], screenshots: [], consoleErrors: [], states: [] };
  report.cases.push(result);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  await context.addInitScript(() => { sessionStorage.setItem("do-intro", "1"); localStorage.setItem("dos-orillas:motion", "full"); });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") result.consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => result.consoleErrors.push(error.message));
  try {
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    await loaded(page);
    await primeScenes(page);
    const baseline = await stateOfMotion(page);
    result.states.push({ cycle: 0, mode: "full", ...baseline });
    check(result, "full-inicial-operativo", baseline.tier === "2" && baseline.pins > 0 && baseline.triggers > 0, baseline);
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => document.documentElement.dataset.motionTier === "0", undefined, { timeout: 10000 });
      await page.waitForTimeout(600);
      const reduced = await stateOfMotion(page);
      result.states.push({ cycle, mode: "reduced", ...reduced });
      check(result, `ciclo-${cycle}-pins-limpiados`, reduced.pins === 0, reduced);
      check(result, `ciclo-${cycle}-triggers-limpiados`, reduced.triggers === 0, reduced.triggers);
      check(result, `ciclo-${cycle}-transforms-limpiados`, reduced.staleSceneTransforms.length === 0, reduced.staleSceneTransforms);
      await checkContent(page, result, `reduced-${cycle}`);
      await scrollTo(page, 0);
      result.geometry ??= [];
      await geometryCheck(page, result, "hero", `reduced-${cycle}`);

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForFunction(() => document.documentElement.dataset.motionTier === "2", undefined, { timeout: 10000 });
      await primeScenes(page);
      const full = await stateOfMotion(page);
      result.states.push({ cycle, mode: "full", ...full });
      check(result, `ciclo-${cycle}-sin-pins-duplicados`, full.pins === baseline.pins, { initial: baseline.pins, actual: full.pins });
      check(result, `ciclo-${cycle}-sin-trigger-leaks`, full.triggers === baseline.triggers, { initial: baseline.triggers, actual: full.triggers });
      const range = await page.evaluate(() => window.__sceneRanges?.distance);
      if (range) await scrollTo(page, range.start + (range.end - range.start) * .9);
      await capture(page, result, `full-${cycle}`);
    }
  } catch (error) {
    check(result, "ejecución", false, error.stack ?? error.message);
  } finally {
    check(result, "sin-errores-consola", result.consoleErrors.length === 0, result.consoleErrors);
    result.passed = result.checks.every((entry) => entry.status === "pass");
    await context.close();
  }
}

try {
  await mkdir(outputDirectory, { recursive: true });
  const installedChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromePath = process.env.CHROME_PATH ?? (existsSync(installedChrome) ? installedChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(chromePath ? { executablePath: chromePath } : {}) });
  report.browser = { version: browser.version(), executablePath: chromePath ?? chromium.executablePath() };
  const cases = [
    { name: "375x667", viewport: { width: 375, height: 667 } },
    { name: "720x450", viewport: { width: 720, height: 450 } },
    { name: "1440x900-tier1", viewport: { width: 1440, height: 900 }, forceTier1: true },
    { name: "375x667-texto200", viewport: { width: 375, height: 667 }, zoomText: true },
    { name: "1440x900-texto200", viewport: { width: 1440, height: 900 }, zoomText: true },
    { name: "1440x900-reduced", viewport: { width: 1440, height: 900 }, reduced: true },
    { name: "375x667-sin-js", viewport: { width: 375, height: 667 }, scripting: false },
    { name: "768x900-reduced", viewport: { width: 768, height: 900 }, reduced: true },
    { name: "768x900-sin-js", viewport: { width: 768, height: 900 }, scripting: false },
  ];
  for (const settings of cases) await runCase(settings);
  await runMotionCycles();
} catch (error) {
  report.error = error.stack ?? error.message;
  console.error(report.error);
} finally {
  await browser?.close();
  await mkdir(outputDirectory, { recursive: true });
  report.passed = !report.error && report.cases.length === 10 && report.cases.every((result) => result.passed);
  await writeFile(path.join(outputDirectory, "summary.json"), JSON.stringify(report, null, 2));
  console.log(`Escenas extra: ${report.passed ? "PASS" : "FAIL"}. ${path.join(outputDirectory, "summary.json")}`);
  if (!report.passed) process.exitCode = 1;
}
