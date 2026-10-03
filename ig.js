// Instagram mockups: feed posts (4:5) and a story (9:16) as self-contained SVGs, all text outlined.
// F = { logo, black (Unbounded 800), mono (Space Grotesk 500) }, s = lab state (palette + logo settings).
import { wordmark, layers, pathEl, text, textWidth, place, mix, lum, r2 } from './render.js';

const M = 84;

export function instagram(F, s, key) {
  const c = { ...s, muted: mix(s.bg, s.fg, 0.55), line: mix(s.bg, s.fg, 0.18), dim: mix(s.bg, s.fg, 0.22) };
  return [
    ['announce', 'Event: Epping Presents', 1080, 1350, announce],
    ['brand', 'Logo post', 1080, 1350, brand],
    ['mix', 'New mix', 1080, 1350, mixPost],
    ['wedding', 'Rave Wedding', 1080, 1350, wedding],
    ['quote', 'Statement', 1080, 1350, quote],
    ['dates', 'Upcoming dates', 1080, 1350, dates],
    ['story', 'Story: tonight', 1080, 1920, story],
  ].map(([id, name, w, h, fn]) => {
    const u = `${key}-${id}`;
    const ctx = { F, c, u, w, h, n: 0 };
    return { id, name, w, h, svg: frame(ctx, fn(ctx)) };
  });
}

