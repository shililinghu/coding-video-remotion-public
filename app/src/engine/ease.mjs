// Pure easing / interpolation helpers (no DOM).
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** 0→1 as t goes a→b (clamped). */
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
export const srange = (t, a, b) => smooth(range(t, a, b));
export const outCubic = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const inOutCubic = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const outBack = (k, s = 1.70158) => { k = clamp(k); const c = s + 1; return 1 + c * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
/** entrance progress with overshoot, starting at t0, lasting d seconds */
export const pop = (t, t0, d = 0.5) => { const k = range(t, t0, t0 + d); return k <= 0 ? 0 : outBack(k); };
/** linear fade-in progress */
export const fade = (t, t0, d = 0.4) => range(t, t0, t0 + d);
/** number roll from a to b between t0 and t0+d */
export const roll = (t, t0, a, b, d = 0.5) => Math.round(lerp(a, b, inOutCubic(range(t, t0, t0 + d))));
/** deterministic hash → [0,1) */
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
