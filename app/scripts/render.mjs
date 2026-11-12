// Offline renderer: drives headless Chrome frame-by-frame (deterministic timeline), then encodes with ffmpeg.
//   node scripts/render.mjs [--workers 2] [--from 0] [--to N] [--step 1] [--frames out/frames] [--out out/all-correct.mp4]
//                           [--encode-only] [--no-encode]
// Existing frames are skipped, so an interrupted render resumes where it stopped.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { FPS, WIDTH, HEIGHT, JPG_QUALITY, CHROME_DEFAULT } from '../src/config.mjs';
import { loadTimeline } from './dump_timeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes('--' + k);
const TL = loadTimeline();
const FRAMES = TL.TOTAL_FRAMES;
const workers = +arg('workers', 2), from = +arg('from', 0), to = Math.min(+arg('to', FRAMES), FRAMES), step = +arg('step', 1);
const outDir = path.join(ROOT, arg('frames', 'out/frames'));
const outFile = path.join(ROOT, arg('out', 'out/all-correct.mp4'));
const chrome = process.env.CHROME ?? CHROME_DEFAULT;
fs.mkdirSync(outDir, { recursive: true });
const name = (f) => path.join(outDir, String(f).padStart(5, '0') + '.jpg');
if (TL.estimated) console.log('warning: some lines have no measured dur (run scripts/build_audio.py) — using estimates');

async function worker(id, frames, port) {
  if (!frames.length) return;
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, protocolTimeout: 0,
    args: ['--no-sandbox', `--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  page.on('pageerror', e => console.log(`[w${id}] PAGEERROR`, e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html?capture=1`, { timeout: 0 });
  await page.waitForFunction('window.READY === true', { timeout: 0 });
  const pageFrames = await page.evaluate(() => window.TOTAL_FRAMES);
  if (pageFrames !== FRAMES) { console.log(`[w${id}] TOTAL_FRAMES mismatch: page ${pageFrames} vs node ${FRAMES}`); process.exit(1); }
  const cdp = await page.createCDPSession();
  let n = 0; const t0 = Date.now();
  for (const f of frames) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: JPG_QUALITY, optimizeForSpeed: true });
    fs.writeFileSync(name(f), Buffer.from(data, 'base64'));
    n++;
    if (n % 150 === 0 || n === frames.length) {
      const per = (Date.now() - t0) / n / 1000;
      console.log(`[w${id}] frame ${f}  ${n}/${frames.length}  ${per.toFixed(3)}s/frame  eta ${((frames.length - n) * per / 60).toFixed(1)} min`);
    }
  }
  await browser.close();
}

if (!flag('encode-only')) {
  const todo = [];
  for (let f = from; f < to; f += step) if (!fs.existsSync(name(f))) todo.push(f);
  console.log(`${todo.length} frames to render with ${workers} workers (of ${FRAMES} total)`);
  const srv = await serve();
  const size = Math.ceil(todo.length / workers);   // contiguous chunks
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i, todo.slice(i * size, (i + 1) * size), srv.address().port)));
  srv.close();
}

if (!flag('no-encode')) {
  const missing = []; for (let f = from; f < to; f++) if (!fs.existsSync(name(f))) missing.push(f);
  if (missing.length) { console.log(`not encoding: ${missing.length} frames missing (first ${missing[0]})`); process.exit(1); }
  const mix = path.join(ROOT, 'audio/mix.wav');
  const audioIn = fs.existsSync(mix) ? ['-i', mix] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'];
  if (!fs.existsSync(mix)) console.log('no audio/mix.wav — encoding with a silent track');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-stats',
    '-framerate', String(FPS), '-start_number', String(from), '-i', path.join(outDir, '%05d.jpg'), ...audioIn,
    '-frames:v', String(to - from), '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outFile], { stdio: 'inherit' });
  if (r.status !== 0) { console.log('ffmpeg failed'); process.exit(1); }
  console.log(`wrote ${outFile}`);
}
