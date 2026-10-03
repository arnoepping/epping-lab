// Instagram mockups: 9 feed posts (4:5) and 2 stories (9:16) as self-contained SVGs, all text outlined.
// F = { logo, black (Unbounded 800), mono (Space Grotesk 500) }, s = lab state (palette + logo settings).
// P = photo key -> URL (local media/, git-ignored). look: 'mixed' (per post) | 'natural' | 'duo' (palette duotone).
import { wordmark, layers, pathEl, text, textWidth, place, mix, lum, r2 } from './render.js';

const M = 84;

export const POSTS = [
  ['announce', 'Event: Epping Presents', 1080, 1350, announce],
  ['intro', 'Intro / logo', 1080, 1350, intro],
  ['mix', 'New mix', 1080, 1350, mixPost],
  ['quote', 'Statement', 1080, 1350, quote],
  ['dump', 'Photo dump (carousel cover)', 1080, 1350, dump],
  ['wedding', 'Rave Wedding', 1080, 1350, wedding],
  ['thanks', 'Recap: thank you', 1080, 1350, thanks],
  ['portrait', 'Portrait', 1080, 1350, portrait],
  ['dates', 'Upcoming dates', 1080, 1350, dates],
  ['story', 'Story: tonight (video)', 1080, 1920, story, 'reel-street.mp4'],
  ['story2', 'Story: new mix (video)', 1080, 1920, story2, 'reel-roof.mp4'],
];

export function instagram(F, s, key, P = {}, look = 'mixed') {
  const c = { ...s, muted: mix(s.bg, s.fg, 0.6), line: mix(s.bg, s.fg, 0.22), dim: mix(s.bg, s.fg, 0.25) };
  return POSTS.map(([id, name, w, h, fn, video]) => {
    const make = (overlay) => { const x = { F, c, P, look, u: `${key}-${id}${overlay ? 'o' : ''}`, w, h, n: 0, overlay }; return frame(x, fn(x)); };
    return { id, name, w, h, video, svg: make(false), overlay: video ? make(true) : null };
  });
}

// ---------- building blocks ----------
function frame({ c, u, w, h, overlay }, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" style="isolation:isolate">` +
    (overlay ? '' : `<rect width="${w}" height="${h}" fill="${c.bg}"/>`) + body +
    (overlay ? '' : `<filter id="${u}-n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="${w}" height="${h}" filter="url(#${u}-n)" opacity="${lum(c.bg) < 0.5 ? 0.08 : 0.1}" style="mix-blend-mode:overlay"/>`) + '</svg>';
}

const ch = (hex, i) => r2(((parseInt(hex.slice(1), 16) >> (16 - 8 * i)) & 255) / 255);

// Photo in a box (cover crop). Duotone maps shadows -> bg, mids -> accent B, highlights -> accent A -> text colour.
function photo(x, key, { px = 0, py = 0, w = x.w, h = x.h, align = 'xMidYMid', look = 'natural', op = 1 } = {}) {
  if (x.overlay || !x.P[key]) return '';
  const duo = (x.look === 'mixed' ? look : x.look) === 'duo', id = `${x.u}-d${x.n++}`, { c } = x;
  const stops = [c.bg, c.b, c.a, c.fg];
  const filter = duo ? `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer><feFuncR type="linear" slope="1.25" intercept="-.1"/><feFuncG type="linear" slope="1.25" intercept="-.1"/><feFuncB type="linear" slope="1.25" intercept="-.1"/></feComponentTransfer>` +
    `<feComponentTransfer>${['R', 'G', 'B'].map((k, i) => `<feFunc${k} type="table" tableValues="${stops.map((s) => ch(s, i)).join(' ')}"/>`).join('')}</feComponentTransfer></filter>` : '';
  return filter + `<image href="${x.P[key]}" xlink:href="${x.P[key]}" x="${px}" y="${py}" width="${w}" height="${h}" preserveAspectRatio="${align} slice"${duo ? ` filter="url(#${id})"` : ''}${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

// Vertical fade to the background colour, from transparent at y1 to solid at y2 (either direction).
function fade(x, y1, y2, op = 1) {
  const id = `${x.u}-f${x.n++}`, top = Math.min(y1, y2), down = y2 > y1;
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${x.c.bg}" stop-opacity="${down ? 0 : op}"/><stop offset="1" stop-color="${x.c.bg}" stop-opacity="${down ? op : 0}"/></linearGradient>` +
    `<rect x="0" y="${top}" width="${x.w}" height="${Math.abs(y2 - y1)}" fill="url(#${id})"/>`;
}
const solid = (x, y1, y2, op = 1) => `<rect x="0" y="${y1}" width="${x.w}" height="${y2 - y1}" fill="${x.c.bg}" opacity="${op}"/>`;

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
function pill(x, label, px, py, h = 96, bg = x.c.b, col = x.c.bg) {
  const size = 32, w = textWidth(x.F.black, label, size, 0.04) + 2 * 46;
  return `<rect x="${px}" y="${py}" width="${r2(w)}" height="${h}" rx="${h / 2}" fill="${bg}"/>` +
    fill(text(x.F.black, label, px + 46, py + h / 2 + size * 0.37, size, { ls: 0.04 }), col);
}
// Small label chip on top of a photo.
function chip(x, label, px, py, col = x.c.a) {
  const size = 24, w = textWidth(x.F.mono, label.toUpperCase(), size, 0.16) + 36;
  return `<rect x="${px}" y="${py}" width="${r2(w)}" height="48" rx="6" fill="${x.c.bg}"/>` + mono(x, label, px + 18, py + 33, size, col);
}
function playButton(x, cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${x.c.b}"/>` +
    `<path d="M${r2(cx - r * 0.3)} ${r2(cy - r * 0.42)}L${r2(cx + r * 0.46)} ${cy}L${r2(cx - r * 0.3)} ${r2(cy + r * 0.42)}Z" fill="${x.c.bg}"/>`;
}

