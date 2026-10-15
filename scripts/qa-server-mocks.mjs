import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const staging = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = staging;
const output = path.join(repo, 'qa-results/F7/server-mocks.json');
const requireRepo = createRequire(path.join(repo, 'package.json'));
const report = {
  generatedAt: new Date().toISOString(), passed: false, scope: 'integrated-server-mocks',
  network: 'blocked; provider responses mocked', browser: false, build: false,
  assertions: 0, dependencies: {}, cases: [], limitation: 'No client, accessibility, visual, deployment or real delivery validation.',
};
const save = () => fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);

let ts; let zod;
try {
  ts = requireRepo('typescript');
  const candidates = [];
  if (process.env.CONTACT_TEST_ZOD_PATH) candidates.push(path.resolve(process.env.CONTACT_TEST_ZOD_PATH));
  try { candidates.push(path.dirname(requireRepo.resolve('zod/package.json'))); } catch { /* Look for an existing transitive installation. */ }
  const store = path.join(repo, 'node_modules/.pnpm');
  if (fs.existsSync(store)) {
    const versions = fs.readdirSync(store).filter(name => /^zod@4\./.test(name));
    versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    candidates.push(...versions.map(name => path.join(store, name, 'node_modules/zod')));
  }
  for (const candidate of candidates) {
    if (!fs.existsSync(path.join(candidate, 'package.json'))) continue;
    const metadata = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8'));
    if (!/^4\./.test(metadata.version)) continue;
    zod = requireRepo(candidate);
    report.dependencies = { typescript: ts.version, zod: metadata.version, zodPath: candidate, resend: 'not required; official REST transport mocked' };
    break;
  }
  if (!zod) throw new Error('An existing Zod 4 installation is required. No dependency was installed.');
} catch (error) {
  report.blocked = error instanceof Error ? error.message : 'Required dependency unavailable.';
  save(); process.stderr.write(`${report.blocked}\nReport: ${output}\n`); process.exit(2);
}

const equal = (actual, expected) => { report.assertions += 1; assert.equal(actual, expected); };
const ok = (actual) => { report.assertions += 1; assert.ok(actual); };
const deep = (actual, expected) => { report.assertions += 1; assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected); };
const cases = [];
const test = (name, run) => cases.push({ name, run });
const nativeSetTimeout = setTimeout;
const nativeClearTimeout = clearTimeout;

/** Transpile only staged server modules; allow the canonical content file explicitly. */
function sandbox({ timeoutScale = false, fetchMock } = {}) {
  const modules = new Map(); const timers = new Set(); const logs = [];
  const recordedTimeouts = [];
  const context = vm.createContext({
    Request, Response, Headers, URL, AbortController, TextDecoder, Uint8Array, Buffer, DOMException,
    process: { env: {} }, console: { error: (...args) => logs.push(args), log: () => {} },
    fetch: fetchMock ?? (() => { throw new Error('External network is disabled in this test harness.'); }),
    setTimeout: (callback, delay, ...args) => {
      recordedTimeouts.push(delay);
      const handle = nativeSetTimeout(() => { timers.delete(handle); callback(...args); }, timeoutScale ? Math.min(delay, 20) : delay);
      timers.add(handle); return handle;
    },
    clearTimeout: handle => { timers.delete(handle); nativeClearTimeout(handle); },
  });
  function resolve(request, parent) {
    const base = request.startsWith('@/')
      ? request === '@/content/site' ? path.join(repo, 'content/site') : path.join(staging, request.slice(2))
      : path.resolve(path.dirname(parent), request);
    for (const candidate of [base, `${base}.ts`]) if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    throw new Error(`Unresolved staged module: ${request}`);
  }
  function load(file) {
    file = path.resolve(file);
    if (modules.has(file)) return modules.get(file).exports;
    if (!(file.startsWith(`${staging}${path.sep}`) || file === path.join(repo, 'content/site.ts'))) throw new Error('Module outside the staged test allowlist.');
    const transpiledModule = { exports: {} }; modules.set(file, transpiledModule);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict: true },
    });
    if (source.diagnostics?.length) throw new Error(ts.flattenDiagnosticMessageText(source.diagnostics[0].messageText, ' '));
    const localRequire = request => {
      if (request === 'server-only') return {};
      if (request === 'zod') return zod;
      if (request === 'node:crypto' || request === 'node:net') return requireRepo(request);
      if (request.startsWith('@/') || request.startsWith('.')) return load(resolve(request, file));
      throw new Error(`Dependency outside test allowlist: ${request}`);
    };
    const compiled = new vm.Script(`(function(require,module,exports){${source.outputText}\n})`, { filename: file }).runInContext(context);
    compiled(localRequire, transpiledModule, transpiledModule.exports); return transpiledModule.exports;
  }
  const api = load(path.join(staging, 'lib/contact/handler.ts'));
  return {
    ...api, load: relative => load(path.join(staging, relative)), timers, logs, recordedTimeouts,
    dispose: () => { for (const timer of timers) nativeClearTimeout(timer); timers.clear(); },
  };
}

