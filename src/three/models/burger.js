import {
  THREE, TAU, rng, std, phys, paint, lathe, smooth, displace, puckGeometry, frillyDisc, instanced,
  fbm, clamp01, lerp, smoothstep, setGlow,
} from '../common.js';

const C = (h) => new THREE.Color(h);

/* ---- individual layers: each returns { obj, h } with obj origin at the layer's bottom ---- */

function bunBottom() {
  const g = puckGeometry(1.03, 0.3, { bevel: 0.13, rings: 8 });
  const top = C('#f6dfae'), lo = C('#cf8a35'), hi = C('#e8ad55');
  paint(g, (c, x, y, z) => {
    if (y > 0.295) { c.copy(top); c.multiplyScalar(0.92 + fbm(x * 5, 0, z * 5) * 0.14); return; }
    c.lerpColors(lo, hi, smoothstep(0, 0.3, y)).multiplyScalar(0.9 + fbm(x * 4, y * 4, z * 4, 3) * 0.2);
  });
  const m = new THREE.Mesh(g, phys('#ffffff', { vertexColors: true, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5 }));
  return { obj: m, h: 0.3 };
}

function bunTop(rand, seeds = true) {
  const pts = [[0, 0], [0.5, 0], [0.98, 0.0]];
  for (let k = 0; k <= 26; k++) {
    const a = (k / 26) * (Math.PI / 2);
    pts.push([1.07 * Math.cos(a), 0.05 + 0.7 * Math.sin(a) ** 0.92]);
  }
  const g = smooth(lathe(pts, 72));
  const under = C('#f3d49b'), lo = C('#e3a54b'), hi = C('#b9651c');
  paint(g, (c, x, y, z) => {
    if (y < 0.012) { c.copy(under).multiplyScalar(0.95); return; }
    const t = clamp01((y - 0.04) / 0.7);
    c.lerpColors(lo, hi, smoothstep(0.2, 1, t)).multiplyScalar(0.9 + fbm(x * 3, y * 3, z * 3, 9) * 0.22);
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(g, phys('#ffffff', { vertexColors: true, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28 })));

  if (seeds) {
    const sg = new THREE.SphereGeometry(1, 10, 7);
    const items = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 58; i++) {
      const th = 0.12 + rand() * 1.05;               // polar angle from the top
      const ph = rand() * TAU;
      const rx = 1.07, ry = 0.7;
      const x = rx * Math.sin(th) * Math.cos(ph), y = 0.05 + ry * Math.cos(th), z = rx * Math.sin(th) * Math.sin(ph);
      const n = new THREE.Vector3(x / (rx * rx), (y - 0.05) / (ry * ry), z / (rx * rx)).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, n);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * TAU));
      items.push({ p: [x + n.x * 0.004, y + n.y * 0.004, z + n.z * 0.004], q, s: [0.075 + rand() * 0.02, 0.028, 0.038], c: rand() > 0.3 ? '#f8edcf' : '#ecd9a6' });
    }
    const seedMesh = instanced(sg, std('#ffffff', { roughness: 0.5 }), items);
    group.add(seedMesh);
  }
  return { obj: group, h: 0.0, domeH: 0.75 };
}

function pattyLayer(kind) {
  const spec = {
    tikki:  { r: 0.99, h: 0.25, base: '#dc9b32', alt: '#b3661d', hi: '#e9b64d', rough: 0.85, bump: 0.05 },
    patty:  { r: 0.97, h: 0.22, base: '#5a3220', alt: '#2c170d', hi: '#774229', rough: 0.9, bump: 0.035 },
    paneer: { r: 0.96, h: 0.2,  base: '#f1dc9f', alt: '#c98a3a', hi: '#f8e8b8', rough: 0.7, bump: 0.02 },
  }[kind];
  const g = puckGeometry(spec.r, spec.h, { bevel: 0.08, rings: 12 });
  const seed = kind === 'tikki' ? 4 : kind === 'paneer' ? 12 : 21;
  displace(g, (v) => {
    const side = Math.hypot(v.x, v.z) > spec.r - 0.14;
    const n = fbm(v.x * 3.2, v.y * 3.2, v.z * 3.2, seed) - 0.5;
    if (side) { const k = 1 + n * spec.bump * 2.4; v.x *= k; v.z *= k; }
    if (v.y > spec.h - 0.01) v.y += n * spec.bump * 0.8;
  });
  g.computeVertexNormals();
  const base = C(spec.base), alt = C(spec.alt), hi = C(spec.hi);
  paint(g, (c, x, y, z) => {
    const n = fbm(x * 4.5, y * 4.5, z * 4.5, seed + 3);
    if (kind === 'paneer') {
      const stripe = Math.sin((x + z) * 15) > 0.55 && y > spec.h - 0.02 ? 1 : 0;
      c.copy(base).lerp(hi, n * 0.5);
      if (stripe) c.lerp(alt, 0.75);
      else if (Math.hypot(x, z) > spec.r - 0.12) c.lerp(alt, 0.35);
      return;
    }
    c.lerpColors(base, hi, clamp01(n * 1.4 - 0.1));
    if (n > 0.62) c.lerp(alt, (n - 0.62) * 3);
    if (Math.hypot(x, z) > spec.r - 0.1) c.lerp(alt, 0.35);
  });
  const m = new THREE.Mesh(g, std('#ffffff', { vertexColors: true, roughness: spec.rough }));
  return { obj: m, h: spec.h };
}

