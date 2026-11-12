// 第五幕 · 怎么修
// Hard constraints: single-statement UPDATE takes a row write lock (no lost update) but does NOT solve every concurrency
// problem — SELECT-then-UPDATE-fixed-value still loses updates.  CAS = compare + write as ONE atomic step; on failure
// the CALLER re-reads and retries (no automatic merge).
import { C, text, card, check, cross, chip, lock, key, avatar, arrow, rr, tag, measure, W } from '../engine/draw.mjs';
import { pop, fade, range, srange, lerp, inOutCubic, clamp, roll } from '../engine/ease.mjs';
import { stepBar } from './act2.mjs';

const chapter = '怎么修';

/** small balance cell */
function cell(g, x, y, value, { s = 1, color = C.ink, fill = C.card, stroke = C.ink, label = '余额' } = {}) {
  card(g, x, y, 170, 100, { s, fill, stroke, lw: 3.5, r: 14 });
  text(g, label, x, y - 30, { size: 18, color: C.inkSoft, s });
  text(g, '¥' + value, x, y + 12, { size: 48, font: 'title', color, s });
}

export const shots = [
  {
    id: 's-fix-intro', act: 5, chapter, lines: ['fix-intro'],
    render(g, t, S, TL) {
      const f0 = S.lineTimes['fix-intro'], tIdea = TL.cue('fix-intro', '别让'), tThree = TL.cue('fix-intro', '具体有');
      // read [gap] write, with a "no entry" bar in the gap
      const a = fade(t, f0);
      chip(g, '读', 470, 170, { fill: C.sage, a, size: 28, padX: 26 });
      chip(g, '写', 810, 170, { fill: C.sage, a, size: 28, padX: 26 });
      g.save(); g.globalAlpha *= a; g.setLineDash([8, 6]); g.strokeStyle = C.apricotDk; g.lineWidth = 3; rr(g, 530, 140, 220, 60, 12); g.stroke(); g.restore();
      const kb = pop(t, tIdea);
      chip(g, '取钱', 640, 90 + 30 * (1 - kb), { fill: C.blue, size: 22, h: 38, a: fade(t, tIdea - 0.3) });
      g.save(); g.translate(640, 170); g.scale(kb, kb); g.strokeStyle = C.apricotDk; g.lineWidth = 6;
      g.beginPath(); g.arc(0, 0, 24, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-16, 16); g.lineTo(16, -16); g.stroke(); g.restore();
      text(g, '别让缝隙里挤进别人', 640, 245, { size: 30, font: 'title', a: fade(t, tIdea + 0.3) });
      const cards = [['加锁', '排队，一个一个来'], ['原子操作', '读算写合成一步'], ['CAS', '写之前先核对']];
      cards.forEach(([h, d], i) => {
        const x = 300 + i * 340, s = pop(t, tThree + 0.25 + i * 0.3);
        card(g, x, 430, 290, 170, { s });
        text(g, `${i + 1}`, x - 112, 380, { size: 26, font: 'title', color: C.apricotDk, s });
        text(g, h, x, 415, { size: 40, font: 'title', s });
        text(g, d, x, 470, { size: 22, color: C.inkSoft, s });
      });
    },
  },
  {
    id: 's-lock', act: 5, chapter, lines: ['lock'],
    render(g, t, S, TL) {
      const l0 = S.lineTimes.lock, tKey = TL.cue('lock', '先拿到钥匙'), tDone = TL.cue('lock', '改完'), tGive = TL.cue('lock', '交出来'), tQ = TL.cue('lock', '排队');
      text(g, '第一种：加锁', 640, 90, { size: 32, font: 'title', a: fade(t, l0) });
      const tYouDone = tGive + 0.9;
      const v = t < tDone - 0.3 ? 100 : t < tYouDone ? roll(t, tDone - 0.3, 100, 150) : roll(t, tYouDone, 150, 120);
      cell(g, 640, 300, v, { s: pop(t, l0), color: t >= tYouDone + 0.4 ? C.green : C.ink });
      const holder = t < tKey ? 0 : t < tGive ? 1 : 2;
      lock(g, 640, 205, { s: pop(t, l0 + 0.2), open: holder === 0 ? 0 : 0.6 });
      avatar(g, 330, 300, 'mom', { s: pop(t, l0 + 0.3), label: '存钱' });
      avatar(g, 950, 300, 'you', { s: pop(t, l0 + 0.45), label: '取钱' });
      // key path: lock → mom → you
      const km = inOutCubic(range(t, tKey, tKey + 0.7)), ky = inOutCubic(range(t, tGive, tGive + 0.9));
      let kx = lerp(700, 330, km), kyy = lerp(195, 220, km);
      kx = lerp(kx, 950, ky); kyy = lerp(kyy, 220, ky) - Math.sin(ky * Math.PI) * 60;
      key(g, kx, kyy, { s: pop(t, l0 + 0.4), rot: -0.3 });
      // who's working / waiting
      const momWork = t >= tKey + 0.6 && t < tGive;
      tag(g, momWork ? '正在改余额' : t >= tGive ? '改完，交出钥匙' : '先拿钥匙', 330, 420, { a: fade(t, tKey), color: C.sageDk, size: 20 });
      tag(g, holder < 2 ? '排队等着…' : '轮到我了', 950, 420, { a: fade(t, tKey + 0.3), color: C.blueDk, size: 20 });
      // sequential timeline
      const ta = tGive + 0.2, tb = tYouDone - 0.2, ab = fade(t, ta);
      text(g, '先后执行', 150, 530, { size: 22, color: C.inkSoft, a: ab });
      stepBar(g, 230, 530, 330, C.sage, ['读', '算', '写'], { a: ab });
      stepBar(g, 590, 530, 330, C.blue, ['读', '算', '写'], { a: fade(t, tb) });
      text(g, '= 120', 1000, 532, { size: 34, font: 'title', color: C.green, a: fade(t, tYouDone + 0.3) });
      check(g, 1090, 530, 20, range(t, tYouDone + 0.4, tYouDone + 0.8));
    },
  },
  {
    id: 's-atomic', act: 5, chapter, lines: ['atomic'],
    render(g, t, S, TL) {
      const a0 = S.lineTimes.atomic, tMerge = TL.cue('atomic', '合成一步'), tIn = TL.cue('atomic', '插不进来');
      const tSql = TL.cue('atomic', '比如'), tExpr = TL.cue('atomic', '余额等于'), tDb = TL.cue('atomic', '由数据库');
      text(g, '第二种：原子操作', 640, 90, { size: 32, font: 'title', a: fade(t, a0) });
      const k = srange(t, tMerge - 0.2, tMerge + 0.5);
      const labels = ['读', '算', '写'], bw = lerp(130, 100, k), gap = lerp(60, 0, k);
      const total = 3 * bw + 2 * gap, x0 = 640 - total / 2;
      labels.forEach((l, i) => {
        const x = x0 + i * (bw + gap) + bw / 2;
        card(g, x, 200, bw - 4, 64, { fill: C.sage, r: 10, lw: 2.5, s: pop(t, a0 + 0.2 + i * 0.15), shadow: k < 0.5 });
        text(g, l, x, 202, { size: 26, s: pop(t, a0 + 0.2 + i * 0.15) });
      });
      if (k > 0) { g.save(); g.globalAlpha *= k; g.strokeStyle = C.ink; g.lineWidth = 5; rr(g, 640 - total / 2 - 10, 160, total + 20, 80, 14); g.stroke(); g.restore();
        tag(g, '一步完成', 640 + total / 2 + 80, 200, { a: k, size: 20, color: C.ink }); }
      // an intruder bounces off
      const ki = range(t, tIn - 0.4, tIn + 0.6);
      if (ki > 0 && ki < 1) {
        const dx = ki < 0.5 ? lerp(360, 30, ki * 2) : lerp(30, 160, (ki - 0.5) * 2);
        chip(g, '取钱', 640 + total / 2 + dx, 200, { fill: C.blue, size: 20, h: 36, a: 1 - range(t, tIn + 0.3, tIn + 0.6) });
      }
      cross(g, 640 + total / 2 + 30, 150, 14, range(t, tIn, tIn + 0.3) * (1 - range(t, tIn + 0.8, tIn + 1.1)));
      // SQL
      const sql = 'UPDATE account SET balance = balance + 50 WHERE id = 1;';
      const ks = pop(t, tSql);
      card(g, 640, 340, 860, 76, { fill: '#2f2b28', stroke: null, r: 12, s: ks });
      g.save(); g.font = '400 24px Consolas, monospace';
      const sw = g.measureText(sql).width, pre = g.measureText('UPDATE account SET ').width, hw = g.measureText('balance = balance + 50').width;
      g.restore();
      const he = fade(t, tExpr);
      if (he > 0 && ks > 0.9) { g.save(); g.globalAlpha *= he; g.fillStyle = 'rgba(232,183,122,0.35)'; rr(g, 640 - sw / 2 + pre - 6, 322, hw + 12, 38, 6); g.fill(); g.restore(); }
      text(g, sql, 640 - sw / 2, 342, { size: 24, font: 'mono', color: '#fffaf0', align: 'left', a: ks > 0.9 ? 1 : 0 });
      text(g, '余额 = 余额 + 50，由数据库一次做完', 640, 400, { size: 20, color: C.inkSoft, a: fade(t, tExpr + 0.4) });
      // footnotes (technical accuracy)
      const n1 = fade(t, tDb), n2 = fade(t, tDb + 0.9);
      check(g, 250, 470, 13, range(t, tDb, tDb + 0.4));
      text(g, '单条语句：数据库会给这一行加写锁，并发执行也不会丢失更新', 274, 470, { size: 20, align: 'left', a: n1 });
      cross(g, 250, 510, 13, range(t, tDb + 0.9, tDb + 1.3));
      text(g, '但先 SELECT 读到程序里、再 UPDATE 写回固定值，照样会丢失更新', 274, 510, { size: 20, align: 'left', a: n2 });
      text(g, '数据库保证的是这一条语句，不是所有并发问题', 640, 560, { size: 20, color: C.inkSoft, a: fade(t, tDb + 1.6) });
    },
  },
  {
    id: 's-cas', act: 5, chapter, lines: ['cas'],
    render(g, t, S, TL) {
      const c0 = S.lineTimes.cas, cue = (k) => TL.cue('cas', k);
      const tPrep = cue('写回去的时候'), tCheck = cue('余额还是不是'), tRej = cue('如果已经被'), tReread = cue('重新读'), tRecalc = cue('再算一次');
      const tOk = Math.max(tRecalc + 0.8, cue('这叫') - 0.2), tName = cue('比较并交换');
      text(g, '第三种：CAS（乐观）', 640, 90, { size: 32, font: 'title', a: fade(t, c0) });
      tag(g, 'CAS = Compare-And-Swap 比较并交换', 1040, 90, { a: fade(t, tName), size: 20, color: C.ink });
      // thread card
      avatar(g, 170, 210, 'you', { r: 38, s: pop(t, c0 + 0.1), label: '取钱线程' });
      const reread = t >= tReread, recalc = t >= tRecalc;
      card(g, 170, 370, 230, 120, { s: pop(t, c0 + 0.3), fill: '#e4ecf6' });
      text(g, '预期：' + (reread ? '150' : '100'), 170, 345, { size: 28, font: 'title', s: pop(t, c0 + 0.3) });
      text(g, '新值：' + (recalc ? '120' : '70'), 170, 395, { size: 28, font: 'title', s: pop(t, c0 + 0.3), color: recalc ? C.ink : C.blueDk });
      // balance cell (already changed by the deposit to 150)
      const okDone = t >= tOk + 0.3;
      cell(g, 1110, 330, okDone ? 120 : 150, { s: pop(t, c0 + 0.2), color: okDone ? C.green : C.ink, stroke: okDone ? C.green : C.ink });
      text(g, '已被存钱改成 150', 1110, 410, { size: 18, color: C.sageDk, a: fade(t, c0 + 0.4) * (1 - fade(t, tOk)) });
      // comparator — one atomic step
      const kc = pop(t, tPrep);
      card(g, 640, 330, 440, 170, { s: kc, fill: C.card, lw: 3 });
      text(g, '比较 + 写入（一步原子操作）', 640, 268, { size: 20, color: C.inkSoft, s: kc });
      const second = t >= tOk - 0.4;
      const exp = second ? '150' : '100';
      text(g, `当前 150 = 预期 ${exp} ?`, 640, 325, { size: 30, font: 'title', a: fade(t, tCheck) });
      if (!second && t >= tRej) { cross(g, 560, 385, 16, range(t, tRej, tRej + 0.3)); text(g, '不相等 → 拒绝写入', 660, 385, { size: 22, color: C.red, a: fade(t, tRej) }); }
      if (second) { check(g, 560, 385, 16, range(t, tOk - 0.4, tOk)); text(g, '相等 → 写入 120', 660, 385, { size: 22, color: C.green, a: fade(t, tOk - 0.4) }); }
      arrow(g, 290, 340, 410, 330, { lw: 4, color: C.blueDk, k: range(t, tPrep, tPrep + 0.4), head: 12 });
      arrow(g, 870, 330, 1015, 330, { lw: 4, color: second ? C.green : C.inkSoft, k: second ? range(t, tOk - 0.3, tOk) : 0, head: 12 });
      // re-read arrow (cell → thread card), under the comparator
      arrow(g, 1110, 390, 290, 410, { lw: 3, color: C.blueDk, dash: [8, 6], k: range(t, tReread, tReread + 0.6), a: 1 - fade(t, tOk), bend: -0.12, head: 12 });
      // step chips
      const steps = [['准备写 70', tPrep, C.blue], ['当前是 150，不是 100', tCheck + 0.2, C.card], ['拒绝', tRej, '#f7dcd9'], ['重新读到 150', tReread, C.blue], ['算出 120', tRecalc, C.blue], ['写入成功', tOk, '#d7ecdc']];
      const sz = 20, ws = steps.map(([s]) => measure(g, s, sz) + 28), tot = ws.reduce((a, b) => a + b, 0) + (steps.length - 1) * 34;
      let x = 640 - tot / 2;
      steps.forEach(([s, ts, fill], i) => {
        const cx = x + ws[i] / 2;
        if (i) arrow(g, x - 30, 560, x - 6, 560, { lw: 2.5, head: 8, color: C.inkSoft, k: range(t, ts - 0.1, ts + 0.1) });
        chip(g, s, cx, 560, { fill, size: sz, h: 38, padX: 14, font: 'body', s: pop(t, ts, 0.4), color: s === '拒绝' ? C.red : s === '写入成功' ? C.green : C.ink });
        x += ws[i] + 34;
      });
      text(g, '比较和写入是一步原子操作；失败不会自动合并，由调用方重新读、重新算、再试一次', 640, 612, { size: 18, color: C.inkSoft, a: fade(t, tRej + 0.3) });
    },
  },
  {
    id: 's-tradeoff', act: 5, chapter, lines: ['tradeoff'],
    render(g, t, S, TL) {
      const cue = (k) => TL.cue('tradeoff', k), t0 = S.lineTimes.tradeoff;
      const tL = cue('加锁'), tLc = cue('但要排队'), tR = cue('CAS'), tRc = cue('但冲突'), tEnd = cue('没有万能');
      const ang = 0.08 * Math.sin((t - t0) * 2.2) * (1 - range(t, tEnd - 0.5, tEnd + 0.8));
      const a = fade(t, t0 - 0.2);
      // fulcrum
      g.save(); g.globalAlpha *= a; g.fillStyle = C.apricot; g.strokeStyle = C.ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(640, 180); g.lineTo(590, 470); g.lineTo(690, 470); g.closePath(); g.fill(); g.stroke();
      g.translate(640, 180); g.rotate(ang); g.fillStyle = C.ink; rr(g, -350, -6, 700, 12, 6); g.fill(); g.restore();
      const end = (side) => [640 + side * 330 * Math.cos(ang), 180 + side * 330 * Math.sin(ang)];
      const pan = (side, title, pro, con, tP, tC) => {
        const [x, y] = end(side), cy = y + 150;
        g.save(); g.globalAlpha *= a; g.strokeStyle = C.inkSoft; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 100, cy - 75); g.moveTo(x, y); g.lineTo(x + 100, cy - 75); g.stroke(); g.restore();
        const s = pop(t, tP - 0.1);
        card(g, x, cy, 300, 150, { s });
        text(g, title, x, cy - 42, { size: 34, font: 'title', s });
        check(g, x - 100, cy + 6, 12, range(t, tP + 0.3, tP + 0.6));
        text(g, pro, x - 80, cy + 8, { size: 22, align: 'left', a: fade(t, tP + 0.3) });
        text(g, '−', x - 100, cy + 46, { size: 30, color: C.apricotDk, weight: 700, a: fade(t, tC) });
        text(g, con, x - 80, cy + 46, { size: 22, align: 'left', color: C.inkSoft, a: fade(t, tC) });
      };
      pan(-1, '加锁', '简单', '要排队', tL, tLc);
      pan(1, 'CAS', '不用等', '冲突多了反复重试', tR, tRc);
      text(g, '没有万能方案，只有适合场景的选择', 640, 570, { size: 32, font: 'title', a: fade(t, tEnd) });
    },
  },
];
