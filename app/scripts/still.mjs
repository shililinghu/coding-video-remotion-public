// Render stills for look-dev.
//   node scripts/still.mjs <t1,t2,...> [outDir]          stills at the given seconds
//   node scripts/still.mjs --shots [outDir]               two stills per shot (in+0.5s, end−0.5s)
//   node scripts/still.mjs --mid [outDir]                 one still per shot midpoint
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { CHROME_DEFAULT, WIDTH, HEIGHT } from '../src/config.mjs';
import { loadTimeline } from './dump_timeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , spec = '0', outArg = 'out/stills'] = process.argv;
const outDir = path.join(ROOT, outArg);
fs.mkdirSync(outDir, { recursive: true });

const TL = loadTimeline();
let jobs;
if (spec === '--shots') jobs = TL.SHOTS.flatMap(s => [[`${String(s.index + 1).padStart(2, '0')}_${s.id}_a`, s.start + 0.5], [`${String(s.index + 1).padStart(2, '0')}_${s.id}_b`, s.end - 0.5]]);
else if (spec === '--mid') jobs = TL.SHOTS.map(s => [`${String(s.index + 1).padStart(2, '0')}_${s.id}`, (s.start + s.end) / 2]);
else jobs = spec.split(',').map(x => [`t${(+x).toFixed(2)}`, +x]);

const srv = await serve();
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? CHROME_DEFAULT, headless: true,
  args: ['--no-sandbox', `--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars'] });
const page = await browser.newPage(); await page.setViewport({ width: WIDTH, height: HEIGHT });
let errors = 0;
page.on('console', m => { if (m.type() === 'error') console.log('page error:', m.text()); });
page.on('pageerror', e => { errors++; console.log('PAGEERROR', e.message); });
await page.goto(`http://127.0.0.1:${srv.address().port}/src/index.html?capture=1`);
await page.waitForFunction('window.READY === true', { timeout: 60000 });
const cdp = await page.createCDPSession();
for (const [name, t] of jobs) {
  await page.evaluate(t => window.renderAt(t), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(outDir, name + '.png');
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  console.log(`t=${t.toFixed(2)} -> ${path.relative(ROOT, file)}`);
}
await browser.close(); srv.close();
if (errors) { console.log(`${errors} page errors`); process.exit(1); }
