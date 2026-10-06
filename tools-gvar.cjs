const paper = require('paper'); paper.setup(new paper.Size(2000, 2000));
const { parse } = require('/Users/arnoepping/Vibe Code/EPPING/node_modules/opentype.js/dist/opentype.js');
const fs = require('fs');
const b = fs.readFileSync('/Users/arnoepping/Vibe Code/EPPING/node_modules/@fontsource/unbounded/files/unbounded-latin-800-normal.woff');
const f = parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
// glyph -> paper CompoundPath in font units, y down (baseline 0)
const glyph = (ch, sx = (x) => x) => {
  const d = f.charToGlyph(ch).path.commands.map((c) => c.type === 'Z' ? 'Z' : c.type === 'Q' ? `Q${sx(c.x1)} ${-c.y1} ${sx(c.x)} ${-c.y}` : `${c.type}${sx(c.x)} ${-c.y}`).join('');
  return new paper.CompoundPath(d);
};
const rect = (x1, y1, x2, y2) => new paper.Path.Rectangle(new paper.Point(x1, -y2), new paper.Point(x2, -y1)); // up-coords
const G = glyph('G'), C = glyph('C');
const R = glyph('O', (x) => 35 + (x - 34) * (884 / 902)); // ring, x 35..919
const disc = new paper.Path(R.children.find((c) => c.area * 1 !== 0 && Math.abs(c.area) === Math.max(...R.children.map((k) => Math.abs(k.area)))).pathData);
const clean = G.unite(rect(742, 0, 919, 100));
const V = {
  orig: G,
  clean,
  bar: R.subtract(rect(500, 395, 1000, 470)).unite(rect(515, 233, 919, 395)).intersect(disc),
  longbar: R.subtract(rect(500, 395, 1000, 470)).unite(rect(430, 233, 919, 395)).intersect(disc),
  highbar: R.subtract(rect(500, 470, 1000, 545)).unite(rect(515, 310, 919, 470)).intersect(disc),
  lowbar: R.subtract(rect(500, 330, 1000, 520)).unite(rect(515, 190, 919, 330)).intersect(disc),
};
const out = {};
for (const [k, p] of Object.entries(V)) out[k] = p.pathData.replace(/(\d+\.\d{2})\d+/g, '$1');
fs.writeFileSync('gvars.json', JSON.stringify(out));
// contact sheet
const cells = Object.entries(out).map(([k, d], i) => `<g transform="translate(${(i % 3) * 1100 + 60} ${Math.floor(i / 3) * 1050 + 900})"><path d="${d}" fill="#EDEDF3"/><text x="0" y="150" fill="#9494A8" font-size="90" font-family="sans-serif">${k}</text></g>`).join('');
fs.writeFileSync('gsheet.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3300 2150" width="1320" height="860"><rect width="100%" height="100%" fill="#0A0A10"/>${cells}</svg>`);
console.log(Object.keys(out));
// compact absolute commands for the lab: [type, ...coords]
const r = (n) => Math.round(n * 10) / 10;
const cmds = (item) => (item.children ? item.children : [item]).flatMap((p) => {
  const s = p.segments, out = [['M', r(s[0].point.x), r(s[0].point.y)]];
  const n = p.closed ? s.length : s.length - 1;
  for (let i = 1; i <= n; i++) {
    const a = s[i - 1], b = s[i % s.length];
    if (a.handleOut.isZero() && b.handleIn.isZero()) out.push(['L', r(b.point.x), r(b.point.y)]);
    else out.push(['C', r(a.point.x + a.handleOut.x), r(a.point.y + a.handleOut.y), r(b.point.x + b.handleIn.x), r(b.point.y + b.handleIn.y), r(b.point.x), r(b.point.y)]);
  }
  out.push(['Z']); return out;
});
const lab = {}; for (const [k, p] of Object.entries(V)) if (k !== 'orig') lab[k] = cmds(p);
fs.writeFileSync('glyphs-g.js', `// Alternative G shapes for Unbounded 800, font units (y down, baseline 0). Generated with paper.js boolean ops on the font's own G/O.\nexport const G_SHAPES = ${JSON.stringify(lab)};\n`);
