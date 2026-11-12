// Canvas2D drawing primitives.  Everything takes the 2D context explicitly; nothing touches the DOM at import
// time so scene modules can be imported from Node (timeline tests, render script).
import { C, FONT, WIDTH as W, HEIGHT as H } from '../config.mjs';
import { clamp, hash, outBack, range } from './ease.mjs';

// ── paper ──────────────────────────────────────────────────────────────
let paperCache = null;
function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
export function paper(g) {
  if (!paperCache) {
    const c = makeCanvas(W, H), p = c.getContext('2d');
    p.fillStyle = C.paper; p.fillRect(0, 0, W, H);
    // fixed-seed grain
    for (let i = 0; i < 9000; i++) {
      const x = hash(i) * W, y = hash(i + 9001) * H, a = 0.025 + hash(i + 18002) * 0.05;
      p.fillStyle = hash(i + 27003) > 0.5 ? `rgba(90,70,40,${a})` : `rgba(255,255,255,${a * 1.4})`;
      p.fillRect(x, y, 1 + hash(i + 3) * 1.6, 1 + hash(i + 7) * 1.6);
    }
    // faint fibres
    p.strokeStyle = 'rgba(120,95,60,0.05)'; p.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = hash(i + 500) * W, y = hash(i + 600) * H, a = hash(i + 700) * Math.PI;
      p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40); p.stroke();
    }
    // vignette
    const v = p.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, 'rgba(60,40,20,0)'); v.addColorStop(1, 'rgba(60,40,20,0.22)');
    p.fillStyle = v; p.fillRect(0, 0, W, H);
    paperCache = c;
  }
  g.drawImage(paperCache, 0, 0);
}

// ── basic shapes ───────────────────────────────────────────────────────
export function rr(g, x, y, w, h, r = 12) { g.beginPath(); g.roundRect(x, y, w, h, r); }

/** card centred at (cx, cy); s = scale (pop), a = alpha */
export function card(g, cx, cy, w, h, { fill = C.card, stroke = C.ink, lw = 3, r = 16, s = 1, a = 1, shadow = true, dash = null } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(cx, cy); g.scale(s, s);
  if (shadow) { g.fillStyle = 'rgba(60,40,20,0.16)'; rr(g, -w / 2 + 5, -h / 2 + 7, w, h, r); g.fill(); }
  rr(g, -w / 2, -h / 2, w, h, r); g.fillStyle = fill; g.fill();
  if (stroke) { if (dash) g.setLineDash(dash); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  g.restore();
}

/** text; font = 'title' | 'body' | 'mono' */
export function text(g, str, x, y, { size = 28, color = C.ink, font = 'body', weight = 400, align = 'center', base = 'middle', a = 1, s = 1, stroke = null, sw = 0, maxW = 0 } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  const fam = font === 'title' ? FONT.TITLE : font === 'mono' ? FONT.MONO : FONT.BODY;
  g.font = `${weight} ${size}px ${fam}`; g.textAlign = align; g.textBaseline = base;
  if (maxW) { const w = g.measureText(str).width; if (w > maxW) g.scale(maxW / w, maxW / w); }
  if (stroke) { g.lineJoin = 'round'; g.strokeStyle = stroke; g.lineWidth = sw; g.strokeText(str, 0, 0); }
  g.fillStyle = color; g.fillText(str, 0, 0);
  g.restore();
}
export function measure(g, str, size, font = 'body', weight = 400) {
  const fam = font === 'title' ? FONT.TITLE : font === 'mono' ? FONT.MONO : FONT.BODY;
  g.save(); g.font = `${weight} ${size}px ${fam}`; const w = g.measureText(str).width; g.restore(); return w;
}

/** arrow from (x1,y1) to (x2,y2), drawn to fraction k */
export function arrow(g, x1, y1, x2, y2, { color = C.ink, lw = 4, k = 1, head = 14, a = 1, dash = null, bend = 0 } = {}) {
  if (k <= 0 || a <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const pt = (u) => [(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2];
  k = clamp(k);
  g.beginPath(); g.moveTo(x1, y1);
  for (let i = 1; i <= 24; i++) { const [x, y] = pt((i / 24) * k); g.lineTo(x, y); }
  g.stroke(); g.setLineDash([]);
  const [ex, ey] = pt(k), [px, py] = pt(Math.max(0, k - 0.04));
  const ang = Math.atan2(ey - py, ex - px);
  g.beginPath(); g.moveTo(ex, ey);
  g.lineTo(ex - head * Math.cos(ang - 0.45), ey - head * Math.sin(ang - 0.45));
  g.lineTo(ex - head * Math.cos(ang + 0.45), ey - head * Math.sin(ang + 0.45));
  g.closePath(); g.fill();
  g.restore();
}

/** green tick in a circle (k = draw progress) */
export function check(g, x, y, r = 22, k = 1, color = C.green) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(outBack(clamp(k * 1.6)), outBack(clamp(k * 1.6)));
  g.fillStyle = color; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = r * 0.22; g.lineCap = 'round'; g.lineJoin = 'round';
  const d = clamp((k - 0.3) / 0.7);
  g.beginPath(); g.moveTo(-r * 0.45, 0);
  if (d < 0.4) g.lineTo(-r * 0.45 + (r * 0.3) * (d / 0.4), r * 0.3 * (d / 0.4));
  else { g.lineTo(-r * 0.15, r * 0.3); g.lineTo(-r * 0.15 + r * 0.6 * ((d - 0.4) / 0.6), r * 0.3 - r * 0.65 * ((d - 0.4) / 0.6)); }
  g.stroke(); g.restore();
}
/** red cross in a circle */
export function cross(g, x, y, r = 22, k = 1, color = C.red) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); const s = outBack(clamp(k * 1.6)); g.scale(s, s);
  g.fillStyle = color; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = r * 0.22; g.lineCap = 'round';
  const d = r * 0.4;
  g.beginPath(); g.moveTo(-d, -d); g.lineTo(d, d); g.moveTo(d, -d); g.lineTo(-d, d); g.stroke();
  g.restore();
}
/** strike-through line over a box */
export function strike(g, x1, y1, x2, y2, k = 1, color = C.red, lw = 6) {
  if (k <= 0) return;
  k = clamp(k);
  g.save(); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); g.stroke(); g.restore();
}

