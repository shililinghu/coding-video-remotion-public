// 第六幕 · 不只是在一台电脑里
// Idempotency: the server records order id + result and replays the stored result for a repeated id.
// (Check-and-record must itself be concurrency-safe; we mention it in a footnote, not as "absolutely safe".)
import { C, text, card, check, cross, phone, server, arrow, rr, tag, stamp, measure, W } from '../engine/draw.mjs';
import { pop, fade, range, srange, lerp, inOutCubic, clamp } from '../engine/ease.mjs';

const chapter = '不只是在一台电脑里';
const PX = 230, SX = 1050, Y_REQ = 250, Y_RES = 380, PIT_X = 640;

function envelope(g, x, y, label, { a = 1, color = C.blue, tagStr = null, s = 1 } = {}) {
  if (a <= 0) return;
  card(g, x, y, 110, 64, { fill: color, r: 8, lw: 2.5, a, s });
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 50 * s, y - 28 * s); g.lineTo(x, y + 2 * s); g.lineTo(x + 50 * s, y - 28 * s); g.stroke(); g.restore();
  text(g, label, x, y + 16 * s, { size: 18, weight: 700, a, s });
  if (tagStr) tag(g, tagStr, x, y - 52 * s, { a, size: 18, color: C.ink, fill: C.apricot, stroke: C.apricotDk });
}

function stage(g, t, a0, { pit = 1, phoneScreen = null, blink = 0 } = {}) {
  phone(g, PX, 315, { s: pop(t, a0), screen: phoneScreen });
  text(g, '手机', PX, 450, { size: 22, color: C.inkSoft, a: fade(t, a0) });
  server(g, SX, 290, { s: 0.8 * pop(t, a0 + 0.15), blink });
  text(g, '服务器', SX, 400, { size: 22, color: C.inkSoft, a: fade(t, a0 + 0.15) });
  const la = fade(t, a0 + 0.3);
  g.save(); g.globalAlpha *= la; g.setLineDash([3, 9]); g.lineCap = 'round'; g.strokeStyle = C.inkSoft; g.lineWidth = 3;
  g.beginPath(); g.moveTo(PX + 80, Y_REQ); g.lineTo(SX - 90, Y_REQ); g.moveTo(SX - 90, Y_RES); g.lineTo(PIT_X + 70, Y_RES); g.moveTo(PIT_X - 70, Y_RES); g.lineTo(PX + 80, Y_RES); g.stroke();
  g.restore();
  text(g, '请求 →', 640, Y_REQ - 52, { size: 20, color: C.inkSoft, a: la });
  text(g, '← 响应', 400, Y_RES + 40, { size: 20, color: C.inkSoft, a: la });
  // the pit in the middle of the response path
  if (pit > 0) {
    g.save(); g.globalAlpha *= la * pit; g.fillStyle = '#2b2622'; g.beginPath(); g.ellipse(PIT_X, Y_RES + 6, 70, 18, 0, 0, Math.PI * 2); g.fill(); g.restore();
    text(g, '网络丢包', PIT_X, Y_RES + 46, { size: 18, color: C.inkSoft, a: la * pit });
  }
}

const spinner = (t) => (g) => {
  g.strokeStyle = C.inkSoft; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.arc(0, -10, 22, t * 6, t * 6 + 4.2); g.stroke();
  g.fillStyle = C.inkSoft; g.font = '400 16px "Microsoft YaHei"'; g.textAlign = 'center'; g.fillText('等待中…', 0, 40);
};
const payScreen = (g) => {
  g.fillStyle = C.blue; g.beginPath(); g.roundRect(-38, -20, 76, 40, 10); g.fill();
  g.fillStyle = C.ink; g.font = '700 18px "Microsoft YaHei"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('支付 ¥30', 0, 0);
};
const failScreen = (g) => {
  g.fillStyle = C.inkSoft; g.font = '700 18px "Microsoft YaHei"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('超时', 0, -16); g.font = '400 16px "Microsoft YaHei"'; g.fillText('自动重试…', 0, 14);
};

/** ledger card under the server */
function ledger(g, t, rows, { a = 1, title = '扣款记录' } = {}) {
  if (a <= 0) return;
  const x = SX, y = 500, h = 48 + rows.length * 34;
  card(g, x, y + h / 2 - 28, 240, h, { a, fill: C.card });
  text(g, title, x, y - 6, { size: 20, weight: 700, a });
  rows.forEach(([str, color, tIn], i) => text(g, str, x, y + 26 + i * 34, { size: 24, font: 'title', color, a: a * fade(t, tIn, 0.3) }));
}

