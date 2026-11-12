// Pure timeline builder shared by the browser runtime and Node scripts.
//   buildTimeline(lines, shots) → absolute timings for voice, subtitles and shots.
// lines: [{id, emo, text, dur?}]   shots: [{id, act, chapter, lines:[id...]}]
import { FPS, GAP, LEAD, TAIL, ACT_GAP, INTRO, OUTRO, XFADE, EST_CPS } from '../config.mjs';

export const estimateDur = (text) => [...text].length / EST_CPS + 0.4;
export const MAX_SUB = 24;

/** Split a line into subtitle chunks (≤ MAX_SUB chars, cut at sentence ends, or at commas once ≥ 10 chars). */
export function splitSubs(text) {
  const parts = []; let buf = '';
  for (const ch of text) {
    buf += ch;
    const n = [...buf].length;
    if ('。！？；'.includes(ch) || ('，：、—'.includes(ch) && n >= 10) || n >= MAX_SUB) { parts.push(buf); buf = ''; }
  }
  if (buf.trim()) parts.push(buf);
  // merge a very short trailing chunk back if it still fits
  for (let i = parts.length - 1; i > 0; i--) {
    const a = [...parts[i - 1]].length, b = [...parts[i]].length;
    if (b <= 3 && a + b <= MAX_SUB && !'。！？；'.includes(parts[i - 1].slice(-1))) { parts[i - 1] += parts[i]; parts.splice(i, 1); }
  }
  return parts;
}
/** strip trailing pause punctuation for display */
export const cleanSub = (s) => s.replace(/[，。、；：]$/, '');

export function buildTimeline(lines, shots) {
  const byId = Object.fromEntries(lines.map(l => [l.id, l]));
  const estimated = lines.some(l => !(l.dur > 0));
  const dur = (id) => { const l = byId[id]; if (!l) throw new Error('unknown line ' + id); return l.dur > 0 ? l.dur : estimateDur(l.text); };

  const VOICE = [], SHOTS = [];
  let t = INTRO;
  shots.forEach((s, i) => {
    const prev = shots[i - 1];
    if (prev && prev.act !== s.act) t += ACT_GAP;
    const start = i === 0 ? 0 : t;
    let cur = (i === 0 ? INTRO : t) + LEAD;
    const lineTimes = {};
    s.lines.forEach((id, k) => {
      if (k) cur += GAP;
      lineTimes[id] = cur;
      VOICE.push({ id, at: cur, dur: dur(id), shot: i });
      cur += dur(id);
    });
    const end = cur + TAIL;
    SHOTS.push({ ...s, index: i, start, end, lineTimes, speechEnd: cur });
    t = end;
  });
  const last = SHOTS[SHOTS.length - 1];
  last.end += OUTRO;
  const DURATION = last.end;
  const TOTAL_FRAMES = Math.ceil(DURATION * FPS);

  // time at which a given character offset (or keyword) of a line is spoken — linear by char index.
  // key: number (char offset) | "word" | ["word", n] (n-th occurrence, 0-based)
  const cue = (id, key = 0, bias = 0) => {
    const v = VOICE.find(v => v.id === id); if (!v) throw new Error('no voice for ' + id);
    const text = byId[id].text, chars = [...text];
    let idx = key;
    if (typeof key === 'string' || Array.isArray(key)) {
      const [word, nth] = Array.isArray(key) ? key : [key, 0];
      let j = -1;
      for (let n = 0; n <= nth; n++) { j = text.indexOf(word, j + 1); if (j < 0) break; }
      if (j < 0) throw new Error(`cue key "${word}"#${nth} not in line ${id}`);
      idx = [...text.slice(0, j)].length;
    }
    return v.at + (idx / chars.length) * v.dur + bias;
  };

  const SUBS = [];
  for (const v of VOICE) {
    const parts = splitSubs(byId[v.id].text);
    let off = 0;
    parts.forEach((p, k) => {
      const a = k === 0 ? v.at : cue(v.id, off) - 0.05;
      off += [...p].length;
      const b = k === parts.length - 1 ? v.at + v.dur : cue(v.id, off) - 0.05;
      SUBS.push({ id: v.id, text: cleanSub(p), raw: p, a, b });
    });
  }

  const shotAt = (t) => { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i]; return SHOTS[0]; };
  const chapterAt = (t) => { const s = shotAt(t); return { act: s.act, chapter: s.chapter }; };
  /** shots visible at t: [{shot, alpha}] — bottom layer first; cross-dissolve centred on each boundary */
  const layersAt = (t) => {
    const s = shotAt(t), h = XFADE / 2;
    const next = SHOTS[s.index + 1], prev = SHOTS[s.index - 1];
    if (next && t > s.end - h) return [{ shot: s, alpha: 1 }, { shot: next, alpha: (t - (s.end - h)) / XFADE }];
    if (prev && t < s.start + h) return [{ shot: prev, alpha: 1 }, { shot: s, alpha: (t - (s.start - h)) / XFADE }];
    return [{ shot: s, alpha: 1 }];
  };
  return { VOICE, SUBS, SHOTS, DURATION, TOTAL_FRAMES, estimated, cue, shotAt, chapterAt, layersAt, lines: byId };
}
