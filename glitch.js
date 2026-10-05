// Glitch tab: the final logo (Unbounded 800, G3, Sunset rave) in different amounts and kinds of glitch.
// Everything else is fixed; only the glitch changes. Static variants first, then animated loops.
import { outline, r2 } from './render.js';

export const FINAL = { text: 'EPPING', font: 'unbounded', weight: 800, spacing: -0.02, skew: 0, g: 'bar',
  bg: '#12061A', fg: '#FFF4E8', a: '#FF4D00', b: '#FF2BD6', blend: 'screen' };
// on white: black letters; the colour layers multiply instead of screen so they stay visible on a light background
export const ON_WHITE = { ...FINAL, bg: '#FFFFFF', fg: '#0A0A0A', blend: 'multiply' };

// seeded random, so a variant always looks the same
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// [id, name, note, spec]. Offsets are % of the cap height (the site uses 3).
export const VARIANTS = [
  ['GL01', 'Clean', 'No split at all: the calm version', { split: 0 }],
  ['GL02', 'Hairline', 'Split at 1.5%: just a colour fringe', { split: 1.5 }],
  ['GL03', 'Current', 'Split at 3%: the logo as it is now', { split: 3 }],
  ['GL04', 'Wide', 'Split at 6%', { split: 6 }],
  ['GL05', 'Heavy', 'Split at 10%: loud, poster-only', { split: 10 }],
  ['GL06', 'Vertical', 'Split up and down instead of sideways', { split: 3, angle: 90 }],
  ['GL07', 'Diagonal', 'Split at 45 degrees', { split: 4, angle: 45 }],
  ['GL08', 'One slice', 'A single band of the word jumps sideways', { split: 3, slices: [[0.42, 0.62, 6]] }],
  ['GL09', 'Three slices', 'Three bands out of line', { split: 3, slices: [[0.1, 0.24, -4], [0.45, 0.6, 7], [0.78, 0.88, -3]] }],
  ['GL10', 'Shredded', 'Many thin bands, a torn VHS look', { split: 4, shred: 11 }],
  ['GL11', 'Only the G', 'Clean word, only the G glitches', { split: 0, focus: { split: 6 } }],
  ['GL12', 'G sliced', 'Current split, the G is cut and shifted', { split: 3, focus: { split: 5, slices: [[0.3, 0.55, 9]] } }],
  ['GL13', 'Scanlines', 'Current split with thin scanlines through the letters', { split: 3, scan: 7 }],
  ['GL14', 'Block drop', 'Current split with a few colour blocks knocked out of place', { split: 3, blocks: 9 }],
  ['GL15', 'Echo trail', 'Fading copies trailing to the left', { split: 3, echo: 3 }],
  ['GL16', 'Site loop', 'Animated: the subtle loop the site uses now (every 4 s)', { split: 3, anim: 'site' }],
  ['GL17', 'Nervous', 'Animated: short twitches, often', { split: 3, anim: 'nervous' }],
  ['GL18', 'Big hit', 'Animated: calm, then one hard slice jump', { split: 3, anim: 'hit' }],
  ['GL19', 'Jitter', 'Animated: the colour layers never sit still', { split: 3, anim: 'jitter' }],
];

let uid = 0;
const tr = (dx, dy) => (dx || dy ? ` transform="translate(${r2(dx)} ${r2(dy)})"` : '');
const layerPaths = (d, s, dx, dy, cls = '') => {
  if (!dx && !dy) return `<path d="${d}" fill="${s.fg}"/>`;
  // animated layers: the CSS animation moves the wrapper, the path keeps its resting offset
  const L = (c, fill, x, y) => cls
    ? `<g class="${cls}${c}" style="mix-blend-mode:${s.blend}"><path d="${d}" fill="${fill}"${tr(x, y)}/></g>`
    : `<path d="${d}" fill="${fill}"${tr(x, y)} style="mix-blend-mode:${s.blend}"/>`;
  return L('a', s.a, -dx, -dy) + L('b', s.b, dx, dy) + `<path d="${d}" fill="${s.fg}"/>`;
};

