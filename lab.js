// EPPING Logo Lab: renders the wordmark from real font outlines (opentype.js), so exports are clean path SVGs.
import { parse } from 'https://cdn.jsdelivr.net/npm/opentype.js@2.0.0/dist/opentype.min.mjs';
import { G_NAMES, STYLES, lum, wordmark, mark, mix } from './render.js';
import { instagram } from './ig.js';

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
export const PALETTES = [
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

// Palettes picked so far: Sunset rave, Current, Gold rush.
const LIKED = [2, 0, 4];

const BASE = { text: 'EPPING', font: 'unbounded', weight: 800, spacing: -0.02, skew: 0, fx: 'split', offset: 3, angle: 0, blend: 'auto',
  bg: '#0A0A10', fg: '#EDEDF3', a: '#00E5FF', b: '#FF2BD6', withBg: false, g: 'bar' };


// ---------- fonts ----------
const cache = new Map();
function loadFont(key, weight) {
  const ws = FONTS[key][1];
  const w = ws.reduce((p, c) => (Math.abs(c - weight) < Math.abs(p - weight) ? c : p));
  const url = `https://cdn.jsdelivr.net/npm/@fontsource/${key}@5/files/${key}-latin-${w}-normal.woff`;
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then(parse));
  return cache.get(url);
}

