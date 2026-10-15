import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type SceneRanges = Record<"hero" | "distance", { start: number; end: number }>;
type TestWindow = Window & {
  __sceneRanges?: SceneRanges;
  __lenis?: { scrollTo: (target: number, options: { immediate: boolean; force: boolean }) => void };
};

const phase = Number((process.env.QA_PHASE ?? "F3").replace("F", ""));

async function ready(page: Page): Promise<void> {
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
  if (phase >= 1) await page.waitForFunction(() => {
    const html = document.documentElement;
    return html.dataset.motionReady === "true" || (html.dataset.motionTier !== undefined && !html.classList.contains("js-motion"));
  });
}

async function scrollTo(page: Page, y: number): Promise<void> {
  await page.evaluate((position) => {
    document.documentElement.style.scrollBehavior = "auto";
    (window as TestWindow).__lenis?.scrollTo(position, { immediate: true, force: true });
    window.scrollTo({ top: position, behavior: "instant" });
  }, y);
  await page.waitForTimeout(1100);
}

async function assertNoOverflow(page: Page): Promise<void> {
  const result = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(result.document, JSON.stringify(result)).toBeLessThanOrEqual(result.viewport);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("do-intro", "1"));
});

for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  test(`sin overflow y errores de consola a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/", { waitUntil: "networkidle" });
    await ready(page);
    await assertNoOverflow(page);
    if (phase >= 3) {
      await page.locator('#distancia').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Boolean((window as TestWindow).__sceneRanges?.distance));
      const ranges = await page.evaluate(() => (window as TestWindow).__sceneRanges);
      expect(ranges, "F3 debe exponer los rangos de Hero y La distancia").toBeDefined();
      if (!ranges) throw new Error("Faltan __sceneRanges");
      for (const range of Object.values(ranges)) {
        expect(range.end).toBeGreaterThan(range.start);
        for (const progress of [0.02, 0.5, 0.98]) {
          await scrollTo(page, range.start + (range.end - range.start) * progress);
          await assertNoOverflow(page);
        }
      }
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [375, 1440]) {
  test(`axe sin violaciones serias/críticas a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await ready(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  });
}

test("reduced motion: tier 0, contenido visible, sin loader ni pins", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-motion-tier", "0");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator('[data-preloader]:visible, [data-loader]:visible, .preloader:visible, #preloader:visible')).toHaveCount(0);
  await expect(page.locator("main")).toContainText("Primero entendemos.");
  if (phase >= 3) await expect(page.locator("main")).toContainText("Entre tener un problema y encontrar la herramienta correcta hay una distancia.");
  const hidden = await page.locator("main [data-reveal]").evaluateAll((elements) => elements.filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility === "hidden" || Number(style.opacity) < 0.95;
  }).length);
  expect(hidden).toBe(0);
});

test("sin JavaScript conserva el contenido semántico", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  try {
    const page = await context.newPage();
    await page.goto(process.env.QA_BASE_URL ?? "http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main")).toContainText("Primero entendemos.");
    if (phase >= 3) await expect(page.locator("main")).toContainText("Entre tener un problema y encontrar la herramienta correcta hay una distancia.");
    await assertNoOverflow(page);
  } finally {
    await context.close();
  }
});

test("menú mobile: trap, Escape y retorno de foco", async ({ page }) => {
  test.skip(phase < 2, "El menú se implementa en F2.");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/", { waitUntil: "networkidle" });
  await ready(page);
  const opener = page.getByRole("button", { name: "Abrir menú", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(950);
  const count = await dialog.locator('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]').count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count + 2; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
