// 第七幕 · 收尾
import { C, text, card, check, rr, paper, W, H } from '../engine/draw.mjs';
import { pop, fade, range, srange } from '../engine/ease.mjs';
import { accountScene } from './act1.mjs';

const chapter = '收尾';

// thumbnails of earlier shots (each rendered once near the end of its shot, then cached)
const THUMBS = [['s-twist', '余额变成 70'], ['s-overwrite', '150 被覆盖'], ['s-gap', '读和写之间的缝隙'], ['s-retry', '扣了两次']];
const TW = 256, TH = 144, TY = 230;
const thumbCache = new Map();
function thumb(id, TL) {
  if (thumbCache.has(id)) return thumbCache.get(id);
  const shot = TL.SHOTS.find(s => s.id === id);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  paper(g); shot.render(g, shot.end - 0.5, shot, TL);
  const s = document.createElement('canvas'); s.width = TW * 2; s.height = TH * 2;
  s.getContext('2d').drawImage(c, 0, 0, TW * 2, TH * 2);
  thumbCache.set(id, s);
  return s;
}
const thumbX = (i) => 640 + (i - 1.5) * (TW + 44);

export const shots = [
  {
    id: 's-recap', act: 7, chapter, lines: ['recap', 'ending'],
    render(g, t, S, TL) {
      const r0 = S.lineTimes.recap, tAll = TL.cue('recap', '都做对了'), tFind = TL.cue('recap', '别急着');
      const e0 = S.lineTimes.ending, tGap = TL.cue('ending', '缝隙'), tQ1 = TL.cue('ending', '谁和谁'), tQ2 = TL.cue('ending', '谁拿着');
      text(g, '都做对了，结果却错了', 640, 105, { size: 34, font: 'title', a: fade(t, r0) * (1 - fade(t, e0 - 0.35, 0.3)) });
      text(g, '去看他们之间的缝隙', 640, 105, { size: 34, font: 'title', color: C.apricotDk, a: fade(t, e0) });
      THUMBS.forEach(([id, label], i) => {
        const x = thumbX(i), s = pop(t, r0 + 0.1 + i * 0.18);
        if (s <= 0) return;
        g.save(); g.translate(x, TY); g.scale(s, s);
        g.fillStyle = 'rgba(60,40,20,0.18)'; rr(g, -TW / 2 + 4, -TH / 2 + 6, TW, TH, 10); g.fill();
        g.save(); rr(g, -TW / 2, -TH / 2, TW, TH, 10); g.clip(); g.drawImage(thumb(id, TL), -TW / 2, -TH / 2, TW, TH); g.restore();
        g.strokeStyle = C.ink; g.lineWidth = 3; rr(g, -TW / 2, -TH / 2, TW, TH, 10); g.stroke();
        g.restore();
        text(g, label, x, TY + TH / 2 + 26, { size: 20, color: C.inkSoft, a: fade(t, r0 + 0.3 + i * 0.18) });
      });
      // "everyone did it right"
      text(g, '每一段代码单独看都没错', 640, 410, { size: 24, color: C.green, a: fade(t, tAll) * (1 - fade(t, tGap - 0.3)) });
      // don't hunt for the culprit
      const kf = fade(t, tFind) * (1 - fade(t, e0));
      text(g, '先别急着找「谁写错了」', 640, 470, { size: 26, color: C.inkSoft, a: kf });
      // gaps glow
      const kg = srange(t, tGap - 0.2, tGap + 0.4);
      for (let i = 0; i < 3; i++) {
        const x = (thumbX(i) + thumbX(i + 1)) / 2, pulse = 0.7 + 0.3 * Math.sin((t - tGap) * 5 + i);
        g.save(); g.globalAlpha *= kg * pulse; g.fillStyle = C.apricot; g.shadowColor = C.apricot; g.shadowBlur = 24;
        rr(g, x - 7, TY - TH / 2 - 10, 14, TH + 20, 7); g.fill(); g.restore();
      }
      const q = (str, y, tq) => {
        const s = pop(t, tq);
        card(g, 640, y, 640, 64, { s, fill: C.card, stroke: C.apricotDk, lw: 3 });
        text(g, str, 640, y + 2, { size: 28, s });
      };
      q('谁和谁，同时动了同一份数据？', 450, tQ1);
      q('谁拿着的，是过时的信息？', 540, tQ2);
    },
  },
  {
    id: 's-final', act: 7, chapter, lines: ['final'],
    render(g, t, S, TL) {
      const f0 = S.lineTimes.final, tSum = TL.cue('final', '而是'), tEndCard = S.speechEnd + 0.4;
      const ka = 1 - fade(t, tEndCard - 0.1, 0.5);
      if (ka > 0) {
        g.save(); g.globalAlpha *= ka;
        accountScene(g, t, { t0: f0 - 0.3, tMom: f0 - 0.3, tYou: f0 - 0.3, tBoth: f0 - 0.3, value: 120, color: C.green });
        check(g, 640 + 175, 270, 26, range(t, f0 + 0.3, f0 + 0.8));
        text(g, '零件正确 + 配合正确 = 系统正确', 640, 540, { size: 34, font: 'title', a: fade(t, tSum) });
        g.restore();
      }
      // end card
      const ke = fade(t, tEndCard, 0.6);
      if (ke > 0) {
        text(g, '为什么所有人都做对了，', 640, 280, { size: 52, font: 'title', a: ke });
        text(g, '最后结果却可能是错的？', 640, 352, { size: 52, font: 'title', a: ke });
        text(g, '答案在缝隙里', 640, 450, { size: 30, color: C.apricotDk, a: fade(t, tEndCard + 0.4) });
        text(g, '谢谢观看', 640, 530, { size: 24, color: C.inkSoft, a: fade(t, tEndCard + 0.8) });
      }
    },
  },
];
