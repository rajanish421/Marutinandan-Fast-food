import { THREE, TAU, rng, std, phys, paint, smooth, displace, lathe, puckGeometry, instanced, canvasTexture, fbm, clamp01, lerp, smoothstep } from '../common.js';

const C = (h) => new THREE.Color(h);

const STYLES = {
  steamed:  { base: '#f7eed9', shade: '#dfc79d', spot: '#d9b983', spotAmt: 0.0, rough: 0.42, clear: 0.28 },
  fried:    { base: '#dea24a', shade: '#a6621f', spot: '#7c4313', spotAmt: 1.0, rough: 0.5,  clear: 0.1 },
  tandoori: { base: '#e5632b', shade: '#a93a14', spot: '#4a1d0c', spotAmt: 1.0, rough: 0.55, clear: 0.12 },
};

/** One dumpling with a pleated top-knot. */
function momoGeometry(style, seed) {
  const sp = STYLES[style] || STYLES.steamed;
  const g = new THREE.SphereGeometry(0.5, 80, 56);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const base = C(sp.base), shade = C(sp.shade), spot = C(sp.spot), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = Math.max(0, y / 0.5);
    const phi = Math.atan2(z, x);
    let ny = y < 0 ? y * 0.36 : y;
    let rx = x * 1.1, rz = z * 0.96;
    const pinch = 1 - 0.8 * Math.pow(t, 1.2);
    const ridge = Math.sin(15 * phi + t * 2.4);
    const pleat = 1 + 0.17 * ridge * Math.pow(t, 0.55) * (1 - 0.35 * t);
    rx *= pinch * pleat; rz *= pinch * pleat;
    ny += Math.pow(t, 1.7) * 0.3;
    const tw = t * 0.55, cs = Math.cos(tw), sn = Math.sin(tw);
    const fx = rx * cs - rz * sn, fz = rx * sn + rz * cs;
    p.setXYZ(i, fx, ny, fz);
    // colour: valleys of the pleats darker; noise spots for fried / tandoori
    const valley = (1 - (ridge * 0.5 + 0.5)) * Math.pow(t, 0.6);
    const n = fbm(fx * 5 + seed, ny * 5, fz * 5, 4);
    c.copy(base).lerp(shade, clamp01(valley * 0.75 + (1 - t) * (n - 0.5) * 0.35 + (ny < -0.05 ? 0.25 : 0)));
    if (sp.spotAmt && n > 0.6) c.lerp(spot, clamp01((n - 0.6) * 3.4) * sp.spotAmt * 0.8);
    if (sp.spotAmt && t > 0.82) c.lerp(shade, (t - 0.82) * 4);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return smooth(g);
}

function chutneyBowl() {
  const grp = new THREE.Group();
  const bowl = new THREE.Mesh(smooth(lathe([[0, 0], [0.18, 0], [0.28, 0.03], [0.38, 0.17], [0.41, 0.22], [0.38, 0.22], [0.32, 0.12], [0.2, 0.07], [0, 0.07]], 48)), std('#d5dae3', { metalness: 0.9, roughness: 0.28, side: THREE.DoubleSide }));
  grp.add(bowl);
  const sauce = new THREE.Mesh(puckGeometry(0.32, 0.03, { bevel: 0.012, rings: 3, seg: 40 }), phys('#d2261a', { roughness: 0.12, clearcoat: 1 }));
  sauce.position.y = 0.11; grp.add(sauce);
  return grp;
}

function plate() {
  const prof = [[0, 0], [1.2, 0], [1.55, 0.03], [1.8, 0.12], [1.92, 0.22], [1.97, 0.25], [1.97, 0.275], [1.92, 0.28], [1.82, 0.19], [1.55, 0.095], [1.2, 0.065], [0, 0.065]];
  return new THREE.Mesh(smooth(lathe(prof, 96)), std('#d9dde5', { metalness: 0.95, roughness: 0.27 }));
}

function steamer() {
  const grp = new THREE.Group();
  const tex = canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#cfa862'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 64; i++) { g.fillStyle = i % 2 ? 'rgba(120,76,28,.35)' : 'rgba(255,230,160,.25)'; g.fillRect(i * 8, 0, 3, h); }
    for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(90,55,20,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1); }
  }, { wrap: true });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.5, 0.8, 72, 1, true), std('#ffffff', { map: tex, roughness: 0.7, side: THREE.DoubleSide }));
  wall.position.y = 0.4; grp.add(wall);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.05, 64), std('#efe6d2', { roughness: 0.8 }));
  floor.position.y = 0.03; grp.add(floor);
  [0.0, 0.8].forEach((y, i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(i ? 1.55 : 1.51, 0.055, 10, 80), std('#a87a40', { roughness: 0.65 }));
    r.rotation.x = Math.PI / 2; r.position.y = y + (i ? 0 : 0.04); grp.add(r);
  });
  [0.22, 0.58].forEach((y) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.535, 0.022, 8, 80), std('#7a4a22', { roughness: 0.7 }));
    r.rotation.x = Math.PI / 2; r.position.y = y; grp.add(r);
  });
  return grp;
}

export function buildMomos(opts = {}) {
  const style = STYLES[opts.style] ? opts.style : 'steamed';
  const serve = opts.serve === 'steamer' ? 'steamer' : 'plate';
  const count = Math.max(3, Math.min(8, opts.count || 6));
  const rand = rng(9);
  const group = new THREE.Group();

  const vessel = serve === 'steamer' ? steamer() : plate();
  group.add(vessel);
  const floorY = serve === 'steamer' ? 0.055 : 0.065;

  const sp = STYLES[style];
  const mat = phys('#ffffff', { vertexColors: true, roughness: sp.rough, clearcoat: sp.clear, clearcoatRoughness: 0.4, sheen: style === 'steamed' ? 0.6 : 0, sheenColor: C('#fff6e6') });
  const scale = serve === 'steamer' ? 0.86 : 0.82;
  const ringR = serve === 'steamer' ? 0.86 : 0.98;
  const geos = [momoGeometry(style, 0), momoGeometry(style, 3.7)];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + 0.4;
    const m = new THREE.Mesh(geos[i % 2], mat);
    const s = scale * (0.94 + rand() * 0.1);
    m.scale.set(s, s, s);
    m.rotation.y = rand() * TAU;
    m.position.set(Math.cos(a) * ringR, floorY + 0.19 * s, Math.sin(a) * ringR);
    group.add(m);
  }
  if (serve === 'steamer') {
    // extra momo in the middle when steamed
    const m = new THREE.Mesh(geos[0], mat);
    m.scale.setScalar(scale * 0.95); m.rotation.y = 1.2; m.position.set(0, floorY + 0.19 * scale, 0);
    group.add(m);
    const bowl = chutneyBowl(); bowl.position.set(1.95, 0, 0.9); bowl.scale.setScalar(1.05);
    group.add(bowl);
  } else {
    const bowl = chutneyBowl(); bowl.position.set(0, floorY - 0.0, 0); bowl.scale.setScalar(1.0);
    group.add(bowl);
  }

  group.rotation.y = 0.2;
  return { group, tilt: { x: serve === 'steamer' ? 0.42 : 0.55, z: 0 } };
}