export const shots = [
  {
    id: 's-network', act: 6, chapter, lines: ['distributed'],
    render(g, t, S, TL) {
      const cue = (k) => TL.cue('distributed', k), d0 = S.lineTimes.distributed;
      const tPay = cue('你点了支付'), tSent = cue('请求发出去了'), tOk = cue('扣款也成功了'), tLost = cue('但回来的');
      stage(g, t, d0 - 0.2, { phoneScreen: t < tLost + 0.6 ? payScreen : spinner(t), blink: t > tOk ? 1 : 0 });
      // request travels
      const kq = inOutCubic(range(t, tSent - 0.2, tOk - 0.2));
      envelope(g, lerp(PX + 110, SX - 120, kq), Y_REQ, '支付 ¥30', { a: fade(t, tPay) * (1 - range(t, tOk - 0.25, tOk)) });
      // response travels and falls into the pit
      const kr = inOutCubic(range(t, tLost - 0.4, tLost + 0.5));
      const fall = range(t, tLost + 0.45, tLost + 1.0);
      envelope(g, lerp(SX - 120, PIT_X, kr), Y_RES + fall * 40, '扣款成功', { a: fade(t, tOk + 0.2) * (1 - fall), color: '#d7ecdc', s: 1 - fall * 0.6 });
      if (fall >= 1) text(g, '响应丢了', PIT_X, Y_RES - 36, { size: 24, weight: 700, color: C.red, a: fade(t, tLost + 1.0) });
      ledger(g, t, [['−¥30', C.ink, tOk]], { a: fade(t, tOk - 0.1) });
    },
  },
  {
    id: 's-retry', act: 6, chapter, lines: ['retry'],
    render(g, t, S, TL) {
      const cue = (k) => TL.cue('retry', k), r0 = S.lineTimes.retry;
      const tFail = cue('以为失败'), tRetry = cue('自动重试'), tTwice = cue('又扣了一次'), tPhoneOk = cue('手机没错'), tSrvOk = cue('服务器也没错'), tRes = cue('结果');
      stage(g, t, -10, { phoneScreen: t < tFail ? spinner(t) : failScreen, blink: t > tTwice ? 1 : 0, pit: 1 });
      const kq = inOutCubic(range(t, tRetry, tTwice - 0.1));
      envelope(g, lerp(PX + 110, SX - 120, kq), Y_REQ, '支付 ¥30', { a: fade(t, tRetry) * (1 - range(t, tTwice - 0.15, tTwice + 0.1)), tagStr: '重试' });
      const dbl = t >= tRes;
      ledger(g, t, [['−¥30', dbl ? C.red : C.ink, -10], ['−¥30', C.red, tTwice]]);
      if (dbl) stamp(g, '扣了两次', SX - 250, 540, t, tRes + 0.1, { size: 30 });
      check(g, PX + 80, 200, 18, range(t, tPhoneOk, tPhoneOk + 0.4));
      text(g, '重试是对的', PX, 160, { size: 20, color: C.green, a: fade(t, tPhoneOk) });
      check(g, SX + 90, 180, 18, range(t, tSrvOk, tSrvOk + 0.4));
      text(g, '收到请求就扣款', SX, 140, { size: 20, color: C.green, a: fade(t, tSrvOk) });
    },
  },
  {
    id: 's-idempotent', act: 6, chapter, lines: ['idempotent'],
    render(g, t, S, TL) {
      const cue = (k) => TL.cue('idempotent', k), i0 = S.lineTimes.idempotent;
      const tId = cue('唯一编号'), tSee = cue('服务器看到'), tDone = cue('这笔我已经'), tReturn = cue('直接返回'), tName = cue('这叫幂等');
      stage(g, t, -10, { phoneScreen: t < tReturn + 0.8 ? failScreen : payScreen, pit: 1 - fade(t, i0, 0.6) });
      // table of processed ids
      const ta = fade(t, i0 + 0.2);
      card(g, SX, 530, 300, 96, { a: ta });
      text(g, '已处理的订单', SX, 500, { size: 20, weight: 700, a: ta });
      text(g, '#A1024 → 已扣 ¥30', SX, 542, { size: 22, font: 'mono', a: ta });
      // retry request carrying the id
      const kq = inOutCubic(range(t, tId + 0.2, tSee + 0.1));
      envelope(g, lerp(PX + 110, SX - 120, kq), Y_REQ, '支付 ¥30', { a: fade(t, tId - 0.2) * (1 - range(t, tSee + 0.1, tSee + 0.3)), tagStr: '订单号 #A1024' });
      const hit = fade(t, tDone - 0.2);
      if (hit > 0) { g.save(); g.globalAlpha *= hit; g.fillStyle = 'rgba(58,154,91,0.18)'; rr(g, SX - 140, 524, 280, 36, 8); g.fill(); g.restore(); }
      text(g, '同一个编号：这笔已处理过 → 不再扣款', 640, 500, { size: 20, color: C.green, a: fade(t, tDone) });
      // stored result goes back
      const kr = inOutCubic(range(t, tReturn, tReturn + 0.8));
      envelope(g, lerp(SX - 120, PX + 110, kr), Y_RES, '上次的结果', { a: fade(t, tReturn) * (1 - range(t, tReturn + 0.8, tReturn + 1.0)), color: '#d7ecdc' });
      check(g, PX + 80, 200, 18, range(t, tReturn + 0.9, tReturn + 1.3));
      text(g, '只扣了一次', PX, 160, { size: 22, color: C.green, weight: 700, a: fade(t, tReturn + 0.9) });
      tag(g, '幂等：同一个请求做一次和做多次，结果一样', 640, 110, { a: fade(t, tName), size: 22, color: C.ink });
      text(g, '注：“查编号 + 记录”本身也要防并发（比如用唯一约束兜底）', 640, 600, { size: 16, color: C.inkSoft, a: fade(t, tName + 0.3) });
    },
  },
];
