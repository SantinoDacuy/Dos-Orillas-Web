import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Install in repo/scripts. It never builds/launches a browser and never changes DOM.
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireProject = createRequire(path.join(repository, 'package.json'));
function option(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
const command = process.argv[2];
if (process.argv.includes('--help') || !command) {
  console.log('node scripts/project-fixture.mjs install|status|restore [--data data/projects.ts]');
  console.log('Temporary source fixture → explicitly build/test → restore original bytes → rebuild final production. Never publish a fixture build.');
  process.exit(0);
}
assert.ok(['install', 'status', 'restore'].includes(command), 'Use install, status or restore.');
const sourcePath = path.resolve(repository, option('--data', 'data/projects.ts'));
const relative = path.relative(repository, sourcePath);
assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'The source must stay inside this repository.');
assert.ok(sourcePath.endsWith('.ts'), 'Fixture requires the actual TypeScript project source.');
const directory = path.join(repository, 'qa-results', 'F5', 'fixtures');
const manifestPath = path.join(directory, 'active-project-fixture.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(sourcePath);
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : null;
const fixtureSlug = 'qa-prueba-de-estructura';

if (command === 'status') {
  console.log(JSON.stringify({ sourcePath, sourceSHA256: hash(source),
    fixtureTextPresent: source.toString('utf8').includes(fixtureSlug), manifest }, null, 2));
} else if (command === 'restore') {
  assert.ok(manifest && manifest.sourcePath === sourcePath, 'No matching fixture backup exists.');
  const backupPath = path.resolve(manifest.backupPath);
  assert.ok(path.dirname(backupPath) === directory, 'Backup path must stay inside the fixture directory.');
  const backup = await readFile(backupPath);
  assert.equal(hash(backup), manifest.originalSHA256, 'Original backup hash changed; do not overwrite source.');
  const currentHash = hash(source);
  assert.ok(currentHash === manifest.patchedSHA256 || currentHash === manifest.originalSHA256,
    'Source changed after fixture installation. Review those edits before restoring; nothing was overwritten.');
  if (currentHash !== manifest.originalSHA256) await writeFile(sourcePath, backup);
  assert.ok((await readFile(sourcePath)).equals(backup), 'Restoration must be byte-for-byte exact.');
  manifest.restoredAt = new Date().toISOString();
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Restored original source bytes: ${manifest.originalSHA256}. Rebuild before final delivery.`);
} else {
  assert.ok(!manifest || manifest.restoredAt, 'An active fixture already has a backup. Restore it before installing another.');
  const text = source.toString('utf8');
  assert.ok(!text.includes(fixtureSlug), 'The QA slug already exists; do not append another fixture.');
  const ts = requireProject('typescript');
  const ast = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let array;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'projects'
      && node.initializer && ts.isArrayLiteralExpression(node.initializer)) array = node.initializer;
    if (!array) ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(array && text[array.end - 1] === ']', 'Expected a literal exported projects array.');
  const compiled = ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const transpiledModule = { exports: {} };
  vm.runInNewContext(compiled, { module: transpiledModule, exports: transpiledModule.exports, require: requireProject }, { filename: sourcePath, timeout: 1500 });
  const projects = transpiledModule.exports.projects;
  assert.ok(Array.isArray(projects) && projects.length === 5, 'This sixth-record check requires the current five-record baseline.');
  const fixture = {
    slug: fixtureSlug, title: 'Prueba de estructura', titleLines: ['PRUEBA DE', 'ESTRUCTURA'],
    year: null, categoryLabel: 'QA · Prueba de estructura', categories: ['sistemas'], context: 'personal',
    description: 'Registro temporal de QA para comprobar cantidad, layout y navegación. No representa un proyecto real ni un cliente.',
    intro: null, challenge: null, approach: null, solution: null, result: null,
    technologies: ['QA estructural temporal'], authors: [],
    cover: { src: null, alt: '', width: 2400, height: 1500 }, gallery: [], keyVisual: 'dw-structure',
    tone: { bg: '#10263E', fg: '#F2EEE6' }, featured: true,
    order: Math.max(...projects.map(project => project.order)) + 1, liveUrl: null, githubUrl: null,
  };
  const insertion = array.end - 1;
  const comma = array.elements.length && !array.elements.hasTrailingComma ? ',' : '';
  const fixtureText = JSON.stringify(fixture, null, 2).split('\n').map(line => `  ${line}`).join('\n');
  const patched = Buffer.from(text.slice(0, insertion) + `${comma}\n  // QA TEMPORAL: no cliente/no producción; restaurar bytes originales tras el gate.\n${fixtureText},\n` + text.slice(insertion), 'utf8');
  await mkdir(directory, { recursive: true });
  const backupPath = path.join(directory, `projects-original-${Date.now()}.bin`);
  await writeFile(backupPath, source, { flag: 'wx' });
  const state = {
    sourcePath, backupPath, originalSHA256: hash(source), patchedSHA256: hash(patched),
    originalCount: projects.length, fixtureSlug, installedAt: new Date().toISOString(),
  };
  // Persist recovery information before mutating the source.
  await writeFile(manifestPath, JSON.stringify(state, null, 2));
  await writeFile(sourcePath, patched);
  assert.equal(hash(await readFile(sourcePath)), state.patchedSHA256, 'Patched source write did not match.');
  console.log(`Installed one labelled QA record (${projects.length} → ${projects.length + 1}). Original backup: ${backupPath}`);
  console.log('Next: build/test explicitly; always restore source, then rebuild final production.');
}
