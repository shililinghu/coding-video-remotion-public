// Write out/timeline.json (used by mix.py) and print the shot table.
//   node scripts/dump_timeline.mjs [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../src/engine/timeline.mjs';
import { SHOTS } from '../src/scenes/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function loadTimeline() {
  const lines = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/lines.json'), 'utf8'));
  return buildTimeline(lines, SHOTS);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const TL = loadTimeline();
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const out = {
    DURATION: TL.DURATION, TOTAL_FRAMES: TL.TOTAL_FRAMES, estimated: TL.estimated,
    VOICE: TL.VOICE.map(({ id, at, dur }) => ({ id, at, dur })),
    SUBS: TL.SUBS.map(({ id, text, a, b }) => ({ id, text, a, b })),
    SHOTS: TL.SHOTS.map(({ id, act, chapter, lines, start, end, lineTimes }) => ({ id, act, chapter, lines, start, end, lineTimes })),
  };
  fs.writeFileSync(path.join(ROOT, 'out/timeline.json'), JSON.stringify(out, null, 1));
  if (!process.argv.includes('--quiet')) {
    for (const s of TL.SHOTS) console.log(`${String(s.index + 1).padStart(2)} ${s.id.padEnd(14)} act${s.act}  ${s.start.toFixed(2).padStart(7)} – ${s.end.toFixed(2).padStart(7)}  ${s.lines.join(', ')}`);
  }
  console.log(`${TL.SHOTS.length} shots, ${TL.VOICE.length} lines, DURATION ${TL.DURATION.toFixed(2)}s, TOTAL_FRAMES ${TL.TOTAL_FRAMES}${TL.estimated ? '  (estimated durations)' : ''}`);
}
