// 第二幕 · 每个人都做对了
import { C, text, codePanel, chip, check, arrow, stamp, rr, tag, W } from '../engine/draw.mjs';
import { pop, fade, range, srange, lerp } from '../engine/ease.mjs';

const chapter = '每个人都做对了';
export const DEPOSIT = ['x = 读余额()', 'x = x + 50', '写余额(x)'];
export const WITHDRAW = ['y = 读余额()', 'y = y - 30', '写余额(y)'];

/** highlight curve: on at t0, dims when t1 arrives */
const hl = (t, t0, t1) => range(t, t0 - 0.1, t0 + 0.15) * (t1 == null ? 1 : 1 - 0.6 * range(t, t1 - 0.1, t1 + 0.15));

/** a row of three step blocks 读/算/写; returns nothing. x = left, w = total width */
export function stepBar(g, x, y, w, color, labels, { a = 1, h = 46, ks = [1, 1, 1] } = {}) {
  const bw = w / 3;
  labels.forEach((l, i) => {
    const k = ks[i]; if (k <= 0) return;
    g.save(); g.globalAlpha *= a * k;
    rr(g, x + i * bw + 3, y - h / 2, bw - 6, h, 10); g.fillStyle = color; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2.5; g.stroke();
    g.restore();
    text(g, l, x + i * bw + bw / 2, y + 1, { size: 22, a: a * k });
  });
}

export const shots = [
  {
    id: 's-code', act: 2, chapter, lines: ['steps'],
    render(g, t, S, TL) {
      const c = (k) => TL.cue('steps', k);
      const d = [c(['读出余额', 0]), c('加上'), c(['写回去', 0])];
      const w = [c(['读出余额', 1]), c('减去'), c(['写回去', 1])];
      const p1 = pop(t, S.lineTimes.steps - 0.1), p2 = pop(t, c('取钱') - 0.1);
      codePanel(g, 110, 150, 500, '存钱', DEPOSIT, { color: C.sage, s: p1, hl: [hl(t, d[0], d[1]), hl(t, d[1], d[2]), hl(t, d[2], w[0])] });
      codePanel(g, 670, 150, 500, '取钱', WITHDRAW, { color: C.blue, s: p2, hl: [hl(t, w[0], w[1]), hl(t, w[1], w[2]), hl(t, w[2])] });
      const labels = ['读', '算', '写'];
      stepBar(g, 160, 470, 400, C.sage, labels, { ks: d.map(x => srange(t, x, x + 0.3)) });
      stepBar(g, 720, 470, 400, C.blue, labels, { ks: w.map(x => srange(t, x, x + 0.3)) });
      tag(g, '三件事：读 → 算 → 写', W / 2, 560, { a: fade(t, w[2] + 0.3), size: 22 });
    },
  },
  {
    id: 's-serial', act: 2, chapter, lines: ['correct'],
    render(g, t, S, TL) {
      const c0 = S.lineTimes.correct, tOk = TL.cue('correct', '完全正确');
      const tA = TL.cue('correct', '先存后取'), tB = TL.cue('correct', '先取后存');
      text(g, '单独看，每一段都对', W / 2, 140, { size: 34, font: 'title', a: fade(t, c0) });
      check(g, W / 2 + 190, 140, 18, range(t, tOk, tOk + 0.4));
      const row = (y, label, seq, t0, tEnd) => {
        text(g, label, 170, y, { size: 30, weight: 700, a: fade(t, t0 - 0.2) });
        seq.forEach(([str, fill], i) => {
          const x = 330 + i * 140, ti = t0 + i * ((tEnd - t0) / seq.length);
          if (i) arrow(g, x - 92, y, x - 50, y, { lw: 3, head: 10, k: range(t, ti - 0.1, ti + 0.1), color: C.inkSoft });
          chip(g, str, x, y, { fill, s: pop(t, ti, 0.4), size: 30 });
        });
        check(g, 330 + seq.length * 140 - 40, y, 22, range(t, tEnd, tEnd + 0.5));
      };
      const tEndA = TL.cue('correct', ['120', 0]), tEndB = TL.cue('correct', ['120', 1]);
      row(270, '先存后取', [['100', C.card], ['+50', C.sage], ['150', C.card], ['−30', C.blue], ['120', C.card]], tA, tEndA);
      row(420, '先取后存', [['100', C.card], ['−30', C.blue], ['70', C.card], ['+50', C.sage], ['120', C.card]], tB, tEndB);
    },
  },
  {
    id: 's-concurrent', act: 2, chapter, lines: ['but'],
    render(g, t, S, TL) {
      const b = S.lineTimes.but, tSim = TL.cue('but', '同时');
      const k = srange(t, tSim - 0.5, tSim + 0.1);           // 0 = one after another, 1 = overlapped
      const labels = ['读', '算', '写'];
      const x1 = lerp(200, 380, k), x2 = lerp(700, 400, k);
      text(g, '存钱', 140, 260, { size: 28, weight: 700, color: C.sageDk, a: fade(t, b - 0.2) });
      text(g, '取钱', 140, 360, { size: 28, weight: 700, color: C.blueDk, a: fade(t, b - 0.2) });
      stepBar(g, x1, 260, 420, C.sage, labels, { a: fade(t, b - 0.2) });
      stepBar(g, x2, 360, 420, C.blue, labels, { a: fade(t, b) });
      arrow(g, 200, 450, 1120, 450, { lw: 3, color: C.inkSoft, head: 12, k: range(t, b - 0.2, b + 0.4) });
      text(g, '时间', 1150, 450, { size: 22, color: C.inkSoft, a: fade(t, b + 0.2), align: 'left' });
      stamp(g, '同时', 960, 190, t, tSim + 0.15, { size: 48, color: C.apricotDk });
    },
  },
];
