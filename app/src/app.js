// Browser runtime.  Capture mode (?capture=1): exposes window.renderAt(t) for the offline renderer.
// Preview mode: click / space to play with audio/mix.wav (if present), ?t=SECONDS to jump.
import { FPS } from './config.mjs';
import { buildTimeline } from './engine/timeline.mjs';
import { createComposer } from './engine/compose.mjs';
import { SHOTS } from './scenes/index.mjs';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');
if (capture) document.body.classList.add('capture');

const font = new FontFace('KuaiLe', 'url(../vendor/fonts/ZCOOLKuaiLe-Regular.ttf)');
try { document.fonts.add(await font.load()); } catch { /* Use system fonts when the optional font is absent. */ }
await Promise.all(['400 20px "Microsoft YaHei"', '700 20px "Microsoft YaHei"', '400 20px Consolas'].map(f => document.fonts.load(f)));

const lines = await (await fetch('./data/lines.json', { cache: 'no-store' })).json();
const TL = buildTimeline(lines, SHOTS);
const canvas = document.getElementById('stage');
const renderAt = createComposer(canvas, TL);

window.TL = TL;
window.FPS = FPS;
window.TOTAL_FRAMES = TL.TOTAL_FRAMES;
window.DURATION = TL.DURATION;
window.renderAt = renderAt;
renderAt(0);
window.READY = true;

if (!capture) {
  const seek = document.getElementById('seek'), clock = document.getElementById('clock');
  seek.max = TL.DURATION;
  const audio = new Audio('../audio/mix.wav');
  let playing = false, t = +(params.get('t') ?? 0), t0 = 0, wall = 0;
  const show = (x) => { t = Math.max(0, Math.min(TL.DURATION, x)); renderAt(t); seek.value = t; clock.textContent = t.toFixed(1) + 's'; };
  const toggle = () => {
    playing = !playing;
    if (playing) { if (t >= TL.DURATION) t = 0; t0 = t; wall = performance.now(); audio.currentTime = t; audio.play().catch(() => {}); requestAnimationFrame(tick); }
    else audio.pause();
  };
  const tick = () => {
    if (!playing) return;
    const now = audio.paused || audio.readyState < 2 ? t0 + (performance.now() - wall) / 1000 : audio.currentTime;
    show(now);
    if (now >= TL.DURATION) { playing = false; audio.pause(); return; }
    requestAnimationFrame(tick);
  };
  document.getElementById('play').onclick = toggle;
  canvas.onclick = toggle;
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
  seek.oninput = () => { show(+seek.value); if (playing) { t0 = t; wall = performance.now(); audio.currentTime = t; } };
  show(t);
}
