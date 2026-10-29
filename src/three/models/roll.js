import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, TAU, rng, std, phys, paint, smooth, displace, lathe, instanced, canvasTexture, mergeGeometries, fbm, clamp01, lerp, smoothstep } from '../common.js';

const C = (h) => new THREE.Color(h);

export function buildRoll(opts = {}) {
  const filling = opts.filling === 'veg' ? 'veg' : 'paneer';
  const sauceHex = opts.sauce || (filling === 'veg' ? '#d2371a' : '#7bbf3a');
  const rand = rng(21);
  const group = new THREE.Group();

  /* ---- paratha body (tapered, open at the top) ---- */
  const H = 2.35;
  const rAt = (y) => 0.42 + 0.11 * Math.pow(y / H, 0.9);
  const prof = [[0, 0], [0.3, 0], [0.4, 0.03]];
  const N = 46;
  for (let i = 1; i <= N; i++) { const y = (i / N) * H; prof.push([rAt(y) + Math.sin(y * 5.5) * 0.008, y]); }
  prof.push([0.56, H + 0.025], [0.545, H + 0.05], [0.5, H + 0.04], [0.47, H - 0.04]);
  for (let i = 1; i <= 10; i++) prof.push([0.47 - 0.012 * i, H - 0.04 - i * 0.2]);
  prof.push([0, 0.2]);
  const bodyG = smooth(lathe(prof, 80));
  displace(bodyG, (v) => {
    const n = fbm(v.x * 3, v.y * 3, v.z * 3, 2) - 0.5;
    const k = 1 + n * 0.04; v.x *= k; v.z *= k;
  });
  bodyG.computeVertexNormals();
  const cream = C('#efc77a'), toast = C('#b8742d'), flour = C('#f6dca3');
  paint(bodyG, (c, x, y, z) => {
    const n = fbm(x * 5.5, y * 5.5, z * 5.5, 6);
    const th = Math.atan2(z, x);
    const inside = Math.hypot(x, z) < rAt(Math.min(y, H)) - 0.03 && y < H - 0.02;
    c.copy(cream).lerp(flour, clamp01(n * 1.2 - 0.25));
    if (n > 0.55) c.lerp(toast, clamp01((n - 0.55) * 3.2) * 0.85);
    const s = ((th / TAU + 1) + y * 0.32) % 1;
    if (s < 0.035 || s > 0.985) c.lerp(toast, 0.5);
    if (inside) c.multiplyScalar(0.8);
  });
  group.add(new THREE.Mesh(bodyG, phys('#ffffff', { vertexColors: true, roughness: 0.72, side: THREE.DoubleSide })));

  /* ---- paper wrap on the lower half ---- */
  const tex = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#e8392a' : '#ffd23f'; g.fillRect(i * 32, 0, 14, h); }
    g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 300; i++) g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }, { wrap: true });
  const paperG = new THREE.CylinderGeometry(0.585, 0.5, 1.25, 64, 10, true);
  displace(paperG, (v) => {
    if (v.y > 0.6) v.y += (Math.sin(Math.atan2(v.z, v.x) * 11) * 0.5 + 0.5) * 0.08 + (fbm(v.x * 6, 0, v.z * 6, 1) - 0.5) * 0.06;
  });
  const paper = new THREE.Mesh(paperG, std('#ffffff', { map: tex, roughness: 0.8, side: THREE.DoubleSide }));
  paper.position.y = 0.62;
  group.add(paper);

  /* ---- filling poking out of the top ---- */
  const topY = H;
  const fill = new THREE.Group();
  group.add(fill);
  const rr = (a, b) => a + rand() * (b - a);

  // shredded greens / cabbage
  const shredCol = filling === 'veg' ? ['#8a2e8c', '#a63ca8', '#7cc443'] : ['#7cc443', '#5fa93a', '#a0d85a'];
  for (let i = 0; i < 9; i++) {
    const a = rand() * TAU, r0 = rr(0.05, 0.34);
    const p0 = new THREE.Vector3(Math.cos(a) * r0, topY - 0.15, Math.sin(a) * r0);
    const p1 = p0.clone().add(new THREE.Vector3(Math.cos(a) * 0.08, rr(0.18, 0.3), Math.sin(a) * 0.08));
    const p2 = p1.clone().add(new THREE.Vector3(Math.cos(a + 1) * rr(0.1, 0.22), rr(0.1, 0.22), Math.sin(a + 1) * rr(0.1, 0.22)));
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.035, 6), std(shredCol[i % shredCol.length], { roughness: 0.5 }));
    fill.add(m);
  }
  if (filling === 'paneer') {
    const cg = new RoundedBoxGeometry(0.2, 0.16, 0.2, 2, 0.035);
    const cubes = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3, r = i === 5 ? 0.0 : 0.22;
      cubes.push({ p: [Math.cos(a) * r, topY + rr(0.0, 0.2) + (i === 5 ? 0.12 : 0), Math.sin(a) * r], r: [rr(-0.4, 0.4), rr(0, TAU), rr(-0.4, 0.4)], c: i % 2 ? '#f6e2a6' : '#e8c070' });
    }
    fill.add(instanced(cg, phys('#ffffff', { roughness: 0.55, clearcoat: 0.15 }), cubes));
  } else {
    const carrot = new THREE.BoxGeometry(0.07, 0.34, 0.05);
    const caps = new THREE.BoxGeometry(0.06, 0.32, 0.04);
    const items = (geo, color, n) => instanced(geo, std(color, { roughness: 0.4 }), Array.from({ length: n }, () => {
      const a = rand() * TAU, r = rr(0.05, 0.3);
      return { p: [Math.cos(a) * r, topY + rr(0.0, 0.18), Math.sin(a) * r], r: [rr(-0.7, 0.7), rr(0, TAU), rr(-0.7, 0.7)] };
    }));
    fill.add(items(carrot, '#f08a24', 6));
    fill.add(items(caps, '#4cb04a', 6));
  }
  // onion arcs
  const arc = new THREE.TorusGeometry(0.16, 0.022, 6, 14, 3.2);
  fill.add(instanced(arc, std('#efd2ee', { roughness: 0.4 }), Array.from({ length: 4 }, () => ({ p: [rr(-0.18, 0.18), topY + rr(0.02, 0.15), rr(-0.18, 0.18)], r: [rr(0.5, 1.2), rr(0, TAU), rr(0, 1)] }))));
  // sauce blobs
  const sg = new THREE.SphereGeometry(0.13, 16, 12); sg.scale(1.3, 0.55, 1.1);
  fill.add(instanced(sg, phys(sauceHex, { roughness: 0.15, clearcoat: 1 }), [
    { p: [0.16, topY + 0.02, 0.08] }, { p: [-0.18, topY + 0.01, -0.06], s: 0.9 }, { p: [0.0, topY + 0.04, -0.2], s: 0.8 },
  ]));

  group.rotation.z = -0.32;
  group.rotation.y = 0.0;
  const wrap = new THREE.Group(); wrap.add(group);
  return { group: wrap, tilt: { x: 0, z: 0 } };
}
