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
const url = option("--url", process.env.QA_BASE_URL ?? "http://127.0.0.1:3000");
const diagnosticPaint = process.argv.includes('--diagnostic-paint');
const headed = process.argv.includes('--headed');
const outputDirectory = path.join(projectRoot, "qa-results", phase, ...(diagnosticPaint ? ['diagnostic-paint'] : []));
const summary = { phase, url, createdAt: new Date().toISOString(), runs: [], errors: [] };

function numericAudit(lhr, name) {
  const value = lhr.audits[name]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function categoryScore(lhr, name) {
  const value = lhr.categories[name]?.score;
  return typeof value === "number" && Number.isFinite(value) ? value * 100 : null;
}

function guards(metrics, mode) {
  return [
    { name: "Performance", value: metrics.performance, operator: ">=", threshold: mode === "mobile" ? 90 : 95 },
    { name: "Accessibility", value: metrics.accessibility, operator: ">=", threshold: 95 },
    { name: "Best Practices", value: metrics.bestPractices, operator: ">=", threshold: 95 },
    { name: "SEO", value: metrics.seo, operator: ">=", threshold: 95 },
    { name: "LCP (ms)", value: metrics.lcpMs, operator: "<=", threshold: 2500 },
    { name: "CLS", value: metrics.cls, operator: "<=", threshold: 0.05 },
    { name: "TBT (ms)", value: metrics.tbtMs, operator: "<=", threshold: 200 },
  ].map((guard) => ({ ...guard, passed: guard.value !== null && (guard.operator === ">=" ? guard.value >= guard.threshold : guard.value <= guard.threshold) }));
}

async function measure(mode, lighthouse, chromeLauncher, desktopConfig) {
  let chrome;
  try {
    const suppliedPath = process.env.CHROME_PATH;
    if (suppliedPath && !existsSync(suppliedPath)) throw new Error(`CHROME_PATH no existe: ${suppliedPath}`);
    const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const chromePath = suppliedPath ?? (process.platform === "win32" && existsSync(windowsChrome) ? windowsChrome : undefined);
    const featureFlags = chromeLauncher.Launcher.defaultFlags().find(flag => flag.startsWith('--disable-features='));
    const chromeFlags = [
      ...(!headed ? ['--headless=new'] : []),
      '--window-size=1350,940',
      '--no-first-run',
      ...(diagnosticPaint ? [`${featureFlags},PaintHolding`] : []),
    ];
    chrome = await chromeLauncher.launch({ chromePath, chromeFlags });
    const result = await lighthouse(url, {
      port: chrome.port,
      output: ["html", "json"],
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      skipAudits: ['is-crawlable'],
    }, mode === "desktop" ? desktopConfig : undefined);
    if (!result) throw new Error("Lighthouse no devolvió un informe.");
    const { lhr } = result;
    if (mode === 'mobile' && result.artifacts?.Trace) await writeFile(path.join(outputDirectory, 'lighthouse-trace.json'), JSON.stringify(result.artifacts.Trace));
    await writeFile(path.join(outputDirectory, `lighthouse-${mode}.json`), JSON.stringify(lhr, null, 2));
    const htmlReport = Array.isArray(result.report) ? result.report[0] : result.report;
    if (typeof htmlReport !== "string" || !htmlReport.includes("<html")) throw new Error("Lighthouse no devolvió un informe HTML válido.");
    await writeFile(path.join(outputDirectory, `lighthouse-${mode}.html`), htmlReport);
    const metrics = {
      performance: categoryScore(lhr, "performance"), accessibility: categoryScore(lhr, "accessibility"),
      bestPractices: categoryScore(lhr, "best-practices"), seo: categoryScore(lhr, "seo"),
      lcpMs: numericAudit(lhr, "largest-contentful-paint"), cls: numericAudit(lhr, "cumulative-layout-shift"),
      tbtMs: numericAudit(lhr, "total-blocking-time"),
    };
    const resources = lhr.audits['network-requests']?.details?.items ?? [];
    if (!resources.length) throw new Error('Lighthouse no entregó recursos para comprobar el peso inicial.');
    const scripts = resources.filter(resource => resource.resourceType === 'Script');
    const fonts = resources.filter(resource => resource.resourceType === 'Font');
    const images = resources.filter(resource => resource.resourceType === 'Image');
    const heroImages = images.filter(resource => {
      const pathname = new URL(decodeURIComponent(resource.url)).pathname;
      return pathname.includes('/_hero/') || /^\/visuals\/hero-film-poster(?:-desktop)?\.webp$/.test(pathname);
    });
    const payload = {
      initialJsBytes: scripts.reduce((bytes, resource) => bytes + resource.transferSize, 0),
      fontBytes: fonts.reduce((bytes, resource) => bytes + resource.resourceSize, 0),
      fontCount: fonts.length,
      largestImageBytes: Math.max(0, ...images.map(resource => resource.resourceSize)),
      largestHeroImageBytes: Math.max(0, ...heroImages.map(resource => resource.resourceSize)),
      heroImageCount: heroImages.length,
    };
    const payloadChecks = [
      { name: 'JS inicial (bytes)', value: payload.initialJsBytes, threshold: 170000 },
      { name: 'Fuentes (bytes)', value: payload.fontBytes, threshold: 120000 },
      { name: 'Archivos de fuente', value: payload.fontCount, threshold: 4 },
      { name: 'Imagen máxima (bytes)', value: payload.largestImageBytes, threshold: 300000 },
      { name: 'Hero móvil máximo (bytes)', value: mode === 'mobile' ? payload.largestHeroImageBytes : 0, threshold: 180000 },
    ].map(check => ({ ...check, operator: '<=', passed: Number.isFinite(check.value) && check.value <= check.threshold }));
    const checks = [...guards(metrics, mode), ...payloadChecks];
    const run = { mode, browserMode: headed ? 'headed' : 'headless', chromeFlags, lighthouseVersion: lhr.lighthouseVersion, browserUserAgent: lhr.environment.hostUserAgent, chromePath: chromePath ?? null, benchmarkIndex: lhr.environment.benchmarkIndex, fetchTime: lhr.fetchTime, finalDisplayedUrl: lhr.finalDisplayedUrl, configSettings: lhr.configSettings, metrics, payload, checks, runtimeError: lhr.runtimeError ?? null, passed: !lhr.runtimeError && checks.every((check) => check.passed) };
    summary.runs.push(run);
    console.log(`${mode.toUpperCase()} ${run.passed ? "PASS" : "FAIL"} ${JSON.stringify(metrics)}`);
    for (const check of checks.filter((check) => !check.passed)) console.log(`FAIL ${mode} ${check.name}: ${check.value ?? "sin dato"} ${check.operator} ${check.threshold}`);
  } catch (error) {
    summary.errors.push({ mode, error: error.stack ?? error.message });
    console.error(`FAIL ${mode}: ${error.message}`);
  } finally {
    await chrome?.kill();
  }
}

try {
  await mkdir(outputDirectory, { recursive: true });
  const [lighthouseModule, chromeLauncher, desktopModule] = await Promise.all([
    import("lighthouse"), import("chrome-launcher"), import("lighthouse/core/config/lr-desktop-config.js"),
  ]);
  for (const mode of ["mobile", "desktop"]) await measure(mode, lighthouseModule.default, chromeLauncher, desktopModule.default);
} catch (error) {
  summary.errors.push({ error: error.stack ?? error.message });
  console.error(`FAIL harness: ${error.message}`);
} finally {
  await mkdir(outputDirectory, { recursive: true });
  summary.passed = summary.errors.length === 0 && summary.runs.length === 2 && summary.runs.every((run) => run.passed);
  await writeFile(path.join(outputDirectory, "lighthouse-summary.json"), JSON.stringify(summary, null, 2));
  console.log(`Lighthouse ${phase}: ${summary.passed ? "PASS" : "FAIL"}. ${path.join(outputDirectory, "lighthouse-summary.json")}`);
  if (!summary.passed) process.exitCode = 1;
}