// ---------- posts ----------
function announce(x) {
  const { c, w } = x;
  return photo(x, 'crowd-street', { h: 980, look: 'duo', align: 'xMidYMid' }) + fade(x, 420, 980) + solid(x, 980, 1350) +
    rings(x, 540, 980, 1100, 10, 0.35) +
    mono(x, 'Epping Presents', M, 140) + mono(x, 'Vol. 03', w - M, 140, 30, c.a, 'end') +
    big(x, '14.11', 540, 1000, w - 2 * M, 260, { anchor: 'middle' }) +
    big(x, 'SATURDAY', 540, 1085, w - 2 * M, 60, { anchor: 'middle', fx: false }) +
    mono(x, 'Amsterdam — secret location', 540, 1140, 26, c.muted, 'middle') +
    line(x, 1190) + mono(x, 'Tickets — link in bio', M, 1262, 28) + mono(x, '22:00 – 05:00', w - M, 1262, 28, c.a, 'end');
}

function intro(x) {
  const { c, w } = x;
  return photo(x, 'dj-point', { align: 'xMidYMin' }) + fade(x, 760, 1150, 0.95) + solid(x, 1150, 1350, 0.95) +
    chip(x, 'Hi, I’m Epping', M, 96) +
    logo(x, 540, 1035, 880, 'middle') +
    mono(x, 'DJ · Rave weddings · Parties · Amsterdam', 540, 1262, 26, c.fg, 'middle');
}

function mixPost(x) {
  const { c, w } = x;
  let wave = '';
  const N = 64, bw = (w - 2 * M) / N, played = 0.38;
  for (let i = 0; i < N; i++) {
    const t = i / N, v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.61) * 0.6 + Math.sin(i * 0.23 + 1) * 0.4) * (0.6 + 0.4 * Math.sin(t * Math.PI));
    const bh = 120 * v;
    wave += `<rect x="${r2(M + i * bw + bw * 0.2)}" y="${r2(1140 - bh / 2)}" width="${r2(bw * 0.6)}" height="${r2(bh)}" rx="${r2(bw * 0.3)}" fill="${t < played ? c.a : c.dim}"/>`;
  }
  const px = M + (w - 2 * M) * played;
  return photo(x, 'dj-film', { h: 820, align: 'xMidYMin', look: 'natural' }) + fade(x, 640, 820) +
    chip(x, 'New mix · 001', M, 96) + playButton(x, w - M - 70, 720, 70) +
    big(x, 'ROOFTOP SESSION', M, 920, w - 2 * M, 92) +
    mono(x, 'Recorded live on an Amsterdam rooftop · 62 min', M, 980, 24, c.muted) +
    wave + `<rect x="${r2(px - 2)}" y="1070" width="4" height="140" fill="${c.b}"/>` +
    line(x, 1220) + mono(x, 'Listen on SoundCloud — link in bio', M, 1285, 26);
}

function quote(x) {
  const { c, w } = x;
  const size = fit(x.F.black, 'TRACK.', w - 2 * M, 270);
  return photo(x, 'smoke', { look: 'duo' }) + fade(x, 300, 1350, 0.85) +
    ['ONE', 'MORE'].map((s, i) => fill(text(x.F.black, s, M, 760 + i * size * 0.98, size, { ls: -0.02 }), c.fg)).join('') +
    big(x, 'TRACK.', M, 760 + 2 * size * 0.98, w - 2 * M, 270) +
    logo(x, M, 1185, 300) + mono(x, 'All night long', w - M, 1240, 26, c.fg, 'end');
}

