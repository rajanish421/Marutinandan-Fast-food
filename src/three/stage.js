/* Shared 3D plumbing: renderer, lights, "Showpiece" wrapper, GLB loading. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildProcedural } from './models/index.js';
import { blobTexture, disposeObject, lerp } from './common.js';

export { THREE };

export const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = () => window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ renderer */
export function createRenderer({ canvas, maxDpr = 2, antialias = true, alpha = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, alpha, antialias, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.08;
  r.setClearColor(0x000000, 0);
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  return r;
}

/** Scene with a soft studio environment + neon-coloured rim lights (brand colours). */
export function createScene(renderer, theme = {}) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#fff1e0', 2.4);
  key.position.set(3.2, 6.5, 4.5);
  const rim1 = new THREE.DirectionalLight(theme.primary || '#ff2e93', 3.2);
  rim1.position.set(-5, 2.5, -3.5);
  const rim2 = new THREE.DirectionalLight(theme.secondary || '#ffd23f', 1.9);
  rim2.position.set(5.5, 1.5, -3);
  const fill = new THREE.HemisphereLight('#ffffff', theme.tertiary || '#8b5cf6', 0.45);
  scene.add(key, rim1, rim2, fill);
  scene.userData.lights = { key, rim1, rim2, fill };
  return scene;
}

export function makeCamera(fov = 30) {
  return new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
}

/** Put camera at `distance` looking at the origin, with an elevation angle (radians). */
export function placeCamera(camera, distance, elevation = 0.22, azimuth = 0) {
  camera.position.set(
    Math.sin(azimuth) * Math.cos(elevation) * distance,
    Math.sin(elevation) * distance,
    Math.cos(azimuth) * Math.cos(elevation) * distance
  );
  camera.lookAt(0, 0, 0);
}

/** Distance at which a sphere of `radius` fits in view (works for portrait & landscape). */
export function fitDistance(camera, radius, margin = 1.08) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  return (radius * margin) / Math.sin(Math.min(vfov, hfov) / 2);
}

export function resizeTo(renderer, camera, w, h) {
  w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------------ Showpiece */
/**
 * Wraps a built model so every dish is centred, tilted for a good viewing angle,
 * spin-able around Y, and has a soft contact shadow.
 *   root  -> add this to your scene
 *   spin  -> rotation.y turns the dish
 */
const SHADOW_K = 1.4;   // shadow plane size = dish size x this
export class Showpiece {
  constructor(built, { shadow = true } = {}) {
    this.built = built;
    this.root = new THREE.Group();
    this.pivot = new THREE.Group();
    this.spin = new THREE.Group();
    this.inner = new THREE.Group();
    this.inner.add(built.group);
    this.spin.add(this.inner);
    this.pivot.add(this.spin);
    this.root.add(this.pivot);

    const t = built.tilt || { x: 0, z: 0 };
    this.pivot.rotation.set(t.x || 0, 0, t.z || 0);

    // centre the dish on the origin of the spin axis
    this.spin.rotation.y = 0;
    const b0 = new THREE.Box3().setFromObject(built.group);
    this.inner.position.copy(b0.getCenter(new THREE.Vector3())).negate();
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.pivot);
    const size = box.getSize(new THREE.Vector3());
    this.box = box;
    this.size = size;
    const r1 = Math.hypot(size.x, size.z) / 2, r2 = size.y / 2;
    this.radius = Math.sqrt(r1 * r1 + r2 * r2) * 0.84;     // bounding "view" radius
    this.supportsExplode = typeof built.setExplode === 'function';
    this.explode = 0;

    if (shadow) {
      const s = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.85 })
      );
      s.rotation.x = -Math.PI / 2;
      s.scale.setScalar(Math.max(size.x, size.z) * SHADOW_K);
      s.position.y = box.min.y - 0.03;
      s.renderOrder = -1;
      this.shadow = s;
      this.root.add(s);
    }
  }
  setSpin(y) { this.spin.rotation.y = y; }
  setExplode(f) {
    this.explode = f;
    if (!this.supportsExplode) return;
    this.built.setExplode(f);
    const k = this.built.explodeShrink ?? 1;
    this.pivot.scale.setScalar(lerp(1, k, f));
    if (this.shadow) this.shadow.scale.setScalar(Math.max(this.size.x, this.size.z) * SHADOW_K * lerp(1, k, f));
  }
  /** Scale the whole thing so its view radius equals `r`. */
  normalize(r) { this.root.scale.setScalar(r / this.radius); return this; }
  dispose() { disposeObject(this.root); }
}

/* ------------------------------------------------------------------ model source */
let gltfLoader;
function loadGLB(url) {
  gltfLoader = gltfLoader || new GLTFLoader();
  return new Promise((resolve, reject) => gltfLoader.load(url, resolve, undefined, reject));
}

/** Real .glb file -> same shape as a procedural model (base on y=0, ~2.4 units tall/wide). */
async function buildFromGLB(url) {
  const gltf = await loadGLB(url);
  const obj = gltf.scene;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const k = 2.4 / Math.max(size.x, size.y, size.z, 1e-3);
  obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.set(-c.x, -b2.min.y, -c.z);
  const group = new THREE.Group();
  group.add(obj);
  return { group, tilt: { x: 0.1, z: 0 } };
}

/**
 * Menu item -> built model.
 *  - item.modelUrl  (your real .glb)  wins if present and loads fine
 *  - otherwise the procedural model for item.model + item.modelOptions
 */
export async function buildItemModel(item) {
  if (item.modelUrl) {
    try { return await buildFromGLB(item.modelUrl); }
    catch (e) { console.warn('[3D] GLB load failed, using built-in model:', item.modelUrl, e); }
  }
  return buildProcedural(item.model || 'burger', item.modelOptions || {});
}

/** Per-item view settings. */
export function viewFor(item) {
  const m = item.model || 'burger';
  return {
    elevation: { burger: 0.2, fries: 0.3, shake: 0.18, roll: 0.26, sandwich: 0.34, pizza: 0.08, momos: 0.1, chowmein: 0.1 }[m] ?? 0.22,
    yaw: -0.55,
  };
}
