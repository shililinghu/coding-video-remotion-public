// 第一幕 · 开场
import { C, text, arrow, avatar, account, chip, strike, tag, check, W } from '../engine/draw.mjs';
import { pop, fade, range, roll, srange, clamp } from '../engine/ease.mjs';

const chapter = '开场';

// shared opening layout (also reused by the final shot)
export function accountScene(g, t, { t0, tMom, tYou, tBoth, value = 100, cardS = 1, flash = 0, color = C.ink, arrowsA = 1 }) {
  const cx = W / 2, cy = 360;
  avatar(g, 230, 330, 'mom', { s: pop(t, tMom), label: '妈妈' });
  avatar(g, W - 230, 330, 'you', { s: pop(t, tYou), label: '你' });
  const ka = srange(t, tBoth, tBoth + 0.6);
  const pulse = t > tBoth ? 1 + 0.06 * Math.sin((t - tBoth) * 8) * Math.exp(-(t - tBoth) * 1.5) : 1;
  arrow(g, 300, 330, cx - 175, cy - 10, { color: C.sageDk, lw: 6 * pulse, k: Math.max(range(t, tMom + 0.3, tMom + 0.9) * 0.55, ka), a: arrowsA, bend: -0.12, head: 20 });
  arrow(g, W - 300, 330, cx + 175, cy - 10, { color: C.blueDk, lw: 6 * pulse, k: Math.max(range(t, tYou + 0.3, tYou + 0.9) * 0.55, ka), a: arrowsA, bend: 0.12, head: 20 });
  chip(g, '+50', 395, 250, { fill: C.sage, s: pop(t, tMom + 0.25), a: arrowsA });
  chip(g, '−30', W - 395, 250, { fill: C.blue, s: pop(t, tYou + 0.25), a: arrowsA });
  account(g, cx, cy, value, { s: pop(t, t0) * cardS, flash, color });
}

export const shots = [
  {
    id: 's-account', act: 1, chapter, lines: ['hook'],
    render(g, t, S, TL) {
      const h = S.lineTimes.hook;
      accountScene(g, t, { t0: h, tMom: TL.cue('hook', '妈妈'), tYou: TL.cue('hook', '你同时'), tBoth: TL.cue('hook', '同时') });
      tag(g, '同时发生', W / 2, 560, { a: fade(t, TL.cue('hook', '同时') + 0.1), color: C.ink, size: 24 });
    },
  },
  {
    id: 's-expect', act: 1, chapter, lines: ['question'],
    render(g, t, S, TL) {
      const q = S.lineTimes.question, tEq = TL.cue('question', '120');
      tag(g, '按直觉算一下', W / 2, 200, { a: fade(t, q), size: 24 });
      const y = 340, sz = 96;
      text(g, '100', 300, y, { size: sz, font: 'title', s: pop(t, q + 0.05) });
      text(g, '+ 50', 520, y, { size: sz, font: 'title', color: C.sageDk, s: pop(t, q + 0.3) });
      text(g, '− 30', 750, y, { size: sz, font: 'title', color: C.blueDk, s: pop(t, q + 0.55) });
      text(g, '=', 930, y, { size: sz, font: 'title', s: pop(t, q + 0.8) });
      const qa = 1 - range(t, tEq - 0.1, tEq + 0.1);
      text(g, '?', 1060, y, { size: sz, font: 'title', color: C.inkSoft, s: pop(t, q + 0.9), a: qa });
      text(g, '120', 1060, y, { size: sz, font: 'title', s: pop(t, tEq) });
      text(g, '对吧？', W / 2, 480, { size: 40, color: C.inkSoft, a: fade(t, TL.cue('question', '对吧')) });
    },
  },
  {
    id: 's-twist', act: 1, chapter, lines: ['twist'],
    render(g, t, S, TL) {
      const tw = S.lineTimes.twist, t70 = TL.cue('twist', '70'), tGone = TL.cue('twist', '50 块'), tAir = TL.cue('twist', '凭空');
      tag(g, '银行系统最后写下的', W / 2, 165, { a: fade(t, tw), size: 24 });
      const v = t < t70 ? '?' : String(roll(t, t70, 120, 70, 0.35));
      const flash = t > t70 ? clamp(0.5 + 0.5 * Math.cos((t - t70) * 10)) * (1 - range(t, t70 + 1.2, t70 + 2.2)) * 0.8 + 0.2 * (t > t70) : 0;
      account(g, W / 2, 330, v, { s: pop(t, tw - 0.1), flash, color: t > t70 + 0.35 ? C.red : C.ink });
      // expected 120, struck through
      const ex = 960, ey = 330;
      text(g, '预期', ex, ey - 54, { size: 24, color: C.inkSoft, a: fade(t, tw + 0.2) });
      text(g, '¥120', ex, ey, { size: 60, font: 'title', a: fade(t, tw + 0.2) });
      strike(g, ex - 80, ey + 22, ex + 80, ey - 18, range(t, t70 + 0.3, t70 + 0.6));
      // the 50 floats away and fades
      const k = range(t, tAir, tAir + 1.4);
      chip(g, '+50', 320, 330 - 90 * k, { fill: C.sage, s: pop(t, tGone - 0.2), a: 1 - k });
      text(g, '妈妈存的 50', 320, 400, { size: 22, color: C.sageDk, a: fade(t, tGone - 0.2) * (1 - range(t, tAir, tAir + 0.3)) });
      if (k > 0.2) text(g, '50 块凭空没了', 320, 400, { size: 26, color: C.red, weight: 700, a: range(t, tAir + 0.3, tAir + 0.8) });
    },
  },
  {
    id: 's-title', act: 1, chapter, lines: ['title'],
    render(g, t, S, TL) {
      const ti = S.lineTimes.title, tStep = TL.cue('title', '每一步');
      text(g, '为什么所有人都做对了，', W / 2, 260, { size: 64, font: 'title', s: pop(t, ti, 0.6) });
      text(g, '最后结果却可能是错的？', W / 2, 350, { size: 64, font: 'title', s: pop(t, ti + 0.35, 0.6) });
      const steps = ['读余额', '计算', '写回'];
      steps.forEach((s, i) => {
        const x = W / 2 + (i - 1) * 200, t0 = tStep + i * 0.25;
        text(g, s, x - 16, 480, { size: 30, a: fade(t, t0) });
        check(g, x + 52, 480, 18, range(t, t0, t0 + 0.4));
      });
    },
  },
];
