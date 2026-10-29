/* Shared helpers for all procedural food models (no UI code here). */
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;
export { THREE, mergeGeometries };

/* ---------- deterministic randomness so every render looks identical ---------- */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function h3(x, y, z, s) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(s, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967295;
}
const sm = (t) => t * t * (3 - 2 * t);
export function vnoise(x, y, z, s = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(h3(ix, iy, iz, s), h3(ix + 1, iy, iz, s), fx), l(h3(ix, iy + 1, iz, s), h3(ix + 1, iy + 1, iz, s), fx), fy),
    l(l(h3(ix, iy, iz + 1, s), h3(ix + 1, iy, iz + 1, s), fx), l(h3(ix, iy + 1, iz + 1, s), h3(ix + 1, iy + 1, iz + 1, s), fx), fy),
    fz
  );
}
export function fbm(x, y, z, s = 0) {
  return vnoise(x, y, z, s) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1, s + 7) * 0.28 + vnoise(x * 4.3, y * 4.3, z * 4.3, s + 13) * 0.12;
}
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => sm(clamp01((v - a) / (b - a)));

/* ---------- materials ---------- */
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
export const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...o });
export const col = (hex) => new THREE.Color(hex);

/* ---------- geometry helpers ---------- */
export function lathe(profile, seg = 64, phiStart = 0, phiLength = TAU) {
  return new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg, phiStart, phiLength);
}

/** Remove seams so displaced / painted geometry shades smoothly. */
export function smooth(geo) {
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  const g = mergeVertices(geo, 1e-4);
  g.computeVertexNormals();
  return g;
}

export function displace(geo, fn) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    fn(v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  return geo;
}

/** fn(color, x, y, z) -> mutate `color`. Writes linear vertex colours. */
export function paint(geo, fn) {
  const p = geo.attributes.position;
  const arr = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(c, p.getX(i), p.getY(i), p.getZ(i));
    arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** A rounded disc ("puck") - the basis of patties, tomato slices, plates, etc.
 *  Origin at the bottom centre, extends up by `h`. Smoothed, ready to displace/paint. */
export function puckGeometry(r, h, { bevel = Math.min(h * 0.45, r * 0.25), rings = 8, seg = 72 } = {}) {
  const b = Math.min(bevel, h / 2, r / 2);
  const pts = [[0, 0]];
  for (let i = 1; i <= 3; i++) pts.push([(r - b) * (i / 3), 0]);
  for (let i = 1; i <= 5; i++) { const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2); pts.push([r - b + Math.cos(a) * b, b + Math.sin(a) * b]); }
  if (h - b > b + 1e-4) pts.push([r, h - b]);
  for (let i = 1; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); pts.push([r - b + Math.cos(a) * b, h - b + Math.sin(a) * b]); }
  for (let i = 1; i <= rings; i++) pts.push([(r - b) * (1 - i / rings), h]);
  return smooth(lathe(pts, seg));
}

/** Frilly leaf-like disc (lettuce, sauce drizzle, etc.). Lies in XZ, origin at centre. */
export function frillyDisc({ radius = 1.1, rings = 14, seg = 120, frill = 0.12, wave = 0.07, waves = 9, seed = 1, droop = 0, thickness = 0.0 } = {}) {
  const pos = [], idx = [];
  const rand = rng(seed);
  const ph = [rand() * 6, rand() * 6, rand() * 6];
  for (let i = 0; i <= rings; i++) {
    const rho = i / rings;
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * TAU;
      const edge = radius * (1 + frill * (0.55 * Math.sin(7 * th + ph[0]) + 0.3 * Math.sin(13 * th + ph[1]) + 0.15 * Math.sin(23 * th + ph[2])));
      const r = rho * edge;
      const y = Math.pow(rho, 2) * wave * (Math.sin(waves * th + ph[0]) * 0.65 + Math.sin((waves + 6) * th + ph[1]) * 0.35) - Math.pow(rho, 3) * droop;
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
    }
  }
  const stride = seg + 1;
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * stride + j, b = a + 1, c = a + stride, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (thickness > 0) {
    // give it a lower skin so it has volume
    const g2 = g.clone();
    g2.translate(0, -thickness, 0);
    const i2 = g2.index.array; for (let k = 0; k < i2.length; k += 3) { const t = i2[k + 1]; i2[k + 1] = i2[k + 2]; i2[k + 2] = t; }
    g2.computeVertexNormals();
    return mergeGeometries([g, g2].map((x) => (x.attributes.uv && x.deleteAttribute('uv'), x)));
  }
  return g;
}

/* ---------- canvas textures ---------- */
export function canvasTexture(w, h, draw, { repeat, wrap = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}

let _blob;
export function blobTexture() {
  if (_blob) return _blob;
  _blob = canvasTexture(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    // tight, soft contact shadow (light background par bhi saaf dikhe, canvas ke kinare se kate nahi)
    gr.addColorStop(0, 'rgba(0,0,0,0.55)');
    gr.addColorStop(0.4, 'rgba(0,0,0,0.3)');
    gr.addColorStop(0.75, 'rgba(0,0,0,0.07)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return _blob;
}
let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTexture(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    gr.addColorStop(0.7, 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return _glow;
}

/* ---------- instancing helper ---------- */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
export function instanced(geo, mat, items) {
  // items: [{p:[x,y,z], r:[x,y,z] | q:Quaternion, s:number|[x,y,z], c: hex|Color}]
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => {
    _p.set(it.p[0], it.p[1], it.p[2]);
    if (it.q) _q.copy(it.q); else _q.setFromEuler(_e.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0));
    if (Array.isArray(it.s)) _s.set(it.s[0], it.s[1], it.s[2]); else _s.setScalar(it.s ?? 1);
    mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    if (it.c !== undefined) mesh.setColorAt(i, _c.set(it.c));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

/** Rounded triangle / polygon outline as THREE.Shape. */
export function roundedPolygon(points, r) {
  const n = points.length;
  const shape = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const p0 = points[(i + n - 1) % n], p1 = points[i], p2 = points[(i + 1) % n];
    const v1 = new THREE.Vector2(p0[0] - p1[0], p0[1] - p1[1]).normalize();
    const v2 = new THREE.Vector2(p2[0] - p1[0], p2[1] - p1[1]).normalize();
    const a = new THREE.Vector2(p1[0] + v1.x * r, p1[1] + v1.y * r);
    const b = new THREE.Vector2(p1[0] + v2.x * r, p1[1] + v2.y * r);
    if (i === 0) shape.moveTo(a.x, a.y); else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1[0], p1[1], b.x, b.y);
  }
  shape.closePath();
  return shape;
}

/** Mark every mesh in a group so highlight() can glow it. */
export function setGlow(obj, hex, amount) {
  obj.traverse((o) => {
    if (o.isMesh && o.material && 'emissive' in o.material) {
      if (!o.material.userData.__emissiveInit) { o.material.userData.__emissiveInit = true; o.material.emissive = new THREE.Color(0x000000); }
      o.material.emissive.set(hex).multiplyScalar(amount);
      o.material.emissiveIntensity = 1;
    }
  });
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
    }
  });
}