// ---------- building blocks ----------
function frame({ c, u, w, h }, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="isolation:isolate">` +
    `<rect width="${w}" height="${h}" fill="${c.bg}"/>${body}` +
    `<filter id="${u}-n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="${w}" height="${h}" filter="url(#${u}-n)" opacity="${lum(c.bg) < 0.5 ? 0.07 : 0.1}" style="mix-blend-mode:overlay"/></svg>`;
}

const glow = (x, cx, cy, r, col, op) => {
  const id = `${x.u}-g${x.n++}`;
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
};

// Tunnel rings shrinking toward a vanishing point, alternating accents (the site's tunnel, flattened).
function rings({ c }, cx, cy, R, n = 14, op = 0.5) {
  let out = '';
  for (let j = 0; j < n; j++) {
    const r = R * 0.8 ** j, f = 0.25 + 0.75 * (r / R);
    out += `<circle cx="${cx}" cy="${cy}" r="${r2(r)}" fill="none" stroke="${j % 2 ? c.a : c.b}" stroke-width="${r2(Math.max(1.5, r * 0.022))}" opacity="${r2(op * f)}"/>`;
  }
  return out;
}

const blend = (c) => (lum(c.bg) < 0.5 ? 'screen' : 'multiply');

// Text with the logo's effect (split / echo / ...), offset in px.
function fxText(x, d, off, size) {
  const { c } = x, id = `${x.u}-t${x.n++}`;
  const grad = c.fx === 'gradient' ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>` : '';
  const a = (c.angle * Math.PI) / 180;
  return grad + layers({ ...c, blend: c.blend === 'auto' ? blend(c) : c.blend }, r2(Math.cos(a) * off), r2(Math.sin(a) * off))
    .map((l) => pathEl(d, l, id, r2(size * 0.03))).join('');
}

const fill = (d, col, extra = '') => `<path d="${d}" fill="${col}"${extra}/>`;
const mono = (x, str, px, py, size = 30, col = x.c.fg, anchor = 'start') => fill(text(x.F.mono, str.toUpperCase(), px, py, size, { anchor, ls: 0.16 }), col);
const fit = (font, str, maxW, maxSize, ls = -0.02) => Math.min(maxSize, (maxSize * maxW) / textWidth(font, str, maxSize, ls));
function big(x, str, px, py, maxW, maxSize, { anchor = 'start', col, fx = true } = {}) {
  const size = fit(x.F.black, str, maxW, maxSize), d = text(x.F.black, str, px, py, size, { anchor, ls: -0.02 });
  return fx ? fxText(x, d, Math.max(3, size * (x.c.offset / 100) * 0.9), size) : fill(d, col || x.c.fg);
}
const logo = (x, px, py, w, anchor = 'start') => place(wordmark(x.F.logo, x.c, false), px, py, w, anchor).svg;
const line = (x, y) => `<rect x="${M}" y="${y}" width="${x.w - 2 * M}" height="2" fill="${x.c.line}"/>`;
function pill(x, label, px, py, h = 96) {
  const size = 32, w = textWidth(x.F.black, label, size, 0.04) + 2 * 46;
  return `<rect x="${px}" y="${py}" width="${r2(w)}" height="${h}" rx="${h / 2}" fill="${x.c.b}"/>` +
    fill(text(x.F.black, label, px + 46, py + h / 2 + size * 0.37, size, { ls: 0.04 }), x.c.bg);
}

// ---------- posts ----------
function announce(x) {
  const { c, w } = x;
  return glow(x, 540, 600, 560, c.b, 0.35) + rings(x, 540, 600, 980, 16, 0.55) +
    mono(x, 'Epping Presents', M, 140) + mono(x, 'Vol. 03', w - M, 140, 30, c.a, 'end') +
    big(x, '14.11', 540, 760, w - 2 * M, 260, { anchor: 'middle' }) +
    big(x, 'SATURDAY', 540, 862, w - 2 * M, 66, { anchor: 'middle', fx: false }) +
    mono(x, 'Amsterdam — secret location', 540, 925, 28, c.muted, 'middle') +
    line(x, 1170) + mono(x, 'Tickets — link in bio', M, 1250) + mono(x, '22:00 – 05:00', w - M, 1250, 30, c.a, 'end');
}

function brand(x) {
  const { c, w } = x;
  return glow(x, 540, 660, 620, c.a, 0.22) + rings(x, 540, 660, 1100, 18, 0.28) +
    logo(x, 540, 540, 860, 'middle') +
    mono(x, 'DJ · Parties · Amsterdam', 540, 820, 28, c.muted, 'middle') +
    mono(x, '@eppingmusic', M, 1250, 26, c.muted) + mono(x, 'eppingmusic.com', w - M, 1250, 26, c.muted, 'end');
}

function mixPost(x) {
  const { c, w } = x, cx = 540, cy = 450, r = 210;
  let wave = '';
  const N = 64, bw = (w - 2 * M) / N, played = 0.38;
  for (let i = 0; i < N; i++) {
    const t = i / N, v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.61) * 0.6 + Math.sin(i * 0.23 + 1) * 0.4) * (0.6 + 0.4 * Math.sin(t * Math.PI));
    const bh = 170 * v;
    wave += `<rect x="${r2(M + i * bw + bw * 0.2)}" y="${r2(1060 - bh / 2)}" width="${r2(bw * 0.6)}" height="${r2(bh)}" rx="${r2(bw * 0.3)}" fill="${t < played ? c.a : c.dim}"/>`;
  }
  const px = M + (w - 2 * M) * played;
  return glow(x, cx, cy, 420, c.b, 0.4) + rings(x, cx, cy, 520, 8, 0.45) +
    mono(x, 'New mix', M, 140, 30, c.a) + mono(x, '001', w - M, 140, 30, c.fg, 'end') +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.b}" stroke-width="26"/>` +
    `<path d="M${cx - 62} ${cy - 92}L${cx + 98} ${cy}L${cx - 62} ${cy + 92}Z" fill="${c.fg}"/>` +
    big(x, 'SUNDOWN SESSION', M, 850, w - 2 * M, 92) +
    mono(x, 'Recorded live · 62 min', M, 912, 28, c.muted) +
    wave + `<rect x="${r2(px - 2)}" y="960" width="4" height="200" fill="${c.b}"/>` +
    line(x, 1190) + mono(x, 'Listen on SoundCloud — link in bio', M, 1262, 28);
}

function wedding(x) {
  const { c, w } = x;
  return glow(x, 900, 1150, 600, c.b, 0.35) + rings(x, 900, 1150, 760, 12, 0.45) +
    mono(x, 'Private bookings 2027', M, 140, 30, c.a) +
    big(x, 'RAVE', M, 440, w - 2 * M, 330) +
    big(x, 'WEDDING', M, 620, w - 2 * M, 300) +
    fill(text(x.F.mono, 'Your wedding,', M, 770, 54), c.fg) +
    fill(text(x.F.mono, 'but make it a rave.', M, 840, 54), c.fg) +
    pill(x, 'BOOK A DATE', M, 1150) + mono(x, 'eppingmusic.com', w - M, 1212, 26, c.muted, 'end');
}

function quote(x) {
  const { c, w } = x;
  const L = ['ONE', 'MORE'], size = fit(x.F.black, 'TRACK.', w - 2 * M, 280);
  return glow(x, 980, 140, 560, c.a, 0.3) + rings(x, 980, 140, 700, 12, 0.4) +
    L.map((s, i) => fill(text(x.F.black, s, M, 520 + i * size * 0.98, size, { ls: -0.02 }), c.fg)).join('') +
    big(x, 'TRACK.', M, 520 + 2 * size * 0.98, w - 2 * M, 280) +
    logo(x, M, 1165, 330) + mono(x, 'All night long', w - M, 1225, 26, c.muted, 'end');
}

function dates(x) {
  const { c, w } = x;
  const rows = [['14.11', 'EPPING PRESENTS VOL. 03', 'Amsterdam — secret location'], ['28.11', 'RAVE WEDDING', 'Private event'], ['31.12', 'NYE: ALL NIGHT LONG', 'Location TBA']];
  return glow(x, 140, 1250, 600, c.b, 0.3) +
    big(x, 'UPCOMING', M, 250, w - 2 * M, 140) +
    rows.map(([d, t, sub], i) => {
      const y = 400 + i * 230;
      return line(x, y) + fill(text(x.F.black, d, M, y + 110, 74, { ls: -0.02 }), c.a) +
        fill(text(x.F.black, t, 400, y + 85, fit(x.F.black, t, w - M - 400, 40, 0)), c.fg) +
        mono(x, sub, 400, y + 140, 24, c.muted);
    }).join('') + line(x, 1090) +
    logo(x, M, 1170, 340) + mono(x, 'eppingmusic.com', w - M, 1240, 26, c.muted, 'end');
}

function story(x) {
  const { c, w } = x;
  return glow(x, 540, 900, 760, c.b, 0.4) + rings(x, 540, 900, 1500, 20, 0.55) +
    logo(x, 540, 190, 560, 'middle') +
    big(x, 'TONIGHT', 540, 1000, w - 2 * M, 250, { anchor: 'middle' }) +
    mono(x, 'Epping Presents Vol. 03', 540, 1090, 34, c.fg, 'middle') +
    mono(x, 'Doors 22:00 · Amsterdam', 540, 1145, 28, c.muted, 'middle') +
    `<rect x="${540 - 230}" y="1460" width="460" height="110" rx="24" fill="${c.fg}"/>` +
    fill(text(x.F.black, 'TICKETS', 540, 1528, 38, { anchor: 'middle', ls: 0.04 }), c.bg) +
    mono(x, 'Link sticker', 540, 1620, 22, c.muted, 'middle');
}
