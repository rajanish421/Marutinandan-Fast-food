import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, TAU, rng, std, phys, paint, smooth, displace, puckGeometry, instanced, fbm, clamp01, lerp, smoothstep, lathe } from '../common.js';

const C = (h) => new THREE.Color(h);

export function buildPizza(opts = {}) {
  const toppings = opts.toppings && opts.toppings.length ? opts.toppings : ['basil', 'tomato'];
  const rand = rng(5);
  const group = new THREE.Group();

  /* wooden board */
  const board = new THREE.Mesh(
    smooth(lathe([[0, 0], [1.72, 0], [1.78, 0.015], [1.8, 0.05], [1.78, 0.085], [1.72, 0.1], [0, 0.1]], 80)),
    std('#a8733f', { roughness: 0.75 })
  );
  group.add(board);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.008, 6, 90), std('#7d4f27', { roughness: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.101;
  group.add(ring);

  const pz = new THREE.Group();
  pz.position.y = 0.1;
  group.add(pz);

  /* sauce base */
  const baseG = puckGeometry(1.42, 0.1, { bevel: 0.04, rings: 4 });
  pz.add(new THREE.Mesh(baseG, phys('#c23d1d', { roughness: 0.4, clearcoat: 0.3 })));

  /* crust ring */
  const crustG = new THREE.TorusGeometry(1.42, 0.18, 26, 128);
  crustG.rotateX(Math.PI / 2);
  displace(crustG, (v) => {
    const n = fbm(v.x * 2.4, v.y * 2.4, v.z * 2.4, 3) - 0.5;
    v.y = v.y * 0.92 + 0.14 + n * 0.05;
    const r = Math.hypot(v.x, v.z); const k = 1 + n * 0.035; v.x *= k; v.z *= k;
  });
  const crust = smooth(crustG);
  paint(crust, (c, x, y, z) => {
    const n = fbm(x * 3.4, y * 3.4, z * 3.4, 6);
    c.lerpColors(C('#e7b062'), C('#d18a3a'), clamp01((0.34 - y) * 3 + n * 0.5));
    if (n > 0.64) c.lerp(C('#a85d1e'), (n - 0.64) * 3.2);
    c.multiplyScalar(0.92 + n * 0.14);
  });
  pz.add(new THREE.Mesh(crust, phys('#ffffff', { vertexColors: true, roughness: 0.62, clearcoat: 0.12 })));

  /* cheese */
  const cheeseG = puckGeometry(1.33, 0.075, { bevel: 0.03, rings: 26, seg: 96 });
  displace(cheeseG, (v) => {
    if (v.y > 0.07) v.y += (fbm(v.x * 3.2, 0, v.z * 3.2, 8) - 0.5) * 0.06 + Math.max(0, fbm(v.x * 6, 0, v.z * 6, 9) - 0.6) * 0.1;
  });
  cheeseG.computeVertexNormals();
  paint(cheeseG, (c, x, y, z) => {
    const rho = Math.hypot(x, z) / 1.33;
    const n = fbm(x * 4.2, 0, z * 4.2, 17);
    c.lerpColors(C('#fbe08a'), C('#f3c552'), n);
    if (n > 0.6) c.lerp(C('#d98f2c'), clamp01((n - 0.6) * 3.2));
    if (rho > 0.95) c.lerp(C('#c8401f'), 0.35);
  });
  const cheese = new THREE.Mesh(cheeseG, phys('#ffffff', { vertexColors: true, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.35 }));
  cheese.position.y = 0.09;
  pz.add(cheese);

  const topY = 0.09 + 0.075 + 0.01;

  /* topping placement (shared so nothing overlaps) */
  const taken = [];
  const spot = (minD, maxR = 1.12) => {
    for (let t = 0; t < 200; t++) {
      const a = rand() * TAU, r = Math.sqrt(rand()) * maxR;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (taken.every(([u, v, d]) => (u - x) ** 2 + (v - z) ** 2 > ((d + minD) * 0.92) ** 2)) { taken.push([x, z, minD]); return [x, z]; }
    }
    const a = rand() * TAU, r = Math.sqrt(rand()) * maxR; return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const place = (count, minD, maxR) => Array.from({ length: count }, () => spot(minD, maxR));

  const add = (m) => { pz.add(m); };
  const has = (k) => toppings.includes(k);
  const dense = toppings.length > 3;

  if (has('pepperoni')) {
    const g = puckGeometry(0.2, 0.035, { bevel: 0.016, rings: 3, seg: 36 });
    add(instanced(g, phys('#b5311c', { roughness: 0.4, clearcoat: 0.5 }), place(9, 0.2).map(([x, z]) => ({ p: [x, topY, z], r: [0, rand() * TAU, 0] }))));
  }
  if (has('tomato')) {
    const g = puckGeometry(0.17, 0.03, { bevel: 0.012, rings: 3, seg: 32 });
    add(instanced(g, phys('#d93820', { roughness: 0.25, clearcoat: 0.8 }), place(dense ? 6 : 8, 0.18).map(([x, z]) => ({ p: [x, topY, z] }))));
  }
  if (has('capsicum')) {
    const g = new THREE.TorusGeometry(0.115, 0.03, 8, 18); g.rotateX(Math.PI / 2);
    add(instanced(g, phys('#3da93f', { roughness: 0.3, clearcoat: 0.6 }), place(9, 0.15).map(([x, z]) => ({ p: [x, topY + 0.02, z], r: [(rand() - 0.5) * 0.3, rand() * TAU, 0], s: [1 + rand() * 0.3, 1, 1 + rand() * 0.3] }))));
  }
  if (has('onion')) {
    const g = new THREE.TorusGeometry(0.15, 0.02, 6, 14, 3.4); g.rotateX(Math.PI / 2);
    add(instanced(g, std('#efd2ee', { roughness: 0.4 }), place(10, 0.14).map(([x, z]) => ({ p: [x, topY + 0.015, z], r: [0, rand() * TAU, 0] }))));
  }
  if (has('olive')) {
    const g = new THREE.TorusGeometry(0.058, 0.034, 10, 18); g.rotateX(Math.PI / 2);
    add(instanced(g, phys('#1c1721', { roughness: 0.2, clearcoat: 1 }), place(11, 0.1).map(([x, z]) => ({ p: [x, topY + 0.02, z], r: [0, rand() * TAU, 0] }))));
  }
  if (has('corn')) {
    const g = new THREE.SphereGeometry(0.046, 8, 6);
    add(instanced(g, phys('#ffcf27', { roughness: 0.3, clearcoat: 0.6 }), place(44, 0.07).map(([x, z]) => ({ p: [x, topY + 0.02, z], s: [1, 0.85, 1] }))));
  }
  if (has('paneer')) {
    const g = new RoundedBoxGeometry(0.17, 0.12, 0.17, 2, 0.03);
    add(instanced(g, std('#f5e5b7', { roughness: 0.6 }), place(10, 0.18).map(([x, z]) => ({ p: [x, topY + 0.04, z], r: [0, rand() * TAU, 0] }))));
  }
  if (has('basil')) {
    const g = new THREE.SphereGeometry(1, 18, 10);
    displace(g, (v) => { v.y += v.x * v.x * 0.45; });
    g.scale(0.22, 0.018, 0.13);
    add(instanced(g, std('#2b9a40', { roughness: 0.5, side: THREE.DoubleSide }), place(has('olive') || dense ? 6 : 5, 0.22).map(([x, z]) => ({ p: [x, topY + 0.045, z], r: [(rand() - 0.5) * 0.3, rand() * TAU, (rand() - 0.5) * 0.3] }))));
  }

  /* slice cuts */
  for (let k = 0; k < 4; k++) {
    const cut = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.014, 0.02), std('#b4401a', { roughness: 0.6 }));
    cut.position.y = 0.09 + 0.075 + 0.002;
    cut.rotation.y = (k * Math.PI) / 4 + 0.2;
    pz.add(cut);
  }

  group.rotation.y = 0.5;
  return { group, tilt: { x: 0.62, z: 0 }, lift: 0 };
}
