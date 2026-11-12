// All shots in order.  Each shot: { id, act, chapter, lines:[lineId...], render(g, t, S, TL) }.
import { shots as a1 } from './act1.mjs';
import { shots as a2 } from './act2.mjs';
import { shots as a3 } from './act3.mjs';
import { shots as a4 } from './act4.mjs';
import { shots as a5 } from './act5.mjs';
import { shots as a6 } from './act6.mjs';
import { shots as a7 } from './act7.mjs';

export const SHOTS = [...a1, ...a2, ...a3, ...a4, ...a5, ...a6, ...a7];
