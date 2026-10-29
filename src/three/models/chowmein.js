import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, TAU, rng, std, phys, smooth, lathe, instanced, mergeGeometries, fbm, clamp01 } from '../common.js';

const PALETTE = {
  hakka:    ['#e0a84a', '#cf9238', '#ebba62', '#c4812f'],
  schezwan: ['#c5421a', '#b0360f', '#d9602a', '#9c2c0c'],
};

export function buildChowmein(opts = {}) {
  const style = opts.style === 'schezwan' ? 'schezwan' : 'hakka';
  const rand = rng(14);
  const group = new THREE.Group();

  /* ---- ceramic plate ---- */
  const prof = [[0, 0], [1.1, 0], [1.5, 0.04], [1.85, 0.2], [1.97, 0.3], [1.98, 0.33], [1.93, 0.345], [1.83, 0.27], [1.45, 0.13], [1.1, 0.09], [0, 0.09]];
  const plate = new THREE.Mesh(smooth(lathe(prof, 96)), phys('#f6f3ec', { roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.2 }));
  group.add(plate);
  const deco = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.014, 6, 96), std(style === 'schezwan' ? '#d2371a' : '#1f6f8b', { roughness: 0.4 }));
  deco.rotation.x = Math.PI / 2; deco.position.y = 0.205; group.add(deco);

  /* ---- noodle nest ---- */
  const base = 0.12;
  const mound = (r) => 0.72 * Math.pow(Math.max(0, 1 - (r / 1.25) ** 2), 0.75);
  const pal = PALETTE[style];
  const geos = [];
  const color = new THREE.Color();
  for (let i = 0; i < 130; i++) {
    const a0 = rand() * TAU;
    let r = Math.sqrt(rand()) * 1.15;
    let th = a0;
    const pts = [];
    const lift = 0.35 + rand() * 0.75;
    for (let k = 0; k < 8; k++) {
      th += (rand() - 0.5) * 1.4;
      r = Math.min(1.2, Math.max(0.0, r + (rand() - 0.5) * 0.55));
      const y = base + mound(r) * lift + Math.sin(k * 1.7 + i) * 0.035 + rand() * 0.04;
      pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const g = new THREE.TubeGeometry(curve, 26, 0.033 + rand() * 0.008, 5, false);
    color.set(pal[Math.floor(rand() * pal.length)]).multiplyScalar(0.9 + rand() * 0.2);
    const arr = new Float32Array(g.attributes.position.count * 3);
    for (let v = 0; v < arr.length; v += 3) { arr[v] = color.r; arr[v + 1] = color.g; arr[v + 2] = color.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geos.push(g);
  }
  const noodles = new THREE.Mesh(mergeGeometries(geos), phys('#ffffff', { vertexColors: true, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 }));
  group.add(noodles);

  /* ---- veggies on top ---- */
  const onMound = (n, build) => Array.from({ length: n }, () => {
    const r = Math.sqrt(rand()) * 1.0, th = rand() * TAU;
    return build(Math.cos(th) * r, base + mound(r) * 0.95 + 0.035, Math.sin(th) * r);
  });
  const strip = (w, h, d, hex, n) => group.add(instanced(new RoundedBoxGeometry(w, h, d, 2, Math.min(h, d) * 0.4), phys(hex, { roughness: 0.35, clearcoat: 0.4 }),
    onMound(n, (x, y, z) => ({ p: [x, y, z], r: [(rand() - 0.5) * 0.5, rand() * TAU, (rand() - 0.5) * 0.5] }))));
  strip(0.34, 0.03, 0.03, '#f28a1f', 16);   // carrot
  strip(0.3, 0.028, 0.055, '#41a63f', 14);  // capsicum
  strip(0.4, 0.014, 0.08, '#cfe6a0', 12);   // cabbage
  const ring = new THREE.TorusGeometry(0.05, 0.016, 6, 12);
  group.add(instanced(ring, std('#7cc443', { roughness: 0.45 }), onMound(9, (x, y, z) => ({ p: [x, y + 0.01, z], r: [Math.PI / 2 + (rand() - 0.5) * 0.7, 0, rand() * TAU] }))));
  if (style === 'schezwan') {
    group.add(instanced(new THREE.IcosahedronGeometry(1, 0), std('#c81d0e', { roughness: 0.6 }), onMound(46, (x, y, z) => ({ p: [x, y + 0.02, z], s: 0.014 + rand() * 0.014, r: [rand() * 3, rand() * 3, 0] }))));
  } else {
    group.add(instanced(new THREE.SphereGeometry(1, 6, 4), std('#f7ecd0', { roughness: 0.6 }), onMound(30, (x, y, z) => ({ p: [x, y + 0.02, z], s: [0.022, 0.01, 0.014], r: [0, rand() * TAU, 0] }))));
  }

  /* ---- chopsticks ---- */
  const wood = std('#c88d4c', { roughness: 0.55 });
  [[0.0, 0.0], [0.13, 0.2]].forEach(([dz, rot], i) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.015, 2.5, 10), wood);
    c.rotation.z = Math.PI / 2; c.rotation.y = 0.28 + rot * 0.1;
    c.position.set(0.1, 0.385, 1.5 + dz);
    group.add(c);
  });

  group.rotation.y = 0.3;
  return { group, tilt: { x: 0.55, z: 0 } };
}