// the word drawn with a given split; slices cut horizontal bands and shift them
function body(d, box, s, v, id) {
  const cap = box.y2 - box.y1, w = box.x2 - box.x1;
  const rad = ((v.angle || 0) * Math.PI) / 180, off = (v.split / 100) * cap;
  const dx = Math.cos(rad) * off, dy = Math.sin(rad) * off;
  let slices = v.slices || [];
  if (v.shred) { const R = rng(7); slices = Array.from({ length: v.shred }, (_, i) => { const y0 = i / v.shred + R() * 0.02; return [y0, y0 + 0.5 / v.shred + R() * 0.03, (R() - 0.5) * 14]; }); }
  if (!slices.length) return layerPaths(d, s, dx, dy, v.cls || '');
  const defs = [], out = [];
  // the uncut word with the bands masked out, then each band shifted
  const mask = `m${id}`;
  defs.push(`<mask id="${mask}"><rect x="${box.x1 - 50}" y="${box.y1 - 50}" width="${w + 100}" height="${cap + 100}" fill="#fff"/>${slices.map(([a, b]) => `<rect x="${box.x1 - 50}" y="${r2(box.y1 + a * cap)}" width="${w + 100}" height="${r2((b - a) * cap)}" fill="#000"/>`).join('')}</mask>`);
  out.push(`<g mask="url(#${mask})">${layerPaths(d, s, dx, dy)}</g>`);
  slices.forEach(([a, b, shift], i) => {
    const c = `c${id}_${i}`;
    defs.push(`<clipPath id="${c}"><rect x="${box.x1 - 50}" y="${r2(box.y1 + a * cap)}" width="${w + 100}" height="${r2((b - a) * cap)}"/></clipPath>`);
    out.push(`<g clip-path="url(#${c})"><g${tr((shift / 100) * cap, 0)}>${layerPaths(d, s, dx * 1.6, dy * 1.6)}</g></g>`);
  });
  return `<defs>${defs.join('')}</defs>${out.join('')}`;
}

const ANIM = {
  site: (k) => `.${k}a,.${k}b{animation:${k}x 4.2s infinite steps(1)}.${k}b{animation-name:${k}y}
    @keyframes ${k}x{0%,86%,100%{transform:translate(0,0);clip-path:none}88%{transform:translate(-3px,1px);clip-path:inset(12% 0 55% 0)}91%{transform:translate(5px,-1px);clip-path:inset(60% 0 8% 0)}94%{transform:translate(0,0);clip-path:none}}
    @keyframes ${k}y{0%,86%,100%{transform:translate(0,0);clip-path:none}88%{transform:translate(3px,-1px);clip-path:inset(48% 0 20% 0)}91%{transform:translate(-5px,1px);clip-path:inset(5% 0 70% 0)}94%{transform:translate(0,0);clip-path:none}}`,
  nervous: (k) => `.${k}a,.${k}b{animation:${k}x 1.6s infinite steps(1)}.${k}b{animation-direction:reverse}
    @keyframes ${k}x{0%,30%,55%,100%{transform:translate(0,0);clip-path:none}32%{transform:translate(-4px,0);clip-path:inset(20% 0 50% 0)}34%{transform:translate(3px,1px);clip-path:inset(62% 0 10% 0)}57%{transform:translate(5px,0);clip-path:inset(0 0 72% 0)}59%{transform:translate(-2px,0);clip-path:none}}`,
  hit: (k) => `.${k}w{animation:${k}w 5s infinite steps(1)}.${k}a,.${k}b{animation:${k}x 5s infinite steps(1)}.${k}b{animation-name:${k}y}
    @keyframes ${k}w{0%,90%,100%{transform:none;opacity:1}91%{transform:translate(14px,0) skewX(-8deg);opacity:.9}93%{transform:translate(-10px,0);opacity:1}95%{transform:none}}
    @keyframes ${k}x{0%,90%,100%{transform:none}91%{transform:translate(-16px,0)}93%{transform:translate(9px,0)}95%{transform:none}}
    @keyframes ${k}y{0%,90%,100%{transform:none}91%{transform:translate(16px,2px)}93%{transform:translate(-9px,-2px)}95%{transform:none}}`,
  jitter: (k) => `.${k}a{animation:${k}x .9s infinite steps(1)}.${k}b{animation:${k}y .7s infinite steps(1)}
    @keyframes ${k}x{0%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(1px,-1px)}60%{transform:translate(-3px,0)}80%{transform:translate(1px,1px)}}
    @keyframes ${k}y{0%{transform:translate(0,0)}25%{transform:translate(2px,-1px)}50%{transform:translate(-1px,1px)}75%{transform:translate(3px,0)}}`,
};

