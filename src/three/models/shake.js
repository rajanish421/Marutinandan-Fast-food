import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, TAU, rng, std, phys, paint, smooth, lathe, puckGeometry, instanced, canvasTexture, fbm, clamp01, smoothstep, lerp } from '../common.js';

const C = (h) => new THREE.Color(h);

export function buildShake(opts = {}) {
  const [liqLo, liqHi] = opts.liquid && opts.liquid.length ? opts.liquid : ['#3a2013', '#a87a52'];
  const cream = opts.cream !== false;
  const topping = opts.topping || (cream ? 'cherry' : 'none');
  const strawCol = opts.straw || '#ff3d7f';
  const rand = rng(3);
  const group = new THREE.Group();

  const H = 2.25, rOut = (y) => 0.57 + (0.73 - 0.57) * ((y - 0.12) / (H - 0.12));
  const wall = 0.035;

  /* ---- glass ---- */
  const gp = [[0, 0.0], [0.5, 0.0], [0.55, 0.03], [0.57, 0.12]];
  for (let i = 1; i <= 12; i++) { const y = 0.12 + ((H - 0.12) * i) / 12; gp.push([rOut(y), y]); }
  gp.push([rOut(H) + 0.006, H + 0.012], [rOut(H) - 0.02, H + 0.018], [rOut(H) - wall, H - 0.004]);
  for (let i = 11; i >= 0; i--) { const y = 0.24 + ((H - 0.24) * i) / 11; gp.push([rOut(y) - wall, y]); }
  gp.push([0, 0.24]);
  const glass = new THREE.Mesh(smooth(lathe(gp, 72)), phys('#e6f4ff', {
    roughness: 0.04, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
  }));
  glass.renderOrder = 3;
  const baseGlass = new THREE.Mesh(puckGeometry(0.56, 0.2, { bevel: 0.05, rings: 3, seg: 64 }), phys('#d7ecfa', { roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1, depthWrite: false }));
  baseGlass.renderOrder = 3;
  group.add(baseGlass, glass);

  /* ---- liquid ---- */
  const top = cream ? 1.72 : 1.86;
  const lp = [[0, 0.22]];
  for (let i = 0; i <= 16; i++) { const y = 0.22 + ((top - 0.22) * i) / 16; lp.push([rOut(y) - wall - 0.012, y]); }
  lp.push([rOut(top) - wall - 0.012, top], [0.3, top], [0, top]);
  const lg = smooth(lathe(lp, 64));
  const lo = C(liqLo), hi = C(liqHi);
  paint(lg, (c, x, y, z) => {
    const t = smoothstep(0.22, top, y);
    c.lerpColors(lo, hi, Math.pow(t, 1.3)).multiplyScalar(0.94 + fbm(x * 3, y * 3, z * 3, 1) * 0.12);
  });
  const liquid = new THREE.Mesh(lg, phys('#ffffff', { vertexColors: true, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  group.add(liquid);

  /* ---- whipped cream swirl ---- */
  let topY = top;
  if (cream) {
    const creamMat = phys('#fff3e0', { roughness: 0.42, clearcoat: 0.25, sheen: 0.6, sheenColor: C('#ffffff') });
    const swirl = [{ r: 0.58, t: 0.17 }, { r: 0.46, t: 0.16 }, { r: 0.34, t: 0.14 }, { r: 0.22, t: 0.12 }, { r: 0.1, t: 0.1 }];
    let y = top + 0.02;
    swirl.forEach((s, i) => {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(s.r, s.t, 18, 56), creamMat);
      tor.rotation.x = Math.PI / 2; tor.position.y = y; tor.rotation.z = i * 0.7;
      group.add(tor);
      if (topping === 'choco' && i < 3) {
        const d = new THREE.Mesh(new THREE.TorusGeometry(s.r + 0.004, 0.028, 8, 56, TAU * 0.8), phys('#3b1c0e', { roughness: 0.2, clearcoat: 1 }));
        d.rotation.x = Math.PI / 2; d.position.y = y + s.t * 0.7; d.rotation.z = i * 1.9; group.add(d);
      }
      y += s.t * 1.25;
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 24), creamMat);
    tip.position.y = y + 0.05; group.add(tip);
    topY = y + 0.1;
  }
  if (topping === 'cherry') {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), phys('#c4102a', { roughness: 0.12, clearcoat: 1 }));
    ch.position.set(0.02, topY + 0.1, 0.02); group.add(ch);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.02, topY + 0.2, 0.02), new THREE.Vector3(0.06, topY + 0.36, 0.0), new THREE.Vector3(0.16, topY + 0.44, -0.04)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.012, 6), std('#4b6b2a', { roughness: 0.6 })));
  }
  if (topping === 'mango') {
    const g = new RoundedBoxGeometry(0.2, 0.2, 0.2, 3, 0.05);
    const items = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * TAU, r = i === 5 ? 0.0 : 0.32;
      return { p: [Math.cos(a) * r, top + 0.09 + (i === 5 ? 0.13 : 0), Math.sin(a) * r], r: [rand() * 0.6, rand() * TAU, rand() * 0.6] };
    });
    group.add(instanced(g, phys('#ffb21f', { roughness: 0.25, clearcoat: 0.8 }), items));
    topY = top + 0.3;
  }

  /* ---- straw ---- */
  const strawTex = canvasTexture(32, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = strawCol;
    for (let i = -1; i < 12; i++) { g.beginPath(); g.moveTo(0, i * 24 + 24); g.lineTo(w, i * 24); g.lineTo(w, i * 24 + 12); g.lineTo(0, i * 24 + 36); g.fill(); }
  }, { wrap: true, repeat: [1, 1] });
  const sLen = topY + 0.9 - 0.3;
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, sLen, 16), std('#ffffff', { map: strawTex, roughness: 0.35 }));
  straw.position.set(0.14 + Math.sin(0.16) * sLen * 0.5 * 0.0, 0.3 + sLen / 2, -0.08);
  straw.rotation.z = -0.13; straw.rotation.x = 0.05;
  group.add(straw);

  group.rotation.y = 0.4;
  return { group, tilt: { x: 0.0, z: 0 } };
}
