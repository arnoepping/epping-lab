// EPPING Logo Lab: renders the wordmark from real font outlines (opentype.js), so exports are clean path SVGs.
import { parse } from 'https://cdn.jsdelivr.net/npm/opentype.js@2.0.0/dist/opentype.min.mjs';

const FONTS = {
  unbounded: ['Unbounded', [200, 300, 400, 500, 600, 700, 800, 900]],
  syne: ['Syne', [400, 500, 600, 700, 800]],
  'archivo-black': ['Archivo Black', [400]],
  'rubik-mono-one': ['Rubik Mono One', [400]],
  'dela-gothic-one': ['Dela Gothic One', [400]],
  bungee: ['Bungee', [400]],
  'krona-one': ['Krona One', [400]],
  michroma: ['Michroma', [400]],
  orbitron: ['Orbitron', [400, 500, 600, 700, 800, 900]],
  'big-shoulders-display': ['Big Shoulders Display', [100, 200, 300, 400, 500, 600, 700, 800, 900]],
  'space-grotesk': ['Space Grotesk', [300, 400, 500, 600, 700]],
  monoton: ['Monoton', [400]],
  'major-mono-display': ['Major Mono Display', [400]],
};

// [name, bg, text, accent A, accent B]
const PALETTES = [
  ['Current (pink/cyan)', '#0A0A10', '#EDEDF3', '#00E5FF', '#FF2BD6'],
  ['Acid', '#0B0B0B', '#F4F4F0', '#C6FF00', '#FF2BD6'],
  ['Sunset rave', '#12061A', '#FFF4E8', '#FF4D00', '#FF2BD6'],
  ['Ultraviolet', '#0D0221', '#F2EBFF', '#00F0B5', '#8C1EFF'],
  ['Gold rush', '#0A0A0A', '#FFF8E1', '#FFC400', '#FF3D7F'],
  ['3D glasses', '#050505', '#FFFFFF', '#00E5FF', '#FF1A1A'],
  ['Mono', '#0A0A10', '#FFFFFF', '#5A5A6E', '#B4B4C8'],
  ['Wedding pastel', '#FFF6F0', '#1A1020', '#7FD6FF', '#FF8FC8'],
  ['Paper', '#F2F2EE', '#0A0A10', '#2B3BFF', '#FF2BD6'],
  ['Hot pink', '#FF2BD6', '#0A0A10', '#00E5FF', '#FFFFFF'],
];

const STYLES = { split: 'RGB split', chroma: 'Split, no top layer', solid: 'Solid', outline: 'Outline sticker', stack: 'Stacked echo', gradient: 'Gradient' };

const BASE = { text: 'EPPING', font: 'unbounded', weight: 800, spacing: -0.02, skew: 0, fx: 'split', offset: 3, angle: 0, blend: 'auto',
  bg: '#0A0A10', fg: '#EDEDF3', a: '#00E5FF', b: '#FF2BD6', withBg: false };

// ---------- fonts ----------
const cache = new Map();
function loadFont(key, weight) {
  const ws = FONTS[key][1];
  const w = ws.reduce((p, c) => (Math.abs(c - weight) < Math.abs(p - weight) ? c : p));
  const url = `https://cdn.jsdelivr.net/npm/@fontsource/${key}@5/files/${key}-latin-${w}-normal.woff`;
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then(parse));
  return cache.get(url);
}

// ---------- rendering ----------
const r2 = (n) => Math.round(n * 100) / 100;
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
let uid = 0;

function outline(font, s, text = s.text, size = 100) {
  const p = font.getPath(text || ' ', 0, 0, size, { letterSpacing: +s.spacing });
  if (+s.skew) {
    const t = Math.tan((s.skew * Math.PI) / 180);
    for (const c of p.commands) for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (c[x] !== undefined) c[x] -= t * c[y];
  }
  return { d: pathData(p.commands), box: p.getBoundingBox() };
}

// opentype.js 2.0's toPathData emits NaN for some fonts, so serialise ourselves.
function pathData(cmds) {
  const n = (v) => r2(v);
  return cmds.map((c) =>
    c.type === 'Z' ? 'Z'
    : c.type === 'Q' ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
    : c.type === 'C' ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
    : `${c.type}${n(c.x)} ${n(c.y)}`).join('');
}

