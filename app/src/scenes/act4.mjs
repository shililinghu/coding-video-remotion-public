// 第四幕 · 真正的问题在哪
import { C, text, card, check, cross, bubble, rr, tag, arrow, W, H } from '../engine/draw.mjs';
import { pop, fade, range, srange, lerp, inOutCubic, clamp } from '../engine/ease.mjs';

const chapter = '真正的问题在哪';

export const shots = [
  {
    id: 's-gap', act: 4, chapter, lines: ['gap'],
    render(g, t, S, TL) {
      const g0 = S.lineTimes.gap, tNot = TL.cue('gap', '任何一行'), tGap = TL.cue('gap', '缝隙');
      // camera push-in centred on the gap
      const z = lerp(1, 1.35, inOutCubic(range(t, tGap - 0.8, tGap + 0.6)));
      g.save(); g.translate(W / 2, 330); g.scale(z, z); g.translate(-W / 2, -330);
      const open = srange(t, tGap - 0.4, tGap + 0.5);
      const y1 = 250 - 40 * open, y2 = 410 + 40 * open;
      const line = (y, str, tChk) => {
        card(g, W / 2, y, 520, 76, { fill: '#2f2b28', stroke: null, r: 12, s: pop(t, g0 - 0.1) });
        text(g, str, W / 2 - 220, y + 2, { size: 32, font: 'mono', color: '#fffaf0', align: 'left', a: fade(t, g0) });
        check(g, W / 2 + 300, y, 20, range(t, tChk, tChk + 0.4));
      };
      line(y1, 'x = 读余额()', tNot + 0.2);
      line(y2, '写余额(x)', tNot + 0.5);
      text(g, '每一行都没错', W / 2 + 300, y1 - 58, { size: 20, color: C.green, a: fade(t, tNot + 0.3) });
      // crack between the two lines
      if (open > 0) {
        const cy = 330, hw = 300 * open;
        g.save(); g.beginPath();
        const n = 14;
        g.moveTo(W / 2 - hw, cy);
        for (let i = 1; i <= n; i++) g.lineTo(W / 2 - hw + (2 * hw * i) / n, cy - (i % 2 ? 1 : -1) * 18 * open * (0.6 + 0.4 * ((i * 7) % 3) / 2));
        for (let i = n; i >= 0; i--) g.lineTo(W / 2 - hw + (2 * hw * i) / n, cy + (i % 2 ? 1 : -1) * 8 * open + 16 * open);
        g.closePath(); g.fillStyle = '#2b2622'; g.fill(); g.restore();
        text(g, '缝隙', W / 2 + hw + 50, cy + 6, { size: 34, font: 'title', color: C.apricotDk, a: fade(t, tGap + 0.2) });
      }
      g.restore();
      text(g, '错误不在代码里，在代码之间', W / 2, 600, { size: 28, font: 'title', color: C.inkSoft, a: fade(t, tGap + 0.5) });
    },
  },
  {
    id: 's-assume', act: 4, chapter, lines: ['assume'],
    render(g, t, S, TL) {
      const a0 = S.lineTimes.assume, tSolo = TL.cue('assume', '单独运行'), tOk = TL.cue('assume', '成立'), tCon = TL.cue('assume', '一旦'), tNo = TL.cue('assume', '不成立');
      bubble(g, W / 2, 150, 680, 92, ['我读到的值，在我写回去之前不会变'], { s: pop(t, a0 + 0.2), size: 30, tail: [0, 0] });
      text(g, '每个程序默认的假设', W / 2, 82, { size: 22, color: C.inkSoft, a: fade(t, a0) });
      const panel = (x, title, tIn, tEnd, ok) => {
        const a = fade(t, tIn);
        card(g, x, 390, 500, 240, { a, s: 0.9 + 0.1 * pop(t, tIn) });
        text(g, title, x, 300, { size: 28, weight: 700, a });
        // read ── write on a tiny timeline
        const yy = 425;
        g.save(); g.globalAlpha *= a; g.strokeStyle = C.inkSoft; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 200, yy); g.lineTo(x + 200, yy); g.stroke(); g.restore();
        const dot = (xx, str, col) => { g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.arc(xx, yy, 10, 0, 7); g.fill(); g.restore(); text(g, str, xx, yy + 36, { size: 22, a }); };
        dot(x - 160, '读到 100', C.sageDk);
        dot(x + 160, ok ? '写回时还是 100' : '写回时已变', ok ? C.sageDk : C.red);
        if (!ok) {
          const k = range(t, tIn + 0.5, tIn + 0.9);
          arrow(g, x, yy - 62, x, yy - 14, { color: C.blueDk, lw: 4, k, head: 12 });
          text(g, '别人改了它', x, yy - 80, { size: 22, color: C.blueDk, a: k });
        }
        (ok ? check : cross)(g, x + 210, 300, 24, range(t, tEnd, tEnd + 0.4));
      };
      panel(340, '单独运行', tSolo, tOk, true);
      panel(940, '有人同时动手', tCon, tNo, false);
    },
  },
  {
    id: 's-core', act: 4, chapter, lines: ['core'],
    render(g, t, S, TL) {
      const c0 = S.lineTimes.core, tAdd = TL.cue('core', '正确性');
      card(g, W / 2, 300, 900, 220, { s: pop(t, c0, 0.6), fill: C.card, lw: 4 });
      text(g, '局部正确', W / 2 - 230, 300, { size: 76, font: 'title', color: C.sageDk, s: pop(t, c0 + 0.2) });
      text(g, '≠', W / 2, 300, { size: 84, font: 'title', s: pop(t, TL.cue('core', '加在一起')) });
      text(g, '整体正确', W / 2 + 230, 300, { size: 76, font: 'title', color: C.blueDk, s: pop(t, TL.cue('core', '不一定')) });
      text(g, '正确性，不能简单地相加', W / 2, 500, { size: 34, font: 'title', color: C.inkSoft, a: fade(t, tAdd) });
    },
  },
];