const payload = {
  name: 'Nombre de prueba', email: 'visitor@example.test', organization: 'Organización de prueba',
  message: 'Mensaje de prueba con ñ y acentos.', website: '', requestId: '123e4567-e89b-42d3-a456-426614174000',
};
const environment = { RESEND_API_KEY: 'mock-secret', CONTACT_FROM_EMAIL: 'sender@example.test', CONTACT_TO_EMAIL: 'receiver@example.test' };
function request(body = payload, { headers = {}, signal } = {}) {
  return new Request('http://127.0.0.1:3000/api/contact', { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' || body instanceof Uint8Array || body instanceof ReadableStream ? body : JSON.stringify(body),
    signal, duplex: 'half',
  });
}
function fixture(options = {}) {
  const box = sandbox(options); const sent = []; const logs = []; let providerSignal;
  const handler = box.createContactHandler({
    environment: () => environment, rate: () => ({ allowed: true, retryAfter: 0 }),
    send: async (mail, _config, signal) => { sent.push(mail); providerSignal = signal; return { accepted: true }; },
    log: code => logs.push(code), ...options.dependencies,
  });
  return { ...box, handler, sent, logs, providerSignal: () => providerSignal };
}
async function response(handler, body, options) {
  const result = await handler(request(body, options));
  equal(result.headers.get('cache-control'), 'no-store'); equal(result.headers.get('x-content-type-options'), 'nosniff');
  return { response: result, body: await result.json() };
}

