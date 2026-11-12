// Top bar (chapter + progress) and bottom subtitles.
import { C, FONT, WIDTH as W, HEIGHT as H } from '../config.mjs';
import { clamp, range } from './ease.mjs';

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const SUB_Y = H - 48, SUB_SIZE = 36;

export function drawTopBar(g, TL, t) {
  const s = TL.shotAt(t);
  const actStart = TL.SHOTS.find(x => x.act === s.act).start;
  const a = range(t, actStart, actStart + 0.3);
  g.save();
  g.fillStyle = 'rgba(255,250,240,0.55)'; g.fillRect(0, 0, W, 44);
  g.fillStyle = C.line; g.fillRect(0, 44, W, 1.5);
  g.globalAlpha = a;
  g.font = `700 20px ${FONT.BODY}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.inkSoft;
  g.fillText(`第${CN[s.act]}幕 · ${s.chapter}`, 24, 23);
  g.globalAlpha = 1;
  const bw = 240, bx = W - 24 - bw, by = 19;
  g.fillStyle = 'rgba(43,38,34,0.12)'; g.beginPath(); g.roundRect(bx, by, bw, 6, 3); g.fill();
  g.fillStyle = C.apricotDk; g.beginPath(); g.roundRect(bx, by, Math.max(6, bw * clamp(t / TL.DURATION)), 6, 3); g.fill();
  g.restore();
}

export function subAt(TL, t) { return TL.SUBS.findLast(s => t >= s.a - 0.04 && t < s.b + 0.1) ?? null; }  // newest chunk wins at boundaries

export function drawSubs(g, TL, t) {
  const s = subAt(TL, t);
  if (!s) return;
  const a = clamp(Math.min((t - s.a + 0.04) / 0.12, (s.b + 0.1 - t) / 0.15));
  g.save(); g.globalAlpha = a;
  g.font = `700 ${SUB_SIZE}px ${FONT.BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(s.text).width;
  const k = w > W - 80 ? (W - 80) / w : 1;  // safety: never run off the frame
  g.translate(W / 2, SUB_Y); g.scale(k, k);
  g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = 'rgba(30,24,20,0.92)'; g.strokeText(s.text, 0, 0);
  g.fillStyle = '#ffffff'; g.fillText(s.text, 0, 0);
  g.restore();
}
