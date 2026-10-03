// Pure rendering: wordmark + icon SVGs from font outlines. Shared by the lab UI and the Instagram mockups.
import { G_SHAPES } from './glyphs-g.js';
import { REPLAY_SHAPES, REPLAY_NAMES } from './glyphs-replay.js';

export const G_NAMES = { orig: 'G1 Original', clean: 'G2 Clean spur', bar: 'G3 No spur', longbar: 'G4 No spur, long bar', highbar: 'G5 High bar', lowbar: 'G6 Low bar, wide mouth', ...REPLAY_NAMES };
const SHAPES = { ...G_SHAPES, ...REPLAY_SHAPES };
export const gApplies = (s) => s.font === 'unbounded' && +s.weight === 800 && s.g !== 'orig' && SHAPES[s.g];

export const STYLES = { split: 'RGB split', chroma: 'Split, no top layer', solid: 'Solid', outline: 'Outline sticker', stack: 'Stacked echo', gradient: 'Gradient' };

export const r2 = (n) => Math.round(n * 100) / 100;
export const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
let uid = 0;

export function outline(font, s, text = s.text, size = 100) {
  const p = { commands: [] };
  const swapG = gApplies(s);
  font.forEachGlyph(text || ' ', 0, 0, size, { letterSpacing: +s.spacing }, (glyph, gx, gy, gs) => {
    if (swapG && glyph.unicode === 71) {
      const k = gs / font.unitsPerEm;
      for (const [type, ...v] of SHAPES[s.g]) {
        const pt = (i) => [gx + v[i] * k, gy + v[i + 1] * k];
        if (type === 'Z') p.commands.push({ type });
        else if (type === 'C') { const [x1, y1] = pt(0), [x2, y2] = pt(2), [x, y] = pt(4); p.commands.push({ type, x1, y1, x2, y2, x, y }); }
        else { const [x, y] = pt(0); p.commands.push({ type, x, y }); }
      }
    } else p.commands.push(...glyph.getPath(gx, gy, gs).commands.map((c) => ({ ...c })));
  });
  if (+s.skew) {
    const t = Math.tan((s.skew * Math.PI) / 180);
    for (const c of p.commands) for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (c[x] !== undefined) c[x] -= t * c[y];
  }
  return { d: pathData(p.commands), box: bbox(p.commands) };
}

// Bounding box from points incl. control points: close enough for framing.
function bbox(cmds) {
  const b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const c of cmds) for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (c[x] !== undefined) {
    b.x1 = Math.min(b.x1, c[x]); b.x2 = Math.max(b.x2, c[x]); b.y1 = Math.min(b.y1, c[y]); b.y2 = Math.max(b.y2, c[y]);
  }
  return b;
}

// opentype.js 2.0's toPathData emits NaN for some fonts, so serialise ourselves.
export function pathData(cmds) {
  const n = (v) => r2(v);
  return cmds.map((c) =>
    c.type === 'Z' ? 'Z'
    : c.type === 'Q' ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
    : c.type === 'C' ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
    : `${c.type}${n(c.x)} ${n(c.y)}`).join('');
}

export function layers(s, dx, dy) {
  const blend = s.blend === 'auto' ? (lum(s.bg) < 0.5 ? 'screen' : 'multiply') : s.blend;
  const bl = blend === 'normal' ? '' : blend;
  switch (s.fx) {
    case 'chroma': return [{ fill: s.a, dx: -dx, dy: -dy, bl }, { fill: s.b, dx, dy, bl }];
    case 'solid': return [{ fill: s.fg }];
    case 'outline': return [{ fill: s.b, dx, dy }, { fill: s.bg, stroke: s.fg }];
    case 'stack': return [{ fill: s.a, dx: 2 * dx, dy: 2 * dy }, { fill: s.b, dx, dy }, { fill: s.fg }];
    case 'gradient': return [{ fill: s.a, dx: -dx, dy: -dy, bl }, { fill: 'GRAD' }];
    default: return [{ fill: s.a, dx: -dx, dy: -dy, bl }, { fill: s.b, dx, dy, bl }, { fill: s.fg }];
  }
}

