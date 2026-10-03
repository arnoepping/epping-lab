// Replay-button G shapes for Unbounded 800: the G3 ring plus an arrowhead terminal (and a play triangle).
// Font units, y down, baseline 0; same command format as glyphs-g.js.
const CX = 477, CY = -375, OX = 442, OY = 392, IX = 212, IY = 185; // ring of the G3 shape
const MX = (OX + IX) / 2, MY = (OY + IY) / 2, TH = OX - IX; // centre line + stroke
const rad = (deg) => (deg * Math.PI) / 180;
const P = (rx, ry, t) => [CX + rx * Math.cos(t), CY + ry * Math.sin(t)];
const unit = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l]; };

// Elliptical arc t1 -> t2 (radians, either direction) as cubics, start point excluded.
function arc(rx, ry, t1, t2) {
  const n = Math.ceil(Math.abs(t2 - t1) / (Math.PI / 4)), d = (t2 - t1) / n, k = (4 / 3) * Math.tan(d / 4), out = [];
  for (let i = 0; i < n; i++) {
    const a = t1 + i * d, b = a + d, [x1, y1] = P(rx, ry, a), [x2, y2] = P(rx, ry, b);
    out.push(['C', x1 - k * rx * Math.sin(a), y1 + k * ry * Math.cos(a), x2 + k * rx * Math.sin(b), y2 - k * ry * Math.cos(b), x2, y2]);
  }
  return out;
}

const band = (t1, t2) => [['M', ...P(OX, OY, t1)], ...arc(OX, OY, t1, t2), ['L', ...P(IX, IY, t2)], ...arc(IX, IY, t2, t1), ['Z']];
const poly = (pts) => [['M', ...pts[0]], ...pts.slice(1).map((p) => ['L', ...p]), ['Z']];

// Arrowhead on the ring end at t, pointing along the direction of travel (dir = +1 clockwise, -1 anticlockwise).
// out/inn: wing reach from the stroke centre line, len: tip length, bend: tip turned toward the centre (deg); all in strokes.
function arrow(t, dir, { out = 1.05, inn = 0.75, len = 1.05, bend = 18 } = {}) {
  const [mx, my] = P(MX, MY, t), [nx, ny] = unit([P(OX, OY, t)[0] - P(IX, IY, t)[0], P(OX, OY, t)[1] - P(IX, IY, t)[1]]);
  let [tx, ty] = unit([-MX * Math.sin(t) * dir, MY * Math.cos(t) * dir]);
  const b = rad(bend); [tx, ty] = unit([tx * Math.cos(b) - nx * Math.sin(b), ty * Math.cos(b) - ny * Math.sin(b)]);
  const back = 0.04 * TH, l = len * TH;
  return poly([[mx + nx * out * TH - tx * back, my + ny * out * TH - ty * back], [mx + tx * l, my + ty * l], [mx - nx * inn * TH - tx * back, my - ny * inn * TH - ty * back]]);
}

// Play triangle pointing right: left edge at CX - b, tip at CX + a, half height h.
const play = (a = 120, b = 75, h = 115, dx = 12) => poly([[CX - b + dx, CY - h], [CX + a + dx, CY], [CX - b + dx, CY + h]]);

// G3-style bar, right edge following the outer ring.
function bar(x = 515, y1 = -395, y2 = -233) {
  const t1 = Math.asin((y1 - CY) / OY), t2 = Math.asin((y2 - CY) / OY);
  return [['M', x, y1], ['L', ...P(OX, OY, t1)], ...arc(OX, OY, t1, t2), ['L', x, y2], ['Z']];
}

// Nonzero fill: give every subpath the same winding so overlaps unite instead of cancelling.
function orient(cmds) {
  const pts = cmds.filter((c) => c[0] !== 'Z').map((c) => c.slice(-2));
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  if (a > 0) return cmds;
  const start = pts.at(-1), rev = [['M', ...start]];
  for (let i = cmds.length - 2; i >= 1; i--) {
    const c = cmds[i], prev = cmds[i - 1].slice(-2);
    rev.push(c[0] === 'C' ? ['C', c[3], c[4], c[1], c[2], ...prev] : ['L', ...prev]);
  }
  rev.push(['Z']);
  return rev;
}

const round = (cmds) => cmds.map(([t, ...v]) => [t, ...v.map((n) => Math.round(n * 10) / 10)]);
const shape = (...parts) => round(parts.flatMap(orient));

const END = rad(-78) + 2 * Math.PI; // arrow end, upper right
export const REPLAY_SHAPES = {
  replay: shape(band(rad(12), END), arrow(END, 1), play()),
  replaybar: shape(band(Math.asin(-20 / OY), END), arrow(END, 1), bar()),
  playbar: shape(band(rad(16), END), arrow(END, 1), play(255, 80, 120, 0)),
  rewind: shape(band(rad(-62), rad(38) - 2 * Math.PI), arrow(rad(38) - 2 * Math.PI, -1), play()),
  compact: shape(band(rad(12), END), arrow(END, 1, { out: 0.8, inn: 0.6, len: 0.8, bend: 12 }), play(105, 65, 100, 10)),
  big: shape(band(rad(12), END), arrow(END, 1, { out: 1.45, inn: 0.5, len: 1.4, bend: 10 }), play()),
};

export const REPLAY_NAMES = {
  replay: 'R1 Replay', replaybar: 'R2 Replay + bar', playbar: 'R3 Play as bar',
  rewind: 'R4 Rewind', compact: 'R5 Compact arrow', big: 'R6 Big arrow',
};
