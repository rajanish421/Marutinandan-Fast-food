/* Home-page hero: the signature burger in the middle (drag to spin) and a few
   more dishes floating around it. Click any dish to open it in the 3D viewer. */
import {
  THREE, createRenderer, createScene, makeCamera, placeCamera, resizeTo,
  Showpiece, buildItemModel, viewFor, reducedMotion,
} from './stage.js';

const SLOTS = [
  { x: 0,     y: -0.02, z: 0,    r: 1,    spin: 0.32 },   // main
  { x: -0.72, y: 0.62,  z: -1.3, r: 0.48, spin: -0.5 },
  { x: 0.74,  y: 0.68,  z: -0.9, r: 0.5,  spin: 0.45 },
  { x: -0.76, y: -0.56, z: 0.3,  r: 0.46, spin: 0.4 },
  { x: 0.72,  y: -0.5,  z: 0.7,  r: 0.46, spin: -0.42 },
];
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class Hero {
  constructor(MN, host) {
    this.MN = MN;
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hero__canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(this.canvas);

    this.renderer = createRenderer({ canvas: this.canvas, maxDpr: 2 });
    this.scene = createScene(this.renderer, MN.data.theme);
    this.camera = makeCamera(28);
    this.camera.userData.el = 0.13;
    this.items = [];
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.px = 0; this.py = 0; this.pxS = 0; this.pyS = 0;
    this.hover = -1; this.dragging = false; this.spinMain = 0; this.spinV = 0;
    this.t = 0; this.introAt = null; this.visible = true; this.last = performance.now();

    this.tip = document.createElement('div');
    this.tip.className = 'hero__tip';
    this.tip.hidden = true;
    host.appendChild(this.tip);

    this.bind();
    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { threshold: 0 }).observe(host);
    document.addEventListener('visibilitychange', () => { this.last = performance.now(); });
  }

  async load() {
    const byId = new Map((this.MN.data.menu || []).map((i) => [i.id, i]));
    const ids = (this.MN.data.hero && this.MN.data.hero.showcase) || [];
    const list = ids.map((id) => byId.get(id)).filter(Boolean).slice(0, SLOTS.length);
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const piece = new Showpiece(await buildItemModel(item));
      const view = viewFor(item);
      piece.setSpin(view.yaw);
      this.scene.add(piece.root);
      this.items.push({ item, piece, slot: SLOTS[i], view, phase: i * 1.7, k: 0, hoverK: 0, x: 0, y: 0, z: 0, r: 1 });
      this.layout();
      this.renderOnce();
      await new Promise((r) => setTimeout(r, 0));
    }
    if (reducedMotion()) this.introAt = -10;
    this.start();
  }

  /** called when the preloader is gone */
  intro() { this.introAt = this.t; }

  /* ------------------------------------------------------------ layout */
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (w < 4 || h < 4) return;
    resizeTo(this.renderer, this.camera, w, h);
    this.layout();
    this.renderOnce();
  }

  layout() {
    const cam = this.camera, dist = 15;
    placeCamera(cam, dist, cam.userData.el);
    const hy = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const hx = hy * cam.aspect;
    const portrait = cam.aspect < 0.95;
    const R = Math.min(1.95, hx * 0.54, hy * 0.5);
    this.items.forEach((it, i) => {
      const s = it.slot;
      const narrow = portrait ? 0.9 : 1;
      it.r = R * s.r * (i === 0 ? (portrait ? 1.3 : 1.6) : (portrait ? 0.95 : 1.08));   // main dish ~60% bigger so 3D is the hero
      it.x = s.x * hx * narrow;
      it.y = s.y * hy * (portrait && i ? 1.05 : 1);
      it.z = s.z;
      it.show = !(portrait && i > 2);
      it.piece.root.visible = it.show;
      it.piece.normalize(it.r);
    });
    this.hx = hx; this.hy = hy;
  }

  /* ------------------------------------------------------------ input */
  bind() {
    const el = this.canvas;
    let down = null;
    const toNdc = (e) => {
      const r = el.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      return r;
    };
    const pick = () => {
      this.ray.setFromCamera(this.ndc, this.camera);
      let best = -1, bestD = Infinity;
      this.items.forEach((it, i) => {
        if (!it.show || it.k < 0.6) return;
        const hit = this.ray.intersectObject(it.piece.pivot, true)[0];
        if (hit && hit.distance < bestD) { best = i; bestD = hit.distance; }
      });
      return best;
    };
    el.addEventListener('pointermove', (e) => {
      const r = toNdc(e);
      this.px = this.ndc.x; this.py = this.ndc.y;
      if (down && down.main) {
        const dx = e.clientX - down.x;
        down.moved = Math.max(down.moved, Math.abs(dx) + Math.abs(e.clientY - down.y));
        this.spinMain += dx * 0.012; this.spinV = dx * 0.012;
        down.x = e.clientX; down.y = e.clientY;
        return;
      }
      if (e.pointerType === 'touch') return;
      const h = pick();
      this.setHover(h, r);
    });
    el.addEventListener('pointerdown', (e) => {
      toNdc(e);
      const h = pick();
      down = { x: e.clientX, y: e.clientY, moved: 0, hit: h, main: h === 0 };
      if (down.main) { try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } this.dragging = true; el.classList.add('is-grabbing'); }
    });
    const end = (e) => {
      if (!down) return;
      const d = down; down = null;
      this.dragging = false; el.classList.remove('is-grabbing');
      if (d.hit >= 0 && d.moved < 8 && e.type === 'pointerup') {
        const it = this.items[d.hit];
        if (it && this.MN.open3D) this.MN.open3D(it.item.id);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', () => { if (!down) this.setHover(-1); this.px = 0; this.py = 0; });
  }

  setHover(i, rect) {
    if (i === this.hover) return;
    this.hover = i;
    this.canvas.style.cursor = i >= 0 ? 'pointer' : '';
    if (i < 0) { this.tip.hidden = true; return; }
    const it = this.items[i];
    this.tip.hidden = false;
    this.tip.innerHTML = `<strong></strong><span>View in 3D</span>`;
    this.tip.firstChild.textContent = it.item.name;
  }

  placeTip() {
    if (this.hover < 0) return;
    const it = this.items[this.hover];
    const v = new THREE.Vector3(it.x, it.y - it.r * 0.9, it.z).project(this.camera);
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.tip.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, 8px)`;
  }

  /* ------------------------------------------------------------ loop */
  renderOnce() { if (this.items.length) this.renderer.render(this.scene, this.camera); }

  start() {
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (!this.visible || document.hidden) return;
      this.tick(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  tick(dt) {
    const still = reducedMotion();
    this.t += dt;
    this.pxS += (this.px - this.pxS) * Math.min(1, dt * 3);
    this.pyS += (this.py - this.pyS) * Math.min(1, dt * 3);
    if (!this.dragging) { this.spinMain += this.spinV; this.spinV *= Math.pow(0.03, dt); }

    this.items.forEach((it, i) => {
      // entrance
      const delay = i === 0 ? 0 : 0.25 + i * 0.12;
      const k = this.introAt == null ? 0 : clamp01((this.t - this.introAt - delay) / (i === 0 ? 1.1 : 0.8));
      it.k = k;
      const e = k <= 0 ? 0 : easeOutBack(k);
      it.hoverK += ((i === this.hover ? 1 : 0) - it.hoverK) * Math.min(1, dt * 10);

      const float = still ? 0 : Math.sin(this.t * (0.9 + i * 0.13) + it.phase) * 0.13 * (i ? 1 : 0.7);
      const drop = (1 - e) * (i === 0 ? 3.2 : 1.4);
      it.piece.root.position.set(it.x + this.pxS * 0.25 * (i ? 1.4 : 0.5), it.y + float + drop, it.z);
      it.piece.root.scale.setScalar((it.r / it.piece.radius) * Math.max(0.0001, e) * (1 + it.hoverK * 0.1));

      const base = it.view.yaw + (still ? 0 : this.t * it.slot.spin);
      it.piece.setSpin(base + (i === 0 ? this.spinMain + this.pxS * 0.35 : this.pxS * 0.5));
    });

    this.scene.rotation.x = -this.pyS * 0.05;
    this.renderer.render(this.scene, this.camera);
    this.placeTip();
  }
}

export async function initHero(MN) {
  const host = document.querySelector('[data-hero3d]');
  if (!host) return null;
  const hero = new Hero(MN, host);
  MN.hero = hero;
  await hero.load();
  return hero;
}