/** One variant as a standalone SVG string. */
export function glitchSVG(font, v, bg = true, s = FINAL) {
  const id = ++uid, k = `k${id}`;
  const full = outline(font, s), box = full.box, cap = box.y2 - box.y1;
  const pad = 6 + cap * 0.12 + (v.echo ? cap * 0.35 : 0);
  const vb = [box.x1 - pad, box.y1 - 6 - cap * 0.06, box.x2 - box.x1 + 2 * pad, cap + 12 + cap * 0.12].map(r2);
  let art;
  if (v.focus) {
    // split the word at the G: "EPPIN" stays as the main spec, the G gets its own
    const cut = r2(outline(font, s, 'EPPIN').box.x2 + 1); // between the N and the G
    const L = `l${id}`, Rr = `r${id}`;
    art = `<defs><clipPath id="${L}"><rect x="${vb[0]}" y="${vb[1]}" width="${r2(cut - vb[0])}" height="${vb[3]}"/></clipPath><clipPath id="${Rr}"><rect x="${cut}" y="${vb[1]}" width="${r2(vb[0] + vb[2] - cut)}" height="${vb[3]}"/></clipPath></defs>`
      + `<g clip-path="url(#${L})">${body(full.d, box, s, v, id + 'l')}</g><g clip-path="url(#${Rr})">${body(full.d, box, s, v.focus, id + 'r')}</g>`;
  } else art = body(full.d, box, s, { ...v, cls: v.anim ? k : '' }, id);
  let extra = '';
  if (v.echo) for (let i = v.echo; i >= 1; i--) extra += `<path d="${full.d}" fill="${i % 2 ? s.b : s.a}" opacity="${r2(0.5 / i)}"${tr(-i * cap * 0.1, 0)}/>`;
  if (v.scan) { // thin background-coloured lines across the letters
    const n = Math.round(cap / v.scan); let lines = '';
    for (let i = 0; i < n; i++) lines += `<rect x="${vb[0]}" y="${r2(box.y1 + i * v.scan + v.scan * 0.62)}" width="${vb[2]}" height="${r2(v.scan * 0.28)}" fill="${s.bg}" opacity=".85"/>`;
    art += lines;
  }
  if (v.blocks) { // small colour blocks knocked sideways
    const R = rng(11); for (let i = 0; i < v.blocks; i++) {
      const x = box.x1 + R() * (box.x2 - box.x1 - 40), y = box.y1 + R() * cap * 0.9, w = 18 + R() * 50, h = cap * (0.04 + R() * 0.08);
      art += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${[s.a, s.b, s.fg][i % 3]}" opacity="${i % 3 === 2 ? 0.9 : 0.85}" style="mix-blend-mode:${s.blend}"/>`;
    }
  }
  const style = v.anim ? `<style>${ANIM[v.anim](k)}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>` : '';
  const wrapCls = v.anim === 'hit' ? ` class="${k}w" style="transform-box:fill-box;transform-origin:center"` : '';
  const rect = bg ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${s.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="EPPING" style="isolation:isolate;overflow:hidden">${style}${rect}${extra}<g${wrapCls}>${art}</g></svg>`;
}
