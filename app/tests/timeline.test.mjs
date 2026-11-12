import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildTimeline, splitSubs, MAX_SUB } from '../src/engine/timeline.mjs';
import { SHOTS } from '../src/scenes/index.mjs';
import { FPS, GAP } from '../src/config.mjs';

const lines = JSON.parse(fs.readFileSync(new URL('../src/data/lines.json', import.meta.url), 'utf8'));
const TL = buildTimeline(lines, SHOTS);

test('28 lines, unique ids, text identical to the script, in order', () => {
  const md = fs.readFileSync(new URL('../../文稿-为什么所有人都做对了.md', import.meta.url), 'utf8').replace(/\r/g, '');
  const re = /^\*\*\[([\w-]+)\]\*\*\s*〔(.+?)〕\n(.+)$/gm;
  const script = []; let m;
  while ((m = re.exec(md))) script.push({ id: m[1], emo: m[2], text: m[3].trim() });
  assert.equal(lines.length, 28);
  assert.equal(new Set(lines.map(l => l.id)).size, 28);
  assert.deepEqual(lines.map(l => ({ id: l.id, emo: l.emo, text: l.text })), script);
});

test('every line belongs to exactly one shot, in script order', () => {
  const used = SHOTS.flatMap(s => s.lines);
  assert.deepEqual(used, lines.map(l => l.id));
  assert.equal(new Set(SHOTS.map(s => s.id)).size, SHOTS.length);
});

test('voice is monotonic, non-overlapping, gaps ≥ GAP', () => {
  for (let i = 1; i < TL.VOICE.length; i++) {
    const a = TL.VOICE[i - 1], b = TL.VOICE[i];
    assert.ok(b.at - (a.at + a.dur) >= GAP - 1e-9, `${a.id} → ${b.id}`);
  }
  for (const v of TL.VOICE) { const s = TL.SHOTS[v.shot]; assert.ok(v.at >= s.start && v.at + v.dur <= s.end, v.id); }
});

test('shots tile the whole timeline', () => {
  assert.equal(TL.SHOTS[0].start, 0);
  for (let i = 1; i < TL.SHOTS.length; i++) assert.ok(TL.SHOTS[i].start >= TL.SHOTS[i - 1].end - 1e-9);
  assert.equal(TL.DURATION, TL.SHOTS.at(-1).end);
});

test('subtitle chunks ≤ MAX_SUB chars and reassemble to the line', () => {
  for (const l of lines) {
    const parts = splitSubs(l.text);
    assert.equal(parts.join(''), l.text);
    for (const p of parts) assert.ok([...p].length <= MAX_SUB, `${l.id}: ${p}`);
  }
  for (let i = 1; i < TL.SUBS.length; i++) assert.ok(TL.SUBS[i].a >= TL.SUBS[i - 1].a);
});

test('TOTAL_FRAMES = ceil(DURATION * FPS)', () => {
  assert.equal(TL.TOTAL_FRAMES, Math.ceil(TL.DURATION * FPS));
});

test('cue keys used by scenes exist (rendering every shot at a few times would throw otherwise)', () => {
  // cue() throws on a missing key; a render with a stub context exercises every cue lookup.
  const stub = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (k === 'measureText' ? () => ({ width: 100 }) : () => {})), set: (o, k, v) => { o[k] = v; return true; } });
  for (const s of TL.SHOTS) {
    if (s.id === 's-recap') continue; // needs real canvases for thumbnails
    for (const t of [s.start, (s.start + s.end) / 2, s.end]) s.render(stub, t, s, TL);
  }
});
