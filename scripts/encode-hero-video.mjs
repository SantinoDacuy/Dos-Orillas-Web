#!/usr/bin/env node
/**
 * Prepara un video para el Hero: limpieza, versiones de escritorio y celular y afiches. Sin audio (el Hero va silenciado).
 *
 *   node scripts/encode-hero-video.mjs <entrada> <nombre> [--clean=strong|light|none] [--mobile-intro=T0:T1:Z0]
 *   p. ej.: node scripts/encode-hero-video.mjs ./mi-video.mp4 hero-city
 *
 * Salida en public/visuals/:
 *   <nombre>-1080.av1.mp4 / <nombre>-1080.h264.mp4      escritorio, 1920×1080
 *   <nombre>-mobile.av1.mp4 / <nombre>-mobile.h264.mp4  celular, 720×1280 (recorte vertical centrado:
 *                                                       es la misma zona que muestra object-fit: cover)
 *   <nombre>-poster.webp (1280 px) / <nombre>-poster-desktop.webp (1920 px) / <nombre>-poster-mobile.webp
 *   <nombre>-end-desktop.webp / <nombre>-end.webp       último cuadro (movimiento reducido)
 *
 * --clean=strong (por defecto) desbloquea y quita ruido: para fuentes muy comprimidas.
 * --clean=light para fuentes buenas (sólo un realce suave); --clean=none no toca la imagen.
 * --mobile-intro=T0:T1:Z0 para videos que abren con algo ancho centrado sobre fondo liso (p. ej. un logo): en
 *   celular arranca más abierto (Z0 = cuánto se acerca respecto del cuadro entero, rellenando arriba y abajo con
 *   el color del fondo) y entre T0 y T1 segundos se acerca suavemente hasta el recorte vertical normal.
 * Usa `ffmpeg`/`ffprobe` del PATH o las variables FFMPEG/FFPROBE.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [input, name, ...flags] = process.argv.slice(2);
if (!input || !name || !existsSync(input)) {
  console.error('Uso: node scripts/encode-hero-video.mjs <entrada> <nombre> [--clean=strong|light|none] [--mobile-intro=T0:T1:Z0]');
  process.exit(1);
}
const flag = key => flags.find(item => item.startsWith(`--${key}=`))?.split('=')[1];
const clean = flag('clean') ?? 'strong';
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const ffprobe = process.env.FFPROBE || (process.env.FFMPEG ? path.join(path.dirname(process.env.FFMPEG), 'ffprobe') : 'ffprobe');
const out = path.resolve('public/visuals');

const CLEAN = {
  // Dos pasadas de desbloqueo (bloques de 16 y 8 px), eliminación de ruido espacial y temporal y un realce adaptativo.
  strong: 'deblock=filter=strong:block=16:alpha=0.14:beta=0.09:gamma=0.08:delta=0.06,deblock=filter=strong:block=8,nlmeans=s=3:p=7:r=15,hqdn3d=1.5:1.5:5:4,cas=0.25',
  light: 'hqdn3d=1:1:3:3,cas=0.2',
  none: 'null',
};
if (!(clean in CLEAN)) throw new Error(`--clean inválido: ${clean}`);

const run = args => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ffmpeg falló: ${args.join(' ')}`);
};
const probe = (entries, file) => spawnSync(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', file], { encoding: 'utf8' }).stdout.trim();

// La limpieza (lenta) se hace una sola vez, a un intermedio sin pérdida a 2560 px como máximo; todas las salidas parten de ahí.
const work = mkdtempSync(path.join(tmpdir(), 'hero-video-'));
const master = path.join(work, 'master.mkv');
run(['-i', input, '-an', '-vf', `${CLEAN[clean]},scale='min(2560,iw)':-2:flags=lanczos`, '-c:v', 'ffv1', '-level', '3', master]);
const [num, den = '1'] = probe('stream=r_frame_rate', master).split('/');
const fps = Number(num) / Number(den);

const desktop = 'scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p';
let mobile = 'crop=ih*9/16:ih,scale=720:1280:flags=lanczos,setsar=1,format=yuv420p';
let mobileStill = 'crop=ih*9/16:ih,scale=720:1280:flags=lanczos';
const intro = flag('mobile-intro');
if (intro) {
  const [t0, t1, z0] = intro.split(':').map(Number);
  if (![t0, t1, z0].every(Number.isFinite) || t1 <= t0) throw new Error(`--mobile-intro inválido: ${intro}`);
  // Lienzo vertical 9:16 con el cuadro entero centrado; el color de relleno es el del fondo (esquina superior izquierda).
  const color = spawnSync(ffmpeg, ['-v', 'error', '-i', master, '-frames:v', '1', '-vf', 'crop=8:8:8:8,scale=1:1,format=rgb24', '-f', 'rawvideo', '-'], { encoding: 'buffer' }).stdout;
  const hex = `0x${[...color.subarray(0, 3)].map(value => value.toString(16).padStart(2, '0')).join('')}`;
  const canvas = `scale=2560:1440:flags=lanczos,pad=2560:4552:0:(oh-ih)/2:color=${hex}`;
  const full = 4552 / 1440; // acercamiento en que la vista es exactamente el recorte vertical del cuadro
  const ease = `(clip((it-${t0})/${t1 - t0},0,1)*clip((it-${t0})/${t1 - t0},0,1)*(3-2*clip((it-${t0})/${t1 - t0},0,1)))`;
  mobile = `${canvas},zoompan=z='${z0}*pow(${full / z0},${ease})':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=720x1280:fps=${fps},setsar=1,format=yuv420p`;
  mobileStill = `${canvas},crop=iw/${z0}:ih/${z0},scale=720:1280:flags=lanczos`;
}

const av1 = (vf, crf, file) => run(['-i', master, '-an', '-vf', vf, '-c:v', 'libsvtav1', '-preset', '4', '-crf', String(crf), '-g', String(Math.round(fps * 2)), '-svtav1-params', 'tune=0:film-grain=0', '-movflags', '+faststart', path.join(out, file)]);
const h264 = (vf, crf, file) => run(['-i', master, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', String(Math.round(fps * 2)), '-movflags', '+faststart', path.join(out, file)]);
const still = (vf, file, last = false) => run([...(last ? ['-sseof', '-0.1'] : []), '-i', master, '-vf', vf, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82', path.join(out, file)]);

av1(desktop, 38, `${name}-1080.av1.mp4`);
h264(desktop, 25, `${name}-1080.h264.mp4`);
av1(mobile, 42, `${name}-mobile.av1.mp4`);
h264(mobile, 28, `${name}-mobile.h264.mp4`);
still('scale=1280:720:flags=lanczos', `${name}-poster.webp`);
still('scale=1920:1080:flags=lanczos', `${name}-poster-desktop.webp`);
still(mobileStill, `${name}-poster-mobile.webp`);
still('scale=1920:1080:flags=lanczos', `${name}-end-desktop.webp`, true);
still('crop=ih*9/16:ih,scale=720:1280:flags=lanczos', `${name}-end.webp`, true);
rmSync(work, { recursive: true, force: true });

for (const suffix of ['-1080.av1.mp4', '-1080.h264.mp4', '-mobile.av1.mp4', '-mobile.h264.mp4', '-poster.webp', '-poster-desktop.webp', '-poster-mobile.webp', '-end-desktop.webp', '-end.webp']) {
  const file = path.join(out, name + suffix);
  console.log(`${path.relative(process.cwd(), file)}  ${(statSync(file).size / 1024).toFixed(0)} KB`);
}