test('Shared real Zod schema: trimmed Unicode data and optional defaults', () => {
  const box = sandbox();
  try {
    const schema = box.load('lib/contact/schema.ts');
    const valid = schema.validateContact({ name: '  Nombre ñ  ', email: '  visitor@example.test ', message: '  Línea uno\nLínea dos  ' });
    ok(valid.success); equal(valid.data.name, 'Nombre ñ'); equal(valid.data.email, 'visitor@example.test'); equal(valid.data.organization, ''); equal(valid.data.website, '');
    equal(valid.data.message, 'Línea uno\nLínea dos');
    equal(box.escapeContactHTML(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;');
  } finally { box.dispose(); }
});
test('Schema rejects blank fields, control characters, oversize strings and unknown properties', () => {
  const box = sandbox();
  try {
    const schema = box.load('lib/contact/schema.ts');
    const invalid = schema.validateContact({ ...payload, name: '', email: 'invalid', message: '' });
    equal(invalid.success, false); deep(Object.keys(invalid.errors).sort(), ['email', 'message', 'name']);
    for (const patch of [{ name: 'a'.repeat(121) }, { name: 'Nombre\nx' }, { organization: 'a'.repeat(161) }, { message: 'a'.repeat(5001) }, { message: 'texto\u0000x' }, { extra: true }, { requestId: 'invalid' }]) equal(schema.validateContact({ ...payload, ...patch }).success, false);
  } finally { box.dispose(); }
});
test('Missing/invalid mail configuration never calls sender or claims success', async () => {
  for (const config of [{}, { ...environment, CONTACT_FROM_EMAIL: 'invalid' }, { ...environment, CONTACT_TO_EMAIL: 'invalid' }]) {
    const box = fixture({ dependencies: { environment: () => config } });
    try { const result = await response(box.handler); equal(result.response.status, 503); deep(result.body, { ok: false, code: 'unavailable' }); equal(box.sent.length, 0); deep(box.logs, ['configuration_missing']); equal(box.timers.size, 0); } finally { box.dispose(); }
  }
});
test('Content type and cross-origin requests are rejected before sending', async () => {
  const box = fixture();
  try {
    equal((await response(box.handler, payload, { headers: { 'Content-Type': 'text/plain' } })).response.status, 415);
    equal((await response(box.handler, payload, { headers: { Origin: 'https://foreign.example.test' } })).response.status, 403);
    equal(box.sent.length, 0);
  } finally { box.dispose(); }
});
test('Invalid JSON, UTF-8 and schema data return safe 400 without provider calls', async () => {
  const box = fixture();
  try {
    for (const body of ['{broken', new Uint8Array([0xc3, 0x28]), { ...payload, email: 'invalid' }]) {
      const result = await response(box.handler, body); equal(result.response.status, 400); equal(result.body.ok, false); equal(result.body.code, 'invalid');
    }
    equal(box.sent.length, 0); equal(box.logs.length, 0); equal(box.timers.size, 0);
  } finally { box.dispose(); }
});
test('Body limit applies to actual bytes and declared length; streams are cancelled', async () => {
  const box = fixture();
  try {
    let cancelled = 0;
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(24 * 1024 + 1)); }, cancel() { cancelled += 1; } });
    equal((await response(box.handler, stream)).response.status, 413);
    equal(cancelled, 1);
    let declaredCancelled = 0;
    const declared = new ReadableStream({ cancel() { declaredCancelled += 1; } });
    equal((await response(box.handler, declared, { headers: { 'Content-Length': String(24 * 1024 + 1) } })).response.status, 413);
    equal(declaredCancelled, 1); equal(box.sent.length, 0); equal(box.timers.size, 0);
  } finally { box.dispose(); }
});
test('Honeypot is discarded without delivery or false success', async () => {
  const box = fixture();
  try { const result = await response(box.handler, { ...payload, website: 'bot-filled' }); equal(result.response.status, 202); deep(result.body, { ok: false, code: 'discarded' }); equal(box.sent.length, 0); equal(box.timers.size, 0); } finally { box.dispose(); }
});
test('IP keys require an explicitly trusted valid proxy header; keys are hashed', () => {
  const box = sandbox();
  try {
    const { contactRateKey } = box.load('lib/contact/rate-limit.ts');
    const ipRequest = request(payload, { headers: { 'x-forwarded-for': '192.0.2.10, 192.0.2.11' } });
    equal(contactRateKey(ipRequest), 'anonymous'); equal(contactRateKey(ipRequest, 'untrusted-header'), 'anonymous');
    const key = contactRateKey(ipRequest, 'x-forwarded-for'); ok(/^[a-f0-9]{64}$/.test(key)); equal(key, contactRateKey(ipRequest, 'x-forwarded-for'));
    equal(contactRateKey(request(payload, { headers: { 'x-forwarded-for': 'invalid' } }), 'x-forwarded-for'), 'anonymous');
    ok(key !== contactRateKey(request(payload, { headers: { 'x-forwarded-for': '192.0.2.12' } }), 'x-forwarded-for'));
  } finally { box.dispose(); }
});
test('Rate window, bounded map, capacity and expiry behave without active bucket eviction', () => {
  const box = sandbox();
  try {
    const { createContactRateLimiter } = box.load('lib/contact/rate-limit.ts');
    const limit = createContactRateLimiter(); const now = 1000000;
    for (let count = 0; count < 5; count += 1) equal(limit('same', now).allowed, true);
    const rejected = limit('same', now); equal(rejected.allowed, false); equal(rejected.retryAfter, 600);
    equal(limit('same', now + 600000).allowed, true);
    const bounded = createContactRateLimiter();
    for (let count = 0; count < 5000; count += 1) assert.equal(bounded(`key-${count}`, now).allowed, true);
    report.assertions += 5000;
    equal(bounded('new-key', now).allowed, false);
    for (let count = 0; count < 4; count += 1) equal(bounded('key-0', now).allowed, true);
    equal(bounded('key-0', now).allowed, false); equal(bounded('new-key', now + 600000).allowed, true);
  } finally { box.dispose(); }
});
test('Rate rejection returns 429 and Retry-After without reading/sending a message', async () => {
  const box = fixture({ dependencies: { rate: () => ({ allowed: false, retryAfter: 123 }) } });
  try { const result = await response(box.handler); equal(result.response.status, 429); equal(result.response.headers.get('retry-after'), '123'); deep(result.body, { ok: false, code: 'rate_limited' }); equal(box.sent.length, 0); equal(box.recordedTimeouts.length, 0); } finally { box.dispose(); }
});
test('Accepted provider delivery uses visitor replyTo, escaped HTML, plain text and idempotency', async () => {
  const box = fixture();
  try {
    const input = { ...payload, organization: `<&>"'`, message: `<script>alert('x')</script> & ñ\nOtra línea` };
    const result = await response(box.handler, input); equal(result.response.status, 200); deep(result.body, { ok: true, code: 'sent' }); equal(box.sent.length, 1);
    const mail = box.sent[0]; equal(mail.replyTo, payload.email); equal(mail.from, environment.CONTACT_FROM_EMAIL); equal(mail.to, environment.CONTACT_TO_EMAIL);
    equal(mail.subject, `Nuevo mensaje desde la web — ${payload.name}`); equal(mail.idempotencyKey, `contact/${payload.requestId}`);
    ok(mail.text.includes(input.message)); ok(mail.html.includes('&lt;script&gt;')); ok(!mail.html.includes('<script>')); ok(mail.html.includes('&amp; ñ<br>')); ok(mail.html.includes('&lt;&amp;&gt;&quot;&#39;'));
    equal(box.logs.length, 0); equal(box.timers.size, 0);
  } finally { box.dispose(); }
});
test('Provider rejection/exception returns 503 with constant log codes only', async () => {
  for (const send of [async () => ({ accepted: false }), async () => { throw new Error(payload.email); }]) {
    const box = fixture({ dependencies: { send } });
    try { const result = await response(box.handler); equal(result.response.status, 503); deep(result.body, { ok: false, code: 'unavailable' }); deep(box.logs, ['provider_failed']); equal(box.timers.size, 0); } finally { box.dispose(); }
  }
});
test('Provider timeout is bounded even when mocked sender ignores AbortSignal', async () => {
  let providerSignal;
  const box = fixture({ timeoutScale: true, dependencies: { send: async (_mail, _config, signal) => { providerSignal = signal; return new Promise(() => {}); } } });
  try {
    const result = await response(box.handler); equal(result.response.status, 504); deep(result.body, { ok: false, code: 'timeout' }); equal(providerSignal.aborted, true);
    deep(box.logs, ['provider_timeout']); ok(box.recordedTimeouts.includes(8000)); equal(box.timers.size, 0);
  } finally { box.dispose(); }
});
test('Stalled body returns distinct 408 and cancels reader before provider use', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  const box = fixture({ timeoutScale: true });
  try {
    const result = await response(box.handler, stream); equal(result.response.status, 408); deep(result.body, { ok: false, code: 'body_timeout' }); equal(cancelled, true);
    equal(box.sent.length, 0); ok(box.recordedTimeouts.includes(3000)); equal(box.timers.size, 0);
  } finally { box.dispose(); }
});
test('Incoming abort propagates to provider and cleans the listener/timer', async () => {
  const controller = new AbortController(); let providerSignal; let added = 0; let removed = 0;
  const incoming = request(payload, { signal: controller.signal });
  const add = incoming.signal.addEventListener.bind(incoming.signal); const remove = incoming.signal.removeEventListener.bind(incoming.signal);
  incoming.signal.addEventListener = (...args) => { added += 1; return add(...args); };
  incoming.signal.removeEventListener = (...args) => { removed += 1; return remove(...args); };
  const box = fixture({ dependencies: { send: async (_mail, _config, signal) => {
    providerSignal = signal; return new Promise((_, reject) => { signal.addEventListener('abort', () => reject(new Error('mock abort')), { once: true }); controller.abort(); });
  } } });
  try { const result = await box.handler(incoming); equal(result.status, 504); equal(providerSignal.aborted, true); equal(added, 1); equal(removed, 1); equal(box.timers.size, 0); deep(box.logs, ['provider_timeout']); } finally { box.dispose(); }
});
test('Official REST transport request is correct and only explicit provider IDs are accepted', async () => {
  for (const provider of [{ status: 200, body: { id: 'mock-id' }, accepted: true }, { status: 200, body: {}, accepted: false }, { status: 503, body: { message: 'mock failure' }, accepted: false }]) {
    const captures = [];
    const box = sandbox({ fetchMock: async (url, options) => { captures.push({ url, options }); return Response.json(provider.body, { status: provider.status }); } });
    try {
      const mailer = box.load('lib/contact/mail.ts'); const signal = new AbortController().signal;
      const mail = { from: environment.CONTACT_FROM_EMAIL, to: environment.CONTACT_TO_EMAIL, replyTo: payload.email, subject: 'Mock subject', text: 'Mock plain text', html: '<p>Mock HTML</p>', idempotencyKey: 'mock-key' };
      const result = await mailer.sendContactMail(mail, { apiKey: environment.RESEND_API_KEY, from: mail.from, to: mail.to }, signal);
      equal(result.accepted, provider.accepted); equal(captures.length, 1); const capture = captures[0]; equal(capture.url, 'https://api.resend.com/emails'); equal(capture.options.signal, signal); equal(capture.options.cache, 'no-store');
      equal(capture.options.headers.Authorization, 'Bearer mock-secret'); equal(capture.options.headers['Idempotency-Key'], 'mock-key');
      deep(JSON.parse(capture.options.body), { from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html }); equal(box.logs.length, 0);
    } finally { box.dispose(); }
  }
});

for (const item of cases) {
  const before = report.assertions;
  try { await item.run(); report.cases.push({ name: item.name, passed: true, assertions: report.assertions - before }); }
  catch (error) {
    report.cases.push({ name: item.name, passed: false, assertions: report.assertions - before, error: error instanceof Error ? error.message : String(error) });
  }
}
report.passed = report.cases.length === cases.length && report.cases.every(item => item.passed);
report.timing = 'Body/provider timeout callbacks accelerated to 20ms in those cases; configured 3000/8000ms values are separately asserted.';
save();
process.stdout.write(`${report.passed ? 'PASS' : 'FAIL'}: ${report.cases.filter(item => item.passed).length}/${report.cases.length} cases; ${report.assertions} assertions.\nReport: ${output}\n`);
for (const item of report.cases.filter(item => !item.passed)) process.stderr.write(`${item.name}: ${item.error}\n`);
process.exitCode = report.passed ? 0 : 1;
