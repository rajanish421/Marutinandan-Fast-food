import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, TAU, rng, std, phys, lathe, smooth, puckGeometry, instanced, canvasTexture, lerp } from '../common.js';

export function buildFries(opts = {}) {
  const peri = opts.style === 'periperi';
  const rand = rng(31);
  const group = new THREE.Group();

  /* ---- red carton (tapered, open) ---- */
  const tex = canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = '#d9281d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x0 = i * 256;
      g.fillStyle = '#ffcf3a';
      g.beginPath();
      g.moveTo(x0, 40); g.quadraticCurveTo(x0 + 128, 0, x0 + 256, 40); g.lineTo(x0 + 256, 78); g.quadraticCurveTo(x0 + 128, 38, x0, 78); g.closePath(); g.fill();
      g.fillStyle = '#ffffff';
      g.font = '900 70px Impact, "Arial Black", sans-serif';
      g.textAlign = 'center';
      g.fillText('FRIES', x0 + 128, 178);
      g.fillStyle = '#ffcf3a';
      g.beginPath(); g.arc(x0 + 128, 214, 7, 0, TAU); g.arc(x0 + 100, 214, 4, 0, TAU); g.arc(x0 + 156, 214, 4, 0, TAU); g.fill();
    }
  });
  const carton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.83 * Math.SQRT2, 0.6 * Math.SQRT2, 1.3, 4, 1, true),
    std('#ffffff', { map: tex, roughness: 0.55, side: THREE.DoubleSide })
  );
  carton.rotation.y = Math.PI / 4;
  carton.position.y = 0.65;
  group.add(carton);
  // thick rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.83 * Math.SQRT2 * 0.707 * 1.0, 0.02, 6, 4), std('#b81d14', { roughness: 0.6 }));
  rim.rotation.set(Math.PI / 2, 0, Math.PI / 4); rim.position.y = 1.3; rim.scale.set(1.42, 1.42, 1);
  group.add(rim);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.2), std('#8f1a12'));
  floor.position.y = 0.04;
  group.add(floor);

  /* ---- fries ---- */
  const geo = new RoundedBoxGeometry(0.125, 1, 0.125, 2, 0.028);
  const base = new THREE.Color(peri ? '#eaa33c' : '#f6cc5a'), dark = new THREE.Color(peri ? '#d4672a' : '#e1a23a');
  const items = [];
  const placed = [];
  let tries = 0;
  while (items.length < 70 && tries++ < 4000) {
    const x = (rand() * 2 - 1) * 0.6, z = (rand() * 2 - 1) * 0.6;
    if (placed.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < 0.0105)) continue;
    placed.push([x, z]);
    const rad = Math.hypot(x, z);
    const L = 1.25 + rand() * 0.8;
    const alpha = rad * 0.38 + (rand() - 0.5) * 0.12;
    const axis = new THREE.Vector3(z, 0, -x).normalize();
    if (rad < 0.02) axis.set(1, 0, 0);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, alpha);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * TAU));
    const c = new THREE.Color().lerpColors(base, dark, rand() * 0.8);
    items.push({ p: [x * 0.92, 0.12 + L / 2 - 0.05, z * 0.92], q, s: [1, L, 1], c });
  }
  group.add(instanced(geo, std('#ffffff', { roughness: 0.5 }), items));

  // peri peri seasoning flecks
  if (peri) {
    const flecks = [];
    for (let i = 0; i < 90; i++) {
      const it = items[Math.floor(rand() * items.length)];
      const t = 0.55 + rand() * 0.45;
      flecks.push({ p: [it.p[0] + (rand() - 0.5) * 0.12, it.p[1] + (t - 0.5) * 2 * (it.s[1] / 2) + (rand() - 0.5) * 0.04, it.p[2] + (rand() - 0.5) * 0.12], s: 0.016 + rand() * 0.014, c: rand() > 0.4 ? '#d83a1a' : '#9c2410' });
    }
    group.add(instanced(new THREE.IcosahedronGeometry(1, 0), std('#ffffff', { roughness: 0.8 }), flecks));
  }

  /* ---- a few fallen fries on the ground ---- */
  const lying = [];
  for (let i = 0; i < 6; i++) {
    const a = -0.9 + i * 0.36 + rand() * 0.2;
    lying.push({ p: [Math.sin(a) * 1.35, 0.065, 1.25 + Math.cos(a) * 0.25 + rand() * 0.2], r: [0, rand() * TAU, Math.PI / 2], s: [1, 0.85 + rand() * 0.4, 1], c: new THREE.Color().lerpColors(base, dark, rand()) });
  }
  group.add(instanced(geo, std('#ffffff', { roughness: 0.5 }), lying));

  /* ---- dip cup ---- */
  const cupProfile = [[0, 0], [0.26, 0], [0.3, 0.02], [0.36, 0.34], [0.38, 0.36], [0.35, 0.36], [0.32, 0.34], [0.27, 0.06], [0, 0.06]];
  const cup = new THREE.Mesh(smooth(lathe(cupProfile, 40)), std('#fff7ea', { roughness: 0.35, side: THREE.DoubleSide }));
  cup.position.set(1.42, 0, -0.35);
  group.add(cup);
  const dip = new THREE.Mesh(puckGeometry(0.33, 0.05, { bevel: 0.02, rings: 3, seg: 36 }), phys(peri ? '#fff0cc' : '#c9241a', { roughness: 0.15, clearcoat: 1 }));
  dip.position.set(1.42, 0.27, -0.35);
  group.add(dip);

  group.rotation.y = -0.5;
  return { group };
}