/** rubber stamp: slams in from big */
export function stamp(g, str, x, y, t, t0, { color = C.red, size = 44, rot = -0.12 } = {}) {
  const k = range(t, t0, t0 + 0.28);
  if (k <= 0) return;
  const s = 1 + (1 - k) * 1.4;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= 0.25 + 0.75 * k;
  g.font = `400 ${size}px ${FONT.TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(str).width + size * 0.9, h = size * 1.5;
  g.strokeStyle = color; g.lineWidth = 5; rr(g, -w / 2, -h / 2, w, h, 10); g.stroke();
  g.lineWidth = 2; rr(g, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 6); g.stroke();
  g.fillStyle = color; g.fillText(str, 0, 2);
  g.restore();
}

/** round avatar with a label below. kind: 'mom' | 'you' */
export function avatar(g, x, y, kind, { r = 46, a = 1, s = 1, label = null } = {}) {
  if (a <= 0 || s <= 0) return;
  const col = kind === 'mom' ? C.sage : C.blue, dk = kind === 'mom' ? C.sageDk : C.blueDk;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(60,40,20,0.15)'; g.beginPath(); g.arc(4, 6, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  // face
  g.fillStyle = '#fff3e0'; g.beginPath(); g.arc(0, 4, r * 0.55, 0, Math.PI * 2); g.fill(); g.stroke();
  // hair
  g.fillStyle = dk; g.beginPath();
  if (kind === 'mom') { g.arc(0, -2, r * 0.6, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); g.beginPath(); g.arc(0, -r * 0.62, r * 0.2, 0, Math.PI * 2); g.fill(); }
  else { g.arc(0, -2, r * 0.58, Math.PI * 1.1, Math.PI * 1.9); g.lineTo(r * 0.2, -r * 0.25); g.closePath(); g.fill(); }
  g.fillStyle = C.ink;
  g.beginPath(); g.arc(-r * 0.2, 4, 3, 0, Math.PI * 2); g.arc(r * 0.2, 4, 3, 0, Math.PI * 2); g.fill();
  g.lineWidth = 2.5; g.beginPath(); g.arc(0, 10, r * 0.18, 0.2, Math.PI - 0.2); g.stroke();
  g.restore();
  if (label) text(g, label, x, y + r * s + 24, { size: 24, color: dk, weight: 700, a });
}

/** the bank account card */
export function account(g, cx, cy, value, { w = 300, h = 170, s = 1, a = 1, color = C.ink, label = '账户余额', ghost = null, flash = 0 } = {}) {
  if (a <= 0 || s <= 0) return;
  card(g, cx, cy, w, h, { s, a, fill: flash > 0 ? `rgba(214,69,65,${0.12 + 0.18 * flash})` : C.card, stroke: flash > 0 ? C.red : C.ink, lw: 4 });
  g.save(); g.globalAlpha *= clamp(a); g.translate(cx, cy); g.scale(s, s);
  // chip + label
  g.fillStyle = C.apricot; rr(g, -w / 2 + 22, -h / 2 + 20, 40, 28, 6); g.fill();
  g.strokeStyle = C.apricotDk; g.lineWidth = 2; g.stroke();
  text(g, label, -w / 2 + 74, -h / 2 + 34, { size: 22, color: C.inkSoft, align: 'left' });
  text(g, '¥' + value, 0, 22, { size: 76, font: 'title', color });
  if (ghost != null) text(g, ghost, 0, 22, { size: 76, font: 'title', color: C.inkSoft, a: 0.3 });
  g.restore();
}

/** money chip like "+50" */
export function chip(g, str, x, y, { fill = C.sage, color = C.ink, size = 30, a = 1, s = 1, padX = 18, h = 48, stroke = C.ink, font = 'title' } = {}) {
  if (a <= 0 || s <= 0) return;
  const w = measure(g, str, size, font) + padX * 2;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2.5; g.stroke(); }
  g.restore();
  text(g, str, x, y + 1, { size: size * s, color, font, a });
  return w;
}

/** code panel: lines = [string], hl = per-line highlight 0..1 */
export function codePanel(g, x, y, w, title, lines, { color = C.sage, dk = C.sageDk, hl = [], a = 1, s = 1, size = 26, lh = 52 } = {}) {
  if (a <= 0 || s <= 0) return;
  const h = 64 + lines.length * lh + 16;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x + w / 2, y + h / 2); g.scale(s, s); g.translate(-w / 2, -h / 2);
  g.fillStyle = 'rgba(60,40,20,0.16)'; rr(g, 5, 7, w, h, 14); g.fill();
  g.fillStyle = '#2f2b28'; rr(g, 0, 0, w, h, 14); g.fill();
  g.fillStyle = color; rr(g, 0, 0, w, 48, [14, 14, 0, 0]); g.fill();
  text(g, title, 20, 25, { size: 24, weight: 700, align: 'left', color: C.ink });
  lines.forEach((ln, i) => {
    const k = clamp(hl[i] ?? 0), ly = 64 + i * lh + lh / 2;
    if (k > 0) { g.fillStyle = `rgba(255,255,255,${0.16 * k})`; rr(g, 8, ly - lh / 2 + 4, w - 16, lh - 8, 8); g.fill();
      g.fillStyle = color; g.globalAlpha *= 1; rr(g, 8, ly - lh / 2 + 4, 6, lh - 8, 3); g.fill(); }
    text(g, String(i + 1), 34, ly, { size: size * 0.8, font: 'mono', color: '#7d746b' });
    text(g, ln, 62, ly, { size, font: 'mono', align: 'left', color: k > 0.5 ? '#fffaf0' : '#d8cfc2' });
  });
  g.restore();
  return h;
}

/** padlock; open = 0 closed … 1 open */
export function lock(g, x, y, { s = 1, a = 1, open = 0, color = C.apricot } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = C.ink; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.arc(0, -18 - open * 14, 18, Math.PI, 0); g.lineTo(18, -6 - open * 14); g.moveTo(-18, -18 - open * 14); g.lineTo(-18, -6 - open * 14 + open * 10); g.stroke();
  rr(g, -28, -10, 56, 44, 8); g.fillStyle = color; g.fill(); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink; g.beginPath(); g.arc(0, 8, 5, 0, Math.PI * 2); g.fill(); g.fillRect(-2, 8, 4, 12);
  g.restore();
}
/** key icon */
export function key(g, x, y, { s = 1, a = 1, rot = 0, color = C.apricot } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = color; g.strokeStyle = C.ink; g.lineWidth = 3;
  g.beginPath(); g.arc(-16, 0, 13, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.arc(-16, 0, 4.5, 0, Math.PI * 2); g.fillStyle = C.paper; g.fill(); g.stroke();
  g.fillStyle = color; rr(g, -4, -5, 34, 10, 3); g.fill(); g.stroke();
  g.fillRect(18, 4, 5, 9); g.strokeRect(18, 4, 5, 9); g.fillRect(25, 4, 5, 7); g.strokeRect(25, 4, 5, 7);
  g.restore();
}
/** phone icon */
export function phone(g, x, y, { s = 1, a = 1, screen = null } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(60,40,20,0.16)'; rr(g, -56, -96, 120, 200, 18); g.fill();
  g.fillStyle = C.ink; rr(g, -60, -100, 120, 200, 18); g.fill();
  g.fillStyle = C.card; rr(g, -50, -84, 100, 162, 8); g.fill();
  g.fillStyle = '#555'; rr(g, -14, 84, 28, 6, 3); g.fill();
  g.restore();
  if (screen) { g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s); screen(g); g.restore(); }
}
/** server tower */
export function server(g, x, y, { s = 1, a = 1, blink = 0 } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(60,40,20,0.16)'; rr(g, -66, -106, 140, 220, 14); g.fill();
  g.fillStyle = '#4a433d'; rr(g, -70, -110, 140, 220, 14); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 3; i++) {
    const yy = -90 + i * 64;
    g.fillStyle = '#5d554e'; rr(g, -54, yy, 108, 48, 8); g.fill();
    g.fillStyle = (i === 0 && blink > 0.5) ? C.green : '#8a8178'; g.beginPath(); g.arc(-34, yy + 24, 6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a8178'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, yy + 24); g.lineTo(38, yy + 24); g.stroke();
  }
  g.restore();
}

/** thought / speech bubble with centred text lines */
export function bubble(g, cx, cy, w, h, lines, { a = 1, s = 1, size = 30, tail = [0, 1], color = C.ink, fill = C.card, font = 'body' } = {}) {
  if (a <= 0 || s <= 0) return;
  g.save(); g.globalAlpha *= clamp(a); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = 'rgba(60,40,20,0.15)'; rr(g, -w / 2 + 5, -h / 2 + 7, w, h, h / 2.6); g.fill();
  g.fillStyle = fill; g.strokeStyle = C.ink; g.lineWidth = 3;
  rr(g, -w / 2, -h / 2, w, h, h / 2.6); g.fill(); g.stroke();
  const [tx, ty] = tail;
  if (ty) {
    const bx = tx * w * 0.3, by = h / 2;
    g.beginPath(); g.arc(bx - 10, by + 22, 11, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(bx - 26, by + 46, 7, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  lines.forEach((ln, i) => text(g, ln, 0, (i - (lines.length - 1) / 2) * size * 1.4, { size, color, font }));
  g.restore();
}

/** small label tag */
export function tag(g, str, x, y, { size = 22, color = C.inkSoft, fill = 'rgba(255,250,240,0.9)', a = 1, stroke = C.line, align = 'center' } = {}) {
  if (a <= 0) return;
  const w = measure(g, str, size) + 24, h = size + 16;
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  g.save(); g.globalAlpha *= clamp(a);
  rr(g, x0, y - h / 2, w, h, 8); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  g.restore();
  text(g, str, x0 + w / 2, y + 1, { size, color, a });
}

/** jagged shards of a broken tile (value text included), k = 0 intact … 1 fully shattered & fallen */
export function shatter(g, str, cx, cy, w, h, k, { fill = '#f5d0cc', color = C.red, size = 56 } = {}) {
  if (k >= 1) return;
  const cols = 3, rows = 2;
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols, r = (i / cols) | 0;
    const sx = -w / 2 + c * w / cols, sy = -h / 2 + r * h / rows;
    const dx = (hash(i + 40) - 0.5) * 160 * k, dy = (k * k) * 260 + (hash(i + 80) - 0.5) * 40 * k, rot = (hash(i + 120) - 0.5) * 1.6 * k;
    g.save(); g.globalAlpha *= 1 - k;
    g.translate(cx + sx + w / cols / 2 + dx, cy + sy + h / rows / 2 + dy); g.rotate(rot);
    g.beginPath(); g.rect(-w / cols / 2, -h / rows / 2, w / cols, h / rows); g.clip();
    g.fillStyle = fill; g.fillRect(-w / cols / 2, -h / rows / 2, w / cols, h / rows);
    g.translate(-(sx + w / cols / 2), -(sy + h / rows / 2));
    text(g, str, 0, 2, { size, font: 'title', color });
    g.restore();
  }
  if (k > 0 && k < 0.5) { // crack lines
    g.save(); g.strokeStyle = C.red; g.lineWidth = 3; g.globalAlpha *= 1 - k * 2;
    g.beginPath(); g.moveTo(cx - w * 0.4, cy - h * 0.3); g.lineTo(cx - w * 0.05, cy + h * 0.05); g.lineTo(cx + w * 0.1, cy - h * 0.4);
    g.moveTo(cx - w * 0.05, cy + h * 0.05); g.lineTo(cx + w * 0.35, cy + h * 0.4); g.stroke(); g.restore();
  }
}

export { W, H, C };
