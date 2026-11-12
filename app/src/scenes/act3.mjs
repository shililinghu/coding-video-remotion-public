// 第三幕 · 慢放：钱是怎么丢的
// Timing (hard constraint): 存钱读100 → 取钱读100 → 存钱写150 → 取钱写70 → 最终 70（正确应为 120）
import { C, text, arrow, avatar, rr, chip, tag, shatter, strike, card, W } from '../engine/draw.mjs';
import { pop, fade, range, srange, clamp } from '../engine/ease.mjs';

const chapter = '慢放：钱是怎么丢的';
const Y_DEP = 205, Y_BAL = 345, Y_WD = 485;          // lane centres
const X0 = 230, X1 = 1180;                            // lane span
const COL = { r1: 360, r2: 560, w1: 760, w2: 960 };   // event columns
const TILE_W = 120, TILE_H = 70;

/**
 * Shared lanes layout.  ev = { lanes, r1, r2, w1, w2, note, lost, hint, result } — times (s) when each event fires
 * (undefined = never).  Everything is a pure function of t.
 */
function lanes(g, t, ev) {
  const la = fade(t, ev.lanes ?? -1, 0.5);
  // lane bands
  const band = (y, fill, label, dk) => {
    g.save(); g.globalAlpha *= la; rr(g, X0, y - 50, (X1 - X0) * srange(t, ev.lanes, ev.lanes + 0.6), 100, 14); g.fillStyle = fill; g.fill(); g.restore();
    text(g, label, 120, y + 2, { size: 26, weight: 700, color: dk, a: la });
  };
  band(Y_DEP, 'rgba(159,195,168,0.28)', '存钱线程', C.sageDk);
  band(Y_WD, 'rgba(143,179,217,0.28)', '取钱线程', C.blueDk);
  g.save(); g.globalAlpha *= la; rr(g, X0, Y_BAL - 46, (X1 - X0) * srange(t, ev.lanes, ev.lanes + 0.6), 92, 14);
  g.fillStyle = 'rgba(232,183,122,0.22)'; g.fill(); g.setLineDash([8, 6]); g.strokeStyle = C.apricotDk; g.lineWidth = 2; g.stroke(); g.restore();
  text(g, '共享余额', 120, Y_BAL + 2, { size: 26, weight: 700, color: C.apricotDk, a: la });
  arrow(g, X0, 560, X1, 560, { lw: 3, color: C.inkSoft, head: 12, k: range(t, ev.lanes + 0.2, ev.lanes + 0.9) });
  text(g, '时间 →', X1 - 40, 590, { size: 20, color: C.inkSoft, a: fade(t, ev.lanes + 0.6) });

  // balance tiles: 100 from start, 150 after w1, 70 after w2
  const tile = (x, str, { fill = C.card, color = C.ink, s = 1, a = 1, stroke = C.ink } = {}) => {
    card(g, x, Y_BAL, TILE_W, TILE_H, { fill, s, a, r: 12, lw: 3, stroke });
    text(g, str, x, Y_BAL + 3, { size: 46, font: 'title', color, s, a });
  };
  tile(COL.r1 - 90, '100', { s: pop(t, ev.lanes + 0.3) });

  // ── reads ───────────────────────────────────────────
  const readCard = (x, y, label, str, k, dk, fill) => {
    if (k <= 0) return;
    card(g, x, y, 150, 64, { fill, s: k, r: 10, lw: 2.5 });
    text(g, label + ' = ' + str, x, y + 2, { size: 32, font: 'title', color: C.ink, s: k });
  };
  const kr1 = pop(t, ev.r1 ?? 1e9), kr2 = pop(t, ev.r2 ?? 1e9);
  arrow(g, COL.r1 - 90, Y_BAL - 38, COL.r1, Y_DEP + 28, { color: C.sageDk, lw: 3, dash: [7, 6], k: range(t, ev.r1 ?? 1e9, (ev.r1 ?? 1e9) + 0.35), bend: -0.15 });
  arrow(g, COL.r1 - 90, Y_BAL + 38, COL.r2, Y_WD - 28, { color: C.blueDk, lw: 3, dash: [7, 6], k: range(t, ev.r2 ?? 1e9, (ev.r2 ?? 1e9) + 0.35), bend: 0.12 });
  text(g, '读', COL.r1 - 20, (Y_BAL + Y_DEP) / 2 - 6, { size: 20, color: C.sageDk, a: fade(t, ev.r1 ?? 1e9) });
  text(g, '读', COL.r2 - 110, (Y_BAL + Y_WD) / 2 + 12, { size: 20, color: C.blueDk, a: fade(t, ev.r2 ?? 1e9) });

  // deposit card: x = 100 → x = 150 at w1 (calc)
  const dVal = t >= (ev.w1 ?? 1e9) - 0.6 ? '150' : '100';
  readCard(COL.r1 + (t >= (ev.w1 ?? 1e9) - 0.6 ? 0 : 0), Y_DEP, 'x', dVal, kr1, C.sageDk, '#e6f0e8');
  if (t >= (ev.w1 ?? 1e9) - 0.6) text(g, '100 + 50', COL.r1 + 130, Y_DEP + 2, { size: 22, color: C.sageDk, a: fade(t, ev.w1 - 0.6), align: 'left' });
  // withdraw card: y = 100 → y = 70 at w2 (still computed from the OLD 100)
  const wNew = t >= (ev.w2 ?? 1e9) - 0.6;
  readCard(COL.r2, Y_WD, 'y', wNew ? '70' : '100', kr2, C.blueDk, '#e4ecf6');
  if (wNew) text(g, '旧的 100 − 30', COL.r2 + 130, Y_WD + 2, { size: 22, color: C.blueDk, a: fade(t, ev.w2 - 0.6), align: 'left' });

  // "two copies of the same stale data"
  if (ev.note != null) {
    const a = fade(t, ev.note);
    g.save(); g.globalAlpha *= a; g.setLineDash([6, 6]); g.strokeStyle = C.apricotDk; g.lineWidth = 2.5;
    rr(g, COL.r1 - 85, Y_DEP - 42, 170, 84, 14); g.stroke(); rr(g, COL.r2 - 85, Y_WD - 42, 170, 84, 14); g.stroke();
    g.restore();
    tag(g, '同一份旧数据的两个副本：都是 100', 760, Y_BAL - 2, { a, color: C.apricotDk, size: 22, stroke: C.apricot });
  }

  // ── writes ──────────────────────────────────────────
  const w1 = ev.w1 ?? 1e9, w2 = ev.w2 ?? 1e9;
  arrow(g, COL.w1 - 20, Y_DEP + 30, COL.w1, Y_BAL - 40, { color: C.sageDk, lw: 4, k: range(t, w1 - 0.35, w1) });
  text(g, '写', COL.w1 + 22, (Y_BAL + Y_DEP) / 2, { size: 20, color: C.sageDk, a: fade(t, w1 - 0.3) });
  // 150 tile → shatters when 70 lands
  const kBreak = range(t, w2, w2 + 1.1);
  if (t >= w1 && t < w2) tile(COL.w1, '150', { fill: '#e6f0e8', s: pop(t, w1, 0.45) });
  if (t >= w2) {
    if (kBreak < 1) shatter(g, '150', COL.w1, Y_BAL, TILE_W, TILE_H, kBreak, { size: 46 });
    g.save(); g.globalAlpha *= fade(t, w2 + 0.4, 0.5); g.setLineDash([6, 5]); g.strokeStyle = C.red; g.lineWidth = 2.5;
    rr(g, COL.w1 - TILE_W / 2, Y_BAL - TILE_H / 2, TILE_W, TILE_H, 12); g.stroke(); g.restore();
    text(g, '150 被覆盖', COL.w1, Y_BAL + 2, { size: 22, color: C.red, weight: 700, a: fade(t, w2 + 0.5) });
  }
  // 70 slams down
  arrow(g, COL.w2 - 140, Y_WD - 30, COL.w2 - 10, Y_BAL + 40, { color: C.red, lw: 6, k: range(t, w2 - 0.3, w2), head: 18 });
  text(g, '写', COL.w2 - 40, (Y_BAL + Y_WD) / 2 + 18, { size: 20, color: C.red, a: fade(t, w2 - 0.3) });
  if (t >= w2) {
    const k = range(t, w2, w2 + 0.22), s = 1.8 - 0.8 * k;
    const shake = (1 - range(t, w2 + 0.2, w2 + 0.6)) * Math.sin(t * 90) * 5 * (k >= 1);
    g.save(); g.translate(shake, 0); tile(COL.w2, '70', { fill: '#f7dcd9', color: C.red, s, a: 0.4 + 0.6 * k, stroke: C.red }); g.restore();
  }

  // mother's 50 disappears
  if (ev.lost != null) {
    const k = range(t, ev.lost + 0.3, ev.lost + 1.6);
    chip(g, '妈妈的 +50', COL.w1, 413, { fill: C.sage, size: 22, h: 40, s: pop(t, ev.lost), a: 1 - k * 0.85 });
    strike(g, COL.w1 - 70, 413, COL.w1 + 70, 413, range(t, ev.lost + 0.5, ev.lost + 0.9), C.red, 4);
  }
  if (ev.result != null) {
    const a = fade(t, ev.result);
    tag(g, '最终 ¥70，应为 ¥120', 1060, 277, { a, size: 20, color: C.red, stroke: C.red });
  }
  if (ev.hint != null) tag(g, '换个顺序（先写 70 再写 150），结果会是 150，同样是错的', W / 2, 605, { a: fade(t, ev.hint), size: 20, color: C.inkSoft });
}

