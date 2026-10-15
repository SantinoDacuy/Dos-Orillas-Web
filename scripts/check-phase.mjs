import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const phase = process.argv[2] ?? 'F3';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
server.stdout.on('data', chunk => process.stdout.write(chunk));
server.stderr.on('data', chunk => process.stderr.write(chunk));
async function run(script) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script, '--phase', phase], { stdio: 'inherit', windowsHide: true });
    child.on('exit', code => resolve(code ?? 1));
  });
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { const response = await fetch('http://127.0.0.1:3000'); if (response.ok) { ready = true; break; } } catch {}
    await delay(200);
  }
  if (!ready) throw new Error('El servidor de verificación no inició.');
  const qaCode = await run('scripts/qa-phase.mjs');
  const perfCode = await run('scripts/lighthouse.mjs');
  process.exitCode = qaCode || perfCode;
} finally { server.kill(); }