// ---------- gallery ----------
const pal = (p) => ({ bg: p[1], fg: p[2], a: p[3], b: p[4] });
const label = (s) => `${s.font === 'unbounded' && +s.weight === 800 ? G_NAMES[s.g].split(' ')[0] + ' · ' : ''}${FONTS[s.font][0]} ${s.weight} · ${STYLES[s.fx]} · ${PALETTES.find((p) => p[1] === s.bg && p[3] === s.a)?.[0] ?? 'custom'}`;

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
  const G = PALETTES.slice(0, 2).flatMap((p) => Object.keys(G_NAMES).map((g) => ({ ...BASE, ...pal(p), g })));
  return [['G options (Current + Acid)', 'G', G], ['Palettes', 'P', P], ['Styles', 'S', S], ['Fonts', 'F', F], ['Unbounded weights', 'W', W]];
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
  form.g.innerHTML = Object.entries(G_NAMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
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
function savePng(svg, W, name) {
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const img = new Image(), H = Math.round((W * h) / w);
  img.onload = () => {
    const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
    c.getContext('2d').drawImage(img, 0, 0, W, H);
    c.toBlob((b) => save(b, name));
  };
  img.src = URL.createObjectURL(svgBlob(svg.replace('<svg ', `<svg width="${W}" height="${H}" `)));
}
$('dl-png').onclick = () => savePng(wordmark(font, state, state.withBg), 3000, slug() + '.png');
$('copy-link').onclick = () => navigator.clipboard.writeText(location.href).then(() => toast('Link copied'));
$('copy-settings').onclick = () => navigator.clipboard.writeText(JSON.stringify(state)).then(() => toast('Settings copied: paste them to Claude'));

// ---------- tabs / boot ----------
function tab(name) {
  for (const b of document.querySelectorAll('.tab')) b.setAttribute('aria-pressed', b.dataset.tab === name);
  for (const v of ['gallery', 'editor', 'site', 'ig']) $(v).hidden = name !== v;
  cancelAnimationFrame(raf);
  if (name === 'editor') draw();
  if (name === 'site') { drawSite(); raf = requestAnimationFrame(tunnelFrame); }
  if (name === 'ig') drawIg();
}
for (const b of document.querySelectorAll('.tab')) b.onclick = () => tab(b.dataset.tab);

// ---------- site mockup ----------
let raf = 0;
const LINES = Array.from({ length: 220 }, () => ({ a: Math.random() * Math.PI * 2, r: 3.2 + Math.random() * 0.6, z: Math.random() * 110, len: 1 + Math.random() * 3, c: Math.random() > 0.5 }));

async function drawSite() {
  const v = $('site').style;
  v.setProperty('--sa', state.a); v.setProperty('--sb', state.b); v.setProperty('--sf', state.fg); v.setProperty('--sbg', state.bg);
  v.setProperty('--sm', mix(state.bg, state.fg, 0.55)); v.setProperty('--sl', mix(state.bg, state.fg, 0.15));
  $('site-panel').style.background = mix(state.bg, state.fg, 0.05);
  $('site-panel').style.color = state.fg;
  const i = PALETTES.findIndex((p) => p[1] === state.bg && p[2] === state.fg && p[3] === state.a && p[4] === state.b);
  $('site-palette').value = i < 0 ? '' : i;
  $('site-g').value = state.g;
  const f = await loadFont(state.font, state.weight);
  $('site-logo').innerHTML = wordmark(f, state, false);
}

function tunnelFrame(t) {
  const cv = $('tunnel'), ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  const W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = state.bg; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = lum(state.bg) < 0.5 ? 'lighter' : 'source-over';
  const cx = W / 2, cy = H / 2, F = Math.max(W, H) * 0.42, travel = (t / 1000) * 3, rot = (t / 1000) * 0.15;
  const fade = (z) => Math.exp(-((0.022 * z) ** 2));
  // speed lines
  ctx.lineWidth = 1;
  for (const L of LINES) {
    const z1 = ((L.z - travel) % 110 + 110) % 110 + 0.8, z2 = z1 + L.len;
    const cs = Math.cos(L.a + rot), sn = Math.sin(L.a + rot);
    ctx.strokeStyle = L.c ? state.b : state.a; ctx.globalAlpha = 0.5 * fade(z1);
    ctx.beginPath(); ctx.moveTo(cx + (cs * L.r * F) / z1, cy + (sn * L.r * F) / z1); ctx.lineTo(cx + (cs * L.r * F) / z2, cy + (sn * L.r * F) / z2); ctx.stroke();
  }
  // rings, far to near
  const k = Math.floor(travel / 2), glow = 0.12 + 0.12 * Math.sin((t / 1000) * 4);
  for (let j = k + 60; j >= k; j--) {
    const z = j * 2 - travel + 1.2;
    if (z < 0.6) continue;
    const r = (4 * F) / z, col = j % 2 ? state.a : state.b, f = fade(z);
    ctx.strokeStyle = col;
    ctx.globalAlpha = glow * f; ctx.lineWidth = (0.44 * F) / z;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = f; ctx.lineWidth = (0.1 * F) / z;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(tunnelFrame);
}

$('site-palette').innerHTML = `<option value="">Custom</option>` + PALETTES.map((p, i) => `<option value="${i}">${p[0]}</option>`).join('');
$('site-g').innerHTML = Object.entries(G_NAMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
$('site-palette').onchange = (e) => { if (e.target.value !== '') Object.assign(state, pal(PALETTES[e.target.value])); syncForm(); drawSite(); };
$('site-g').onchange = (e) => { state.g = e.target.value; syncForm(); drawSite(); };

// ---------- instagram ----------
async function drawIg() {
  $('ig-g').value = state.g;
  const [logoFont, black, mono] = await Promise.all([loadFont(state.font, state.weight), loadFont('unbounded', 800), loadFont('space-grotesk', 500)]);
  const F = { logo: logoFont, black, mono };
  $('ig-sets').innerHTML = '';
  for (const i of LIKED) {
    const s = { ...state, ...pal(PALETTES[i]) }, key = `p${i}`, posts = instagram(F, s, key);
    const letter = 'E', slugP = PALETTES[i][0].toLowerCase().replace(/\W+/g, '-');
    const set = document.createElement('div');
    set.className = 'ig-set';
    set.innerHTML = `<h2>${PALETTES[i][0]}</h2><div class="ig-row">
      <div class="phone" style="background:${s.bg};color:${s.fg};--muted:${mix(s.bg, s.fg, 0.55)};--line:${mix(s.bg, s.fg, 0.15)}">
        <div class="ig-head"><div class="ig-avatar" style="border-color:${s.b}">${mark(logoFont, s, letter)}</div>
          <div><b>eppingmusic</b><div class="ig-stats"><span><b>48</b> posts</span><span><b>2,140</b> followers</span><span><b>312</b> following</span></div></div></div>
        <div class="ig-bio"><b>EPPING</b><br>DJ &amp; party organiser · Amsterdam<br>Rave weddings · Private events · Epping Presents<br><span style="color:${s.a}">eppingmusic.com</span></div>
        <div class="ig-hl">${['Weddings', 'Presents', 'Mixes'].map((t) => `<div><span style="border-color:${mix(s.bg, s.fg, 0.3)}">${mark(logoFont, s, letter)}</span>${t}</div>`).join('')}</div>
        <div class="ig-grid">${posts.filter((p) => p.h === 1350).map((p) => p.svg.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')).join('')}</div>
      </div>
      <div class="ig-posts"></div></div>`;
    const list = set.querySelector('.ig-posts');
    for (const p of posts) {
      const b = document.createElement('button');
      b.className = 'ig-post' + (p.h > 1350 ? ' story' : '');
      b.title = 'Download PNG';
      b.innerHTML = `${p.svg}<span>${p.name} · ${p.w}×${p.h} · PNG ↓</span>`;
      b.onclick = () => savePng(p.svg, p.w, `epping-${slugP}-${p.id}.png`);
      list.append(b);
    }
    $('ig-sets').append(set);
  }
}
$('ig-g').innerHTML = Object.entries(G_NAMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
$('ig-g').onchange = (e) => { state.g = e.target.value; syncForm(); drawIg(); };

fillSelects();
const fromHash = decode(location.hash.slice(1));
if (fromHash) openEditor(fromHash); else { syncForm(); }
renderGallery();
