/* Menu-card 3D:
   1. every dish is rendered once to a transparent picture (fast, light on phones)
   2. on hover (mouse devices) the card turns live and the dish follows the pointer
   3. click / tap opens the full viewer                                              */
import {
  createRenderer, createScene, makeCamera, placeCamera, fitDistance, resizeTo,
  Showpiece, buildItemModel, viewFor, reducedMotion, canHover,
} from './stage.js';

const SIZE = 512;

/* ----------------------------------------------------------- picture factory */
export class Thumbs {
  constructor(theme) {
    this.canvas = document.createElement('canvas');
    this.renderer = createRenderer({ canvas: this.canvas, maxDpr: 1 });
    this.scene = createScene(this.renderer, theme);
    this.camera = makeCamera(26);
    resizeTo(this.renderer, this.camera, SIZE, SIZE);
    this.queue = [];
    this.running = false;
    this.paused = false;
    this.urls = new Map();
    this.onThumb = () => {};
  }

  async make(item) {
    const built = await buildItemModel(item);
    const piece = new Showpiece(built);
    const v = viewFor(item);
    piece.setSpin(v.yaw);
    this.scene.add(piece.root);
    placeCamera(this.camera, fitDistance(this.camera, piece.radius, 1.04), v.elevation);
    this.renderer.render(this.scene, this.camera);
    const url = this.canvas.toDataURL('image/png');
    this.scene.remove(piece.root);
    piece.dispose();
    return url;
  }

  enqueue(items) {
    items.forEach((it) => { if (!this.urls.has(it.id) && !this.queue.includes(it)) this.queue.push(it); });
    this.pump();
  }
  prioritize(id) {
    const i = this.queue.findIndex((q) => q.id === id);
    if (i > 0) this.queue.unshift(this.queue.splice(i, 1)[0]);
  }
  async pump() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      if (this.paused) { await new Promise((r) => setTimeout(r, 120)); continue; }
      const item = this.queue.shift();
      try {
        const url = await this.make(item);
        this.urls.set(item.id, url);
        this.onThumb(item, url);
      } catch (e) { console.warn('[3D] thumbnail failed for', item.id, e); }
      await new Promise((r) => setTimeout(r, 24));     // let the page breathe between dishes
    }
    this.running = false;
  }
}

/* ----------------------------------------------------------- hover (live) view */
export class LiveHover {
  constructor(theme) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dish__art dish__live';
    this.renderer = createRenderer({ canvas: this.canvas, maxDpr: 2 });
    this.scene = createScene(this.renderer, theme);
    this.camera = makeCamera(26);
    this.pieces = new Map();
    this.order = [];
    this.stage = null; this.token = 0; this.raf = 0;
    this.px = 0; this.off = 0; this.offT = 0; this.t = 0; this.last = 0;
  }

  async piece(item) {
    let p = this.pieces.get(item.id);
    if (p) return p;
    p = new Showpiece(await buildItemModel(item));
    this.pieces.set(item.id, p);
    this.order.push(item.id);
    if (this.order.length > 6) { const old = this.order.shift(); this.pieces.get(old)?.dispose(); this.pieces.delete(old); }
    return p;
  }

  async attach(stage, item) {
    const token = ++this.token;
    const piece = await this.piece(item);
    if (token !== this.token) return;
    this.stage = stage;
    this.item = item;
    this.cur = piece;
    this.view = viewFor(item);
    this.scene.add(piece.root);
    this.off = 0; this.offT = 0; this.t = 0; this.last = performance.now();
    stage.appendChild(this.canvas);
    this.resize();
    this.frame(0);
    requestAnimationFrame(() => this.canvas.classList.add('is-on'));
    cancelAnimationFrame(this.raf);
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  resize() {
    const w = this.canvas.clientWidth || this.stage.clientWidth, h = this.canvas.clientHeight || w;
    resizeTo(this.renderer, this.camera, w, h);
    placeCamera(this.camera, fitDistance(this.camera, this.cur.radius, 1.04), this.view.elevation);
  }

  frame(dt) {
    this.t += dt;
    this.off += (this.offT - this.off) * Math.min(1, dt * 6);
    const auto = reducedMotion() ? 0 : this.t * 0.7;
    this.cur.setSpin(this.view.yaw + auto + this.off);
    this.renderer.render(this.scene, this.camera);
  }

  /** pointer position inside the stage, -1 .. 1 */
  point(x) { this.offT = x * 1.5; }

  detach() {
    this.token++;
    cancelAnimationFrame(this.raf);
    if (this.cur) { this.scene.remove(this.cur.root); this.cur = null; }
    const c = this.canvas;
    c.classList.remove('is-on');
    setTimeout(() => { if (!c.classList.contains('is-on') && c.parentNode) c.parentNode.removeChild(c); }, 220);
    this.stage = null;
  }
}

/* ----------------------------------------------------------- wire up the page */
export function initCards(MN, { thumbs, live }) {
  const items = MN.data.menu || [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const stages = [...document.querySelectorAll('[data-stage]')];

  const setImg = (id, url) => {
    document.querySelectorAll(`[data-stage="${id}"], [data-thumb-for="${id}"]`).forEach((el) => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (!img) return;
      img.src = url;
      img.decode?.().catch(() => {}).finally(() => el.classList.add('is-ready'));
    });
  };
  thumbs.onThumb = (item, url) => setImg(item.id, url);

  // anything on screen first, then the rest in menu order
  const seen = new Set();
  const comboIds = (MN.data.combos || []).flatMap((c) => c.items);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.stage || e.target.dataset.thumbFor;
      if (id && !seen.has(id)) { seen.add(id); thumbs.prioritize(id); }
      io.unobserve(e.target);
    });
  }, { rootMargin: '400px 0px' });
  document.querySelectorAll('[data-stage], [data-thumb-for]').forEach((el) => io.observe(el));

  const wanted = [...items].filter((i) => document.querySelector(`[data-stage="${i.id}"]`) || comboIds.includes(i.id));
  thumbs.enqueue(wanted);

  /* hover -> live 3D (mouse only) */
  if (canHover()) {
    let current = null;
    document.addEventListener('pointerover', (e) => {
      const stage = e.target.closest && e.target.closest('[data-stage]');
      if (!stage || stage === current || e.pointerType === 'touch') return;
      current = stage;
      const item = byId.get(stage.dataset.stage);
      if (!item) return;
      thumbs.paused = true;
      live.attach(stage, item);
    });
    document.addEventListener('pointerout', (e) => {
      const stage = e.target.closest && e.target.closest('[data-stage]');
      if (!stage || stage !== current) return;
      if (e.relatedTarget && stage.contains(e.relatedTarget)) return;
      current = null;
      live.detach();
      thumbs.paused = false;
    });
    document.addEventListener('pointermove', (e) => {
      if (!current) return;
      const r = current.getBoundingClientRect();
      live.point(((e.clientX - r.left) / r.width) * 2 - 1);
    }, { passive: true });
    window.addEventListener('resize', () => { if (live.stage) live.resize(); });
  }

  /* click on the picture opens the viewer */
  stages.forEach((s) => s.addEventListener('click', () => MN.open3D && MN.open3D(s.dataset.stage)));
}
