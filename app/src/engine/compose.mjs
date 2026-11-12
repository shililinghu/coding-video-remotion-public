// Frame composer: paper + shot(s) with cross-dissolve, then HUD, subtitles and global fades.
import { WIDTH as W, HEIGHT as H, INTRO } from '../config.mjs';
import { paper } from './draw.mjs';
import { drawTopBar, drawSubs } from './hud.mjs';
import { range } from './ease.mjs';

export function renderShot(g, shot, t, TL) {
  g.save(); paper(g); shot.render(g, t, shot, TL); g.restore();
}

export function createComposer(canvas, TL) {
  const g = canvas.getContext('2d');
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
  const lg = layer.getContext('2d');
  return function renderAt(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    const layers = TL.layersAt(t);
    renderShot(g, layers[0].shot, t, TL);
    if (layers.length > 1 && layers[1].alpha > 0) {
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalAlpha = 1;
      renderShot(lg, layers[1].shot, t, TL);
      g.globalAlpha = Math.min(1, layers[1].alpha); g.drawImage(layer, 0, 0); g.globalAlpha = 1;
    }
    drawTopBar(g, TL, t);
    drawSubs(g, TL, t);
    // fade in from black, fade out to black
    const black = Math.max(1 - range(t, 0, INTRO), range(t, TL.DURATION - 0.8, TL.DURATION - 1 / 30));
    if (black > 0) { g.fillStyle = `rgba(0,0,0,${black})`; g.fillRect(0, 0, W, H); }
  };
}
