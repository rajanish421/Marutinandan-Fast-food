import { THREE, TAU, rng, std, phys, roundedPolygon, canvasTexture, fbm, setGlow } from '../common.js';

const FILL = {
  chutney:  { color: '#6fb53a', h: 0.04, s: 1.0,  rough: 0.25 },
  cucumber: { color: '#b9dd8c', h: 0.07, s: 0.97, rough: 0.35 },
  tomato:   { color: '#da3a24', h: 0.075, s: 0.97, rough: 0.25 },
  onion:    { color: '#ead0ee', h: 0.045, s: 0.96, rough: 0.35 },
  cheese:   { color: '#ffc31f', h: 0.055, s: 1.05, rough: 0.3 },
  corn:     { color: '#ffd02a', h: 0.07, s: 0.97, rough: 0.35 },
  lettuce:  { color: '#82d04a', h: 0.07, s: 1.07, rough: 0.5 },
};

const TRI = [[-1, -1], [1, -1], [-1, 1]];
const CEN = [-1 / 3, -1 / 3];

function triGeo(scale, depth, bevel = 0.02) {
  const pts = TRI.map(([x, y]) => [CEN[0] + (x - CEN[0]) * scale, CEN[1] + (y - CEN[1]) * scale]);
  const shape = roundedPolygon(pts, 0.17 * scale);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

export function buildSandwich(opts = {}) {
  const fills = (opts.fillings && opts.fillings.length ? opts.fillings : ['chutney', 'cucumber', 'tomato', 'onion']).filter((k) => FILL[k]);
  const group = new THREE.Group();

  // grill-marked toast
  const toastTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e9b46c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${100 + Math.random() * 40},50,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 4);
    for (let i = -4; i <= 4; i++) { g.fillStyle = 'rgba(112,58,22,.85)'; g.fillRect(-w, i * 52 - 9, w * 2, 18); g.fillStyle = 'rgba(112,58,22,.25)'; g.fillRect(-w, i * 52 - 15, w * 2, 6); }
    g.restore();
  }, { wrap: true, repeat: [0.5, 0.5] });
  toastTex.offset.set(0.5, 0.5);
  const crumbMat = std('#ffffff', { map: toastTex, roughness: 0.7 });
  const crustMat = std('#c58435', { roughness: 0.75 });

  const specs = [{ key: 'bread-bottom', bread: true, h: 0.2 }, ...fills.map((k) => ({ key: k, h: FILL[k].h })), { key: 'bread-top', bread: true, h: 0.2 }];

  function makeHalf() {
    const half = new THREE.Group();
    const parts = [];
    let y = 0;
    specs.forEach((sp) => {
      let mesh;
      if (sp.bread) mesh = new THREE.Mesh(triGeo(1, sp.h, 0.035), [crumbMat, crustMat]);
      else { const f = FILL[sp.key]; mesh = new THREE.Mesh(triGeo(f.s, sp.h, 0.012), phys(f.color, { roughness: f.rough, clearcoat: 0.3 })); }
      mesh.position.y = y;
      half.add(mesh);
      parts.push({ key: sp.key, obj: mesh, baseY: y });
      y += sp.h + (sp.bread ? 0.045 : 0.0);
    });
    return { half, parts };
  }

  const A = makeHalf(), B = makeHalf();
  const gap = 0.1;
  A.half.position.set(-gap, 0, gap);
  B.half.rotation.y = Math.PI + 0.1;
  B.half.position.set(gap, 0, -gap);
  group.add(A.half, B.half);
  group.rotation.y = -0.55;

  const n = specs.length, mid = (n - 1) / 2, spacing = 0.34;
  function setExplode(f) {
    [A, B].forEach((h) => h.parts.forEach((p, i) => { p.obj.position.y = p.baseY + (i - mid) * spacing * f; }));
  }
  return {
    group, tilt: { x: 0.12, z: 0 }, parts: A.parts, setExplode, explodeShrink: 0.62,
    highlight(i, glow, hex) { [A, B].forEach((h) => h.parts.forEach((p, k) => setGlow(p.obj, hex || '#ff2e93', k === i ? glow : 0))); },
  };
}