function cheeseLayer(rand, idx) {
  const g = smooth(new THREE.BoxGeometry(2.0, 0.05, 2.0, 40, 1, 40));
  displace(g, (v) => {
    const r = Math.hypot(v.x, v.z);
    const d = Math.max(0, r - 0.92);
    v.y -= Math.pow(d, 1.55) * 0.95;
    v.y += (fbm(v.x * 2, 0, v.z * 2, 31 + idx) - 0.5) * 0.02;
  });
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, phys('#ffc41f', { roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3 }));
  m.rotation.y = Math.PI / 4 + (idx % 2 ? 0.2 : 0);
  const wrap = new THREE.Group(); wrap.add(m); m.position.y = 0.03;
  return { obj: wrap, h: 0.05 };
}

function lettuceLayer(idx) {
  const g = frillyDisc({ radius: 1.1, frill: 0.14, wave: 0.1, waves: 8, droop: 0.04, thickness: 0.012, seed: 11 + idx * 5 });
  paint(g, (c, x, y, z) => {
    const rho = clamp01(Math.hypot(x, z) / 1.15);
    c.lerpColors(C('#b6e86a'), C('#3f9a27'), Math.pow(rho, 1.4)).multiplyScalar(0.9 + fbm(x * 6, 0, z * 6, 5) * 0.22);
  });
  const m = new THREE.Mesh(g, std('#ffffff', { vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }));
  m.position.y = 0.06;
  const w = new THREE.Group(); w.add(m);
  return { obj: w, h: 0.09 };
}

function tomatoLayer() {
  const g = puckGeometry(0.9, 0.1, { bevel: 0.045, rings: 10 });
  const inner = C('#f2684f'), outer = C('#c72814');
  paint(g, (c, x, y, z) => {
    const rho = clamp01(Math.hypot(x, z) / 0.9);
    c.lerpColors(inner, outer, Math.pow(rho, 2.4)).multiplyScalar(0.94 + fbm(x * 7, 0, z * 7, 2) * 0.14);
    if (y > 0.09 && rho < 0.85 && rho > 0.55 && Math.sin(Math.atan2(z, x) * 5) > 0.9) c.lerp(C('#ffd9b8'), 0.35);
  });
  const m = new THREE.Mesh(g, phys('#ffffff', { vertexColors: true, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 }));
  return { obj: m, h: 0.1 };
}

function onionLayer() {
  const grp = new THREE.Group();
  const mat = phys('#efd6f4', { roughness: 0.25, transparent: true, opacity: 0.92, clearcoat: 0.6 });
  [0.8, 0.58, 0.36].forEach((r, i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.032, 12, 56), mat);
    t.rotation.x = Math.PI / 2;
    t.position.y = 0.04 + i * 0.004;
    t.scale.z = 1.3;
    grp.add(t);
  });
  return { obj: grp, h: 0.07 };
}

function sauceLayer(color) {
  const g = frillyDisc({ radius: 0.84, rings: 10, seg: 96, frill: 0.2, wave: 0.02, waves: 6, droop: 0.015, thickness: 0.03, seed: 5 });
  const m = new THREE.Mesh(g, phys(color, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide }));
  m.position.y = 0.03;
  const w = new THREE.Group(); w.add(m);
  return { obj: w, h: 0.04 };
}

function pickleLayer() {
  const grp = new THREE.Group();
  const mat = std('#6f9c2c', { roughness: 0.4 });
  [[0.42, 0.1], [-0.3, 0.38], [-0.12, -0.46]].forEach(([x, z]) => {
    const p = new THREE.Mesh(puckGeometry(0.22, 0.045, { bevel: 0.02, rings: 3, seg: 28 }), mat);
    p.position.set(x, 0, z);
    grp.add(p);
  });
  return { obj: grp, h: 0.05 };
}

const LAYERS = {
  tikki: () => pattyLayer('tikki'),
  patty: () => pattyLayer('patty'),
  paneer: () => pattyLayer('paneer'),
  cheese: (r, i) => cheeseLayer(r, i),
  lettuce: (r, i) => lettuceLayer(i),
  tomato: () => tomatoLayer(),
  onion: () => onionLayer(),
  sauce: () => sauceLayer('#c9281b'),
  mayo: () => sauceLayer('#fff0cf'),
  pickle: () => pickleLayer(),
};

export function buildBurger(opts = {}) {
  const rand = rng(77);
  const layers = (opts.layers && opts.layers.length ? opts.layers : ['lettuce', 'tikki', 'tomato', 'sauce']).filter((k) => LAYERS[k]);
  const group = new THREE.Group();
  const parts = [];
  let y = 0;
  const place = (key, obj, h, overlap = 0.025) => {
    obj.position.y = y;
    group.add(obj);
    parts.push({ key, obj, baseY: y });
    y += h - overlap;
  };

  const bb = bunBottom();
  place('bun-bottom', bb.obj, bb.h, 0.02);
  layers.forEach((k, i) => { const l = LAYERS[k](rand, i); place(k, l.obj, l.h); });
  const bt = bunTop(rand, opts.seeds !== false);
  place('bun-top', bt.obj, 0.0, 0);
  const totalH = y + bt.domeH;

  // slight lean so it feels hand-made
  group.rotation.y = 0.4;

  const n = parts.length;
  const spacing = 0.44;
  const mid = (n - 1) / 2;
  function setExplode(f) {
    parts.forEach((p, i) => {
      p.obj.position.y = p.baseY + (i - mid) * spacing * f;
      p.obj.rotation.y = Math.sin(i * 1.7) * 0.22 * f;
    });
  }
  const shrink = clamp01(totalH / (totalH + (n - 1) * spacing)) * 1.18;

  return {
    group, parts, setExplode,
    explodeShrink: Math.max(0.42, Math.min(1, shrink)),
    highlight(i, glow, hex = '#ff2e93') { parts.forEach((p, k) => setGlow(p.obj, hex, k === i ? glow : 0)); },
  };
}