function dump(x) {
  const { c, w, h } = x, g = 10, cw = (w - g) / 2, chh = (h - g) / 2;
  const cells = [['dj-varsity', 0, 0, 'xMidYMin'], ['duo-roof', cw + g, 0, 'xMidYMid'], ['dj-roof-night', 0, chh + g, 'xMidYMid'], ['dj-street', cw + g, chh + g, 'xMidYMid']];
  const bw = 640, bh = 170;
  return cells.map(([k, px, py, align]) => photo(x, k, { px, py, w: cw, h: chh, align })).join('') +
    `<rect x="${(w - bw) / 2}" y="${(h - bh) / 2}" width="${bw}" height="${bh}" rx="20" fill="${c.bg}"/>` +
    logo(x, 540, (h - bh) / 2 + 30, 540, 'middle') +
    mono(x, 'Summer ’26 · photo dump', 540, (h + bh) / 2 - 22, 22, c.a, 'middle');
}

function wedding(x) {
  const { c, w } = x;
  return photo(x, 'crowd-lights', { align: 'xMidYMax', look: 'natural' }) + fade(x, 720, 0, 0.95) + fade(x, 1000, 1350, 0.9) +
    mono(x, 'Private bookings 2027', M, 140, 30, c.a) +
    big(x, 'RAVE', M, 400, w - 2 * M, 300) +
    big(x, 'WEDDING', M, 570, w - 2 * M, 300) +
    fill(text(x.F.mono, 'Your wedding, but make it a rave.', M, 650, 40), c.fg) +
    pill(x, 'BOOK A DATE', M, 1180) + mono(x, 'eppingmusic.com', w - M, 1242, 26, c.fg, 'end');
}

function thanks(x) {
  const { c, w } = x;
  return photo(x, 'dj-street', { align: 'xMidYMid' }) + fade(x, 760, 1180, 0.9) + solid(x, 1180, 1350, 0.9) +
    chip(x, 'Recap', M, 96) +
    big(x, 'THANK YOU,', M, 1130, w - 2 * M, 140, { fx: false }) +
    big(x, 'AMSTERDAM', M, 1250, w - 2 * M, 140);
}

function portrait(x) {
  const { c, w } = x;
  return photo(x, 'dj-film-wide', { align: 'xMidYMid' }) + fade(x, 1050, 1350, 0.75) +
    logo(x, M, 1215, 280) + mono(x, 'Rooftop, Amsterdam', w - M, 1262, 24, c.fg, 'end');
}

function dates(x) {
  const { c, w } = x;
  const rows = [['14.11', 'EPPING PRESENTS VOL. 03', 'Amsterdam — secret location'], ['28.11', 'RAVE WEDDING', 'Private event'], ['31.12', 'NYE: ALL NIGHT LONG', 'Location TBA']];
  return photo(x, 'dj-roof-wide', { h: 470, look: 'duo' }) + fade(x, 200, 470) +
    big(x, 'UPCOMING', M, 440, w - 2 * M, 140) +
    rows.map(([d, t, sub], i) => {
      const y = 500 + i * 200;
      return line(x, y) + fill(text(x.F.black, d, M, y + 100, 70, { ls: -0.02 }), c.a) +
        fill(text(x.F.black, t, 400, y + 80, fit(x.F.black, t, w - M - 400, 40, 0)), c.fg) +
        mono(x, sub, 400, y + 130, 24, c.muted);
    }).join('') + line(x, 1100) +
    logo(x, M, 1180, 340) + mono(x, 'eppingmusic.com', w - M, 1250, 26, c.muted, 'end');
}

// Stories sit on a video in the lab; the SVG version uses a still from the same clip.
function story(x) {
  const { c, w } = x;
  return photo(x, 'crowd-street') + fade(x, 520, 0, 0.85) + fade(x, 1100, 1920, 0.9) +
    logo(x, 540, 160, 560, 'middle') +
    big(x, 'TONIGHT', 540, 1380, w - 2 * M, 250, { anchor: 'middle' }) +
    mono(x, 'Epping Presents Vol. 03', 540, 1470, 34, c.fg, 'middle') +
    mono(x, 'Doors 22:00 · Amsterdam', 540, 1525, 28, c.fg, 'middle') +
    `<rect x="${540 - 230}" y="1640" width="460" height="110" rx="24" fill="${c.fg}"/>` +
    fill(text(x.F.black, 'TICKETS', 540, 1708, 38, { anchor: 'middle', ls: 0.04 }), c.bg);
}

function story2(x) {
  const { c, w } = x;
  return photo(x, 'dj-night') + fade(x, 480, 0, 0.8) + fade(x, 1150, 1920, 0.9) +
    chip(x, 'New mix out now', 540 - 160, 150) +
    big(x, 'ROOFTOP', 540, 1400, w - 2 * M, 230, { anchor: 'middle' }) +
    big(x, 'SESSION', 540, 1560, w - 2 * M, 230, { anchor: 'middle', fx: false }) +
    playButton(x, 540, 1720, 70) +
    logo(x, 540, 1830, 260, 'middle');
}