function layers(s, dx, dy) {
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

function pathEl(d, l, gid, sw) {
  const fill = l.fill === 'GRAD' ? `url(#${gid})` : l.fill;
  let a = `d="${d}" fill="${fill}"`;
  if (l.stroke) a += ` stroke="${l.stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
  if (l.dx || l.dy) a += ` transform="translate(${r2(l.dx || 0)} ${r2(l.dy || 0)})"`;
  if (l.bl) a += ` style="mix-blend-mode:${l.bl}"`;
  return `<path ${a}/>`;
}

/** Wordmark SVG. bg: draw background rect. */
function wordmark(font, s, bg = true) {
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
function mark(font, s) {
  const letter = (s.text || 'E').trim()[0] || 'E';
  const { d, box } = outline(font, s, letter, 46);
  const cx = (box.x1 + box.x2) / 2, cy = (box.y1 + box.y2) / 2, cap = box.y2 - box.y1;
  const off = (s.offset / 100) * cap, rad = (s.angle * Math.PI) / 180;
  const dx = r2(Math.cos(rad) * off * 1.4), dy = r2(Math.sin(rad) * off * 1.4);
  return svgDoc([0, 0, 64, 64], s, true, (gid) =>
    `<g transform="translate(${r2(32 - cx)} ${r2(32 - cy)})">${layers(s, dx, dy).map((l) => pathEl(d, l, gid, r2(cap * 0.05))).join('')}</g>`, 12);
}

function svgDoc(vb, s, bg, body, rx = 0) {
  const gid = `g${++uid}`;
  const defs = s.fx === 'gradient' ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/></linearGradient></defs>` : '';
  const rect = bg ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" rx="${rx}" fill="${s.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" role="img" aria-label="${s.text}" style="isolation:isolate">${defs}${rect}${body(gid)}</svg>`;
}

// ---------- gallery ----------
const pal = (p) => ({ bg: p[1], fg: p[2], a: p[3], b: p[4] });
const label = (s) => `${FONTS[s.font][0]} ${s.weight} · ${STYLES[s.fx]} · ${PALETTES.find((p) => p[1] === s.bg && p[3] === s.a)?.[0] ?? 'custom'}`;

function groups() {
  const P = PALETTES.map((p) => ({ ...BASE, ...pal(p) }));
  const S = [
    { fx: 'split', offset: 3 }, { fx: 'split', offset: 6 }, { fx: 'split', offset: 3, angle: 90 },
    { fx: 'split', offset: 5, angle: 45 }, { fx: 'split', offset: 4, skew: 10 }, { fx: 'chroma', offset: 4 },
    { fx: 'solid' }, { fx: 'outline', offset: 6, angle: 45 }, { fx: 'stack', offset: 4, angle: 30 },
    { fx: 'gradient', offset: 0 }, { fx: 'gradient', offset: 4, angle: 90 }, { fx: 'split', offset: 3, spacing: 0.08 },
  ].map((o) => ({ ...BASE, ...o }));
  const F = Object.entries(FONTS).map(([font, [, ws]]) => ({ ...BASE, font, weight: ws.at(-1) }));
  const W = [300, 500, 700, 900].map((weight) => ({ ...BASE, weight }));
  return [['Palettes', 'P', P], ['Styles', 'S', S], ['Fonts', 'F', F], ['Unbounded weights', 'W', W]];
}

function shuffled(n = 12) {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return Array.from({ length: n }, () => {
    const font = pick(Object.keys(FONTS));
    return { ...BASE, ...pal(pick(PALETTES)), font, weight: pick(FONTS[font][1]), fx: pick(Object.keys(STYLES)),
      offset: pick([2, 3, 4, 6, 8]), angle: pick([0, 0, 30, 45, 90, -45]), skew: pick([0, 0, 0, 8, -8]), spacing: pick([-0.04, -0.02, 0, 0.06]) };
  });
}

async function card(s, id) {
  const el = document.createElement('button');
  el.className = 'card';
  el.innerHTML = `<div class="art" style="background:${s.bg}"></div><div class="meta"><b>${id}</b><span>${label(s)}</span></div>`;
  el.onclick = () => openEditor({ ...s, withBg: state.withBg });
  loadFont(s.font, s.weight).then((f) => (el.firstChild.innerHTML = wordmark(f, s)));
  return el;
}

async function renderGroup(title, prefix, list, replace) {
  const wrap = replace || document.createElement('div');
  wrap.className = 'group';
  wrap.innerHTML = `<h2>${title}</h2><div class="grid"></div>`;
  const grid = wrap.lastChild;
  for (const [i, s] of list.entries()) grid.append(await card(s, prefix + String(i + 1).padStart(2, '0')));
  return wrap;
}

let shuffleN = 0, shuffleEl = null;
async function renderGallery() {
  const root = document.getElementById('groups');
  for (const [t, p, l] of groups()) root.append(await renderGroup(t, p, l));
  document.getElementById('shuffle').onclick = async () => {
    shuffleN++;
    const el = await renderGroup(`Random set ${shuffleN} (open one and use Copy link to keep it)`, `R${shuffleN}-`, shuffled());
    shuffleEl ? shuffleEl.replaceWith(el) : root.prepend(el);
    shuffleEl = el;
    el.scrollIntoView({ behavior: 'smooth' });
  };
}

// ---------- editor ----------
let state = { ...BASE };
const form = document.getElementById('controls');
const $ = (id) => document.getElementById(id);

function fillSelects() {
  form.font.innerHTML = Object.entries(FONTS).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join('');
  form.fx.innerHTML = Object.entries(STYLES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  form.palette.innerHTML = `<option value="">Custom</option>` + PALETTES.map((p, i) => `<option value="${i}">${p[0]}</option>`).join('');
}

function syncForm() {
  form.weight.innerHTML = FONTS[state.font][1].map((w) => `<option>${w}</option>`).join('');
  if (!FONTS[state.font][1].includes(+state.weight)) state.weight = FONTS[state.font][1].at(-1);
  for (const el of form.elements) {
    if (!el.name || el.name === 'palette') continue;
    if (el.type === 'checkbox') el.checked = !!state[el.name];
    else el.value = state[el.name];
    if (el.nextElementSibling?.tagName === 'OUTPUT') el.nextElementSibling.value = el.value;
  }
  const i = PALETTES.findIndex((p) => p[1] === state.bg && p[2] === state.fg && p[3] === state.a && p[4] === state.b);
  form.palette.value = i < 0 ? '' : i;
}

let font = null;
async function draw() {
  font = await loadFont(state.font, state.weight);
  $('preview').style.background = state.bg;
  $('preview').innerHTML = wordmark(font, state);
  $('mark').innerHTML = mark(font, state);
  $('small').style.background = state.bg;
  $('small').innerHTML = wordmark(font, state);
  const inv = { ...state, bg: lum(state.bg) < 0.5 ? '#FFFFFF' : '#0A0A10', fg: lum(state.bg) < 0.5 ? '#0A0A10' : '#FFFFFF' };
  $('inverse').style.background = inv.bg;
  $('inverse').innerHTML = wordmark(font, inv);
  history.replaceState(null, '', '#' + encode(state));
}

form.addEventListener('input', (e) => {
  const el = e.target;
  if (el.name === 'palette') { if (el.value !== '') Object.assign(state, pal(PALETTES[el.value])); }
  else state[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
  if (el.name === 'weight') state.weight = +el.value;
  syncForm();
  draw();
});

function openEditor(s) {
  state = { ...BASE, ...s };
  syncForm();
  draw();
  tab('editor');
  scrollTo(0, 0);
}

// ---------- export ----------
const encode = (s) => btoa(JSON.stringify(s));
const decode = (h) => { try { return JSON.parse(atob(h)); } catch { return null; } };
const slug = () => `epping-${state.font}-${state.fx}`.toLowerCase();
function toast(msg) { $('toast').textContent = msg; setTimeout(() => ($('toast').textContent = ''), 2500); }
function save(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
const svgBlob = (svg) => new Blob([svg], { type: 'image/svg+xml' });

$('dl-svg').onclick = () => save(svgBlob(wordmark(font, state, state.withBg)), slug() + '.svg');
$('dl-mark').onclick = () => save(svgBlob(mark(font, state)), slug() + '-icon.svg');
$('dl-png').onclick = () => {
  const svg = wordmark(font, state, state.withBg);
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const img = new Image(), W = 3000, H = Math.round((W * h) / w);
  img.onload = () => {
    const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    c.toBlob((b) => save(b, slug() + '.png'));
  };
  img.src = URL.createObjectURL(svgBlob(svg.replace('<svg ', `<svg width="${W}" height="${H}" `)));
};
$('copy-link').onclick = () => navigator.clipboard.writeText(location.href).then(() => toast('Link copied'));
$('copy-settings').onclick = () => navigator.clipboard.writeText(JSON.stringify(state)).then(() => toast('Settings copied: paste them to Claude'));

// ---------- tabs / boot ----------
function tab(name) {
  for (const b of document.querySelectorAll('.tab')) b.setAttribute('aria-pressed', b.dataset.tab === name);
  $('gallery').hidden = name !== 'gallery';
  $('editor').hidden = name !== 'editor';
}
for (const b of document.querySelectorAll('.tab')) b.onclick = () => { tab(b.dataset.tab); if (b.dataset.tab === 'editor') draw(); };

fillSelects();
const fromHash = decode(location.hash.slice(1));
if (fromHash) openEditor(fromHash); else { syncForm(); }
renderGallery();