export const shots = [
  {
    id: 's-lanes', act: 3, chapter, lines: ['slowmo'],
    render(g, t, S, TL) {
      const s0 = S.lineTimes.slowmo;
      lanes(g, t, { lanes: s0 - 0.2 });
      const k = pop(t, TL.cue('slowmo', '放慢'));
      g.save(); g.translate(1110, 90); g.scale(k, k);
      rr(g, -70, -24, 140, 48, 24); g.fillStyle = C.ink; g.fill(); g.restore();
      text(g, '慢放', 1110, 91, { size: 24, color: C.paper, weight: 700, s: k });
      text(g, '一步一步看', W / 2, 92, { size: 26, color: C.inkSoft, a: fade(t, TL.cue('slowmo', '一步')) });
    },
  },
  {
    id: 's-read', act: 3, chapter, lines: ['read1', 'read2'],
    render(g, t, S, TL) {
      const L = -10;
      const r1 = TL.cue('read1', '100'), r2 = TL.cue('read2', '同样');
      lanes(g, t, { lanes: L, r1, r2, note: r2 + 0.5 });
      text(g, '还没写回去…', COL.r1 + 150, Y_DEP + 2, { size: 22, color: C.inkSoft, a: fade(t, TL.cue('read2', '还没')) * (1 - fade(t, r2 + 0.6)), align: 'left' });
    },
  },
  {
    id: 's-write150', act: 3, chapter, lines: ['calc'],
    render(g, t, S, TL) {
      const w1 = TL.cue('calc', '写回去');
      lanes(g, t, { lanes: -10, r1: -10, r2: -10, w1: Math.max(w1, TL.cue('calc', '150') + 0.6) });
      const tag150 = TL.cue('calc', '余额变成');
      tag(g, '余额 = 150', COL.w1 + 160, Y_BAL, { a: fade(t, tag150) * (1 - fade(t, S.end - 0.4)), color: C.sageDk, size: 22 });
    },
  },
  {
    id: 's-overwrite', act: 3, chapter, lines: ['overwrite', 'lost'],
    render(g, t, S, TL) {
      const w2 = Math.max(TL.cue('overwrite', '也写回去'), TL.cue('overwrite', '70') + 0.6);
      lanes(g, t, { lanes: -10, r1: -10, r2: -10, w1: -10, w2, lost: TL.cue('lost', '妈妈'), result: TL.cue('lost', '消失'), hint: S.speechEnd - 1.6 });
      // highlight the stale copy being used
      const a = fade(t, TL.cue('overwrite', '旧的'), 0.3) * (1 - fade(t, w2 - 0.75, 0.25));
      g.save(); g.globalAlpha *= a; g.strokeStyle = C.apricotDk; g.lineWidth = 4; rr(g, COL.r2 - 85, Y_WD - 42, 170, 84, 14); g.stroke(); g.restore();
      tag(g, '手里还是旧的 100', COL.r2 + 200, Y_WD, { a, color: C.apricotDk, size: 20 });
    },
  },
  {
    id: 's-lost-card', act: 3, chapter, lines: ['name'],
    render(g, t, S, TL) {
      const n0 = S.lineTimes.name, tRule = TL.cue('name', '两个人'), tOld = TL.cue('name', '同一个');
      card(g, W / 2, 210, 560, 170, { s: pop(t, n0 - 0.1, 0.6), fill: C.card, stroke: C.red, lw: 5 });
      text(g, '丢失更新', W / 2, 190, { size: 72, font: 'title', color: C.red, s: pop(t, n0 - 0.1, 0.6) });
      text(g, 'Lost Update', W / 2, 256, { size: 30, color: C.inkSoft, a: fade(t, n0 + 0.4), font: 'mono' });
      [['mom', 400, '存钱：按规矩办事'], ['you', 880, '取钱：按规矩办事']].forEach(([k, x, l], i) => {
        avatar(g, x, 410, k, { s: pop(t, tRule + i * 0.2), r: 40 });
        text(g, l, x, 478, { size: 22, color: k === 'mom' ? C.sageDk : C.blueDk, a: fade(t, tRule + i * 0.2) });
        const kk = pop(t, tOld + i * 0.15);
        card(g, x + 100, 400, 100, 56, { s: kk, fill: '#efe6d4', r: 10, lw: 2 });
        text(g, '100', x + 100, 402, { size: 30, font: 'title', s: kk, color: C.inkSoft });
        tag(g, '过时的', x + 100, 350, { a: fade(t, tOld + 0.3 + i * 0.15), size: 18, color: C.apricotDk, stroke: C.apricot });
      });
      text(g, '看到的是同一个已经过时的世界', W / 2, 560, { size: 30, font: 'title', a: fade(t, tOld + 0.2) });
    },
  },
];