export function pathEl(d, l, gid, sw) {
  const fill = l.fill === 'GRAD' ? `url(#${gid})` : l.fill;
  let a = `d="${d}" fill="${fill}"`;
  if (l.stroke) a += ` stroke="${l.stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
  if (l.dx || l.dy) a += ` transform="translate(${r2(l.dx || 0)} ${r2(l.dy || 0)})"`;
  if (l.bl) a += ` style="mix-blend-mode:${l.bl}"`;
  return `<path ${a}/>`;
}

/** Wordmark SVG. bg: draw background rect. */
export function wordmark(font, s, bg = true) {
  const { d, box } = outline(font, s);
  const cap = box.y2 - box.y1 || 1;
  const off = (s.offset / 100) * cap, rad = (s.angle * Math.PI) / 180;
  const dx = r2(Math.cos(rad) * off), dy = r2(Math.sin(rad) * off);
  const k = s.fx === 'stack' ? 2 : 1, sw = r2(cap * 0.035), pad = 4 + (s.fx === 'outline' ? sw : 0);
  const ex = Math.abs(dx) * k + pad, ey = Math.abs(dy) * k + pad;
  const vb = [box.x1 - ex, box.y1 - ey, box.x2 - box.x1 + 2 * ex, cap + 2 * ey].map(r2);
  return svgDoc(vb, s, bg, (gid) => layers(s, dx, dy).map((l) => pathEl(d, l, gid, sw)).join(''));
}

/** Square icon: first letter, centered, always with background. */
export function mark(font, s, letter = (s.text || 'E').trim()[0] || 'E') {
  const { d, box } = outline(font, s, letter, 46);
  const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2, cap = box.y2 - box.y1;
  const off = (s.offset / 100) * cap, rad = (s.angle * Math.PI) / 180;
  const dx = r2(Math.cos(rad) * off * 1.4), dy = r2(Math.sin(rad) * off * 1.4);
  return svgDoc([0, 0, 64, 64], s, true, (gid) =>
    `<g transform="translate(${r2(32 - cx)} ${r2(32 - cy)})">${layers(s, dx, dy).map((l) => pathEl(d, l, gid, r2(cap * 0.05))).join('')}</g>`, 12);
}

export function svgDoc(vb, s, bg, body, rx = 0) {
  const gid = `g${++uid}`;
  const defs = s.fx === 'gradient' ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/></linearGradient></defs>` : '';
  const rect = bg ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" rx="${rx}" fill="${s.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${s.text}" style="isolation:isolate">${defs}${rect}${body(gid)}</svg>`;
}

export const mix = (h1, h2, t) => '#' + [16, 8, 0].map((sh) => Math.round(((parseInt(h1.slice(1), 16) >> sh) & 255) * (1 - t) + ((parseInt(h2.slice(1), 16) >> sh) & 255) * t).toString(16).padStart(2, '0')).join('');

/** Text as a path (so exports need no fonts). anchor: start | middle | end; ls in em. */
export function text(font, str, x, y, size, { anchor = 'start', ls = 0 } = {}) {
  const w = textWidth(font, str, size, ls);
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return pathData(font.getPath(str, x0, y, size, { letterSpacing: ls }).commands);
}
export const textWidth = (font, str, size, ls = 0) => font.getAdvanceWidth(str, size, { letterSpacing: ls }) - (str.length ? ls * size : 0);

/** Nest a standalone SVG at x,y with width w (height from its viewBox). anchor: start | middle | end. */
export function place(svg, x, y, w, anchor = 'start') {
  const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const h = (w * vh) / vw, x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { svg: svg.replace('<svg ', `<svg x="${r2(x0)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" `), h };
}
