/* Full-screen 3D viewer: drag to rotate, wheel / pinch to zoom, explode, layer chips. */
import {
  createRenderer, createScene, makeCamera, placeCamera, fitDistance, resizeTo,
  Showpiece, buildItemModel, viewFor, reducedMotion,
} from './stage.js';
import { layerInfo, TAG_LABELS } from '../shared/labels.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ICON = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  spin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
  explode: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M5 9l7-3 7 3-7 3zM5 15l7 3 7-3"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11m0-1V5a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v5.5A6.5 6.5 0 0 1 10.5 20h-.4a6 6 0 0 1-4.6-2.1L3 14.6a1.6 1.6 0 0 1 2.4-2L8 15"/></svg>',
};

export class Viewer {
  constructor(MN) {
    this.MN = MN;
    this.items = MN.data.menu || [];
    this.theme = MN.data.theme || {};
    this.index = -1;
    this.renderer = null;
    this.open = false;
    this.build();
  }

  /* ---------------------------------------------------------------- DOM */
  build() {
    const d = document.createElement('dialog');
    d.className = 'viewer';
    d.id = 'viewer';
    d.setAttribute('aria-label', '3D dish viewer');
    d.innerHTML = `
      <div class="viewer__panel">
        <button class="viewer__close" type="button" aria-label="Close 3D viewer">${ICON.close}</button>
        <div class="viewer__stage" data-vstage>
          <div class="viewer__loading">Loading 3D…</div>
          <p class="viewer__hint">${ICON.hand}<span>Drag to rotate. Scroll or pinch to zoom.</span></p>
          <button class="viewer__nav viewer__nav--prev" type="button" aria-label="Previous dish">${ICON.prev}</button>
          <button class="viewer__nav viewer__nav--next" type="button" aria-label="Next dish">${ICON.next}</button>
        </div>
        <div class="viewer__info">
          <div class="viewer__meta"><span class="veg" data-v="veg"></span><span data-v="cat"></span><span class="viewer__tags" data-v="tags"></span></div>
          <h2 class="viewer__title" data-v="title"></h2>
          <p class="viewer__desc" data-v="desc"></p>
          <div class="viewer__layers" data-v="layers" hidden></div>
          <div class="viewer__tools">
            <button type="button" class="tool" data-tool="spin" aria-pressed="true">${ICON.spin}<span>Auto-spin</span></button>
            <button type="button" class="tool" data-tool="explode" aria-pressed="false">${ICON.explode}<span>Explode</span></button>
            <button type="button" class="tool" data-tool="reset">${ICON.reset}<span>Reset</span></button>
          </div>
          <div class="viewer__buy">
            <span class="price" data-v="price"></span>
            <button type="button" class="btn btn--primary" data-v="add">Add to order</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(d);
    this.el = d;
    this.stageEl = d.querySelector('[data-vstage]');
    this.q = (k) => d.querySelector(`[data-v="${k}"]`);
    this.tools = {
      spin: d.querySelector('[data-tool="spin"]'),
      explode: d.querySelector('[data-tool="explode"]'),
      reset: d.querySelector('[data-tool="reset"]'),
    };

    d.querySelector('.viewer__close').addEventListener('click', () => this.close());
    d.addEventListener('click', (e) => { if (e.target === d) this.close(); });
    d.addEventListener('cancel', (e) => { e.preventDefault(); this.close(); });
    d.querySelector('.viewer__nav--prev').addEventListener('click', () => this.step(-1));
    d.querySelector('.viewer__nav--next').addEventListener('click', () => this.step(1));
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.step(-1);
      if (e.key === 'ArrowRight') this.step(1);
    });

    this.tools.spin.addEventListener('click', () => { this.autoSpin = !this.autoSpin; this.syncTools(); });
    this.tools.explode.addEventListener('click', () => { this.explodeT = this.explodeT > 0.5 ? 0 : 1; this.syncTools(); });
    this.tools.reset.addEventListener('click', () => this.resetView());

    this.q('add').addEventListener('click', (e) => {
      const it = this.items[this.index];
      if (!it || it.soldOut) return;
      this.MN.cart && this.MN.cart.add(it.id);
      const b = e.currentTarget;
      b.classList.add('is-done'); b.textContent = 'Added ✓';
      clearTimeout(this._addT);
      this._addT = setTimeout(() => { b.classList.remove('is-done'); b.textContent = 'Add to order'; }, 1400);
    });

    this.q('layers').addEventListener('pointerover', (e) => { const c = e.target.closest('[data-layer]'); if (c) this.glow(+c.dataset.layer); });
    this.q('layers').addEventListener('pointerleave', () => this.glow(-1));
    this.q('layers').addEventListener('focusin', (e) => { const c = e.target.closest('[data-layer]'); if (c) this.glow(+c.dataset.layer); });
    this.q('layers').addEventListener('focusout', () => this.glow(-1));
    this.q('layers').addEventListener('click', (e) => {
      const c = e.target.closest('[data-layer]'); if (!c) return;
      this.explodeT = 1; this.syncTools(); this.glow(+c.dataset.layer);
    });

    this.bindPointer();
  }

  syncTools() {
    this.tools.spin.setAttribute('aria-pressed', String(!!this.autoSpin));
    this.tools.explode.setAttribute('aria-pressed', String(this.explodeT > 0.5));
  }

  /* ---------------------------------------------------------------- input */
  bindPointer() {
    const el = this.stageEl;
    this.ptrs = new Map();
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      el.setPointerCapture(e.pointerId);
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragging = true; this.idle = 0;
      if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch0 = Math.hypot(a.x - b.x, a.y - b.y); this.zoom0 = this.zoom; }
      el.classList.add('is-grabbing');
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.ptrs.size === 1) {
        this.yaw += dx * 0.011; this.yawV = dx * 0.011;
        this.elev = clamp(this.elev + dy * 0.006, -0.1, 1.25);
      } else if (this.ptrs.size === 2) {
        const [a, b] = [...this.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.zoomT = clamp(this.zoom0 * (this.pinch0 / Math.max(d, 1)), 0.55, 1.7);
      }
      this.idle = 0;
    });
    const up = (e) => {
      this.ptrs.delete(e.pointerId);
      if (!this.ptrs.size) { this.dragging = false; el.classList.remove('is-grabbing'); }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomT = clamp(this.zoomT * Math.exp(e.deltaY * 0.0012), 0.55, 1.7);
      this.idle = 0;
    }, { passive: false });
    el.addEventListener('dblclick', () => this.resetView());
  }

  resetView() {
    const v = this.view;
    this.yawT = v.yaw; this.elevT = v.elevation; this.zoomT = 1; this.explodeT = 0; this.yawV = 0;
    this.yaw = this.yaw % (Math.PI * 2);
    this.syncTools();
    this.glow(-1);
  }

  /* ---------------------------------------------------------------- show / hide */
  ensureRenderer() {
    if (this.renderer) return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'viewer__canvas';
    this.stageEl.insertBefore(this.canvas, this.stageEl.firstChild);
    this.renderer = createRenderer({ canvas: this.canvas, maxDpr: 2 });
    this.scene = createScene(this.renderer, this.theme);
    this.camera = makeCamera(28);
    new ResizeObserver(() => this.resize()).observe(this.stageEl);
  }

  resize() {
    if (!this.renderer) return;
    const w = this.stageEl.clientWidth, h = this.stageEl.clientHeight;
    if (w < 4 || h < 4) return;
    resizeTo(this.renderer, this.camera, w, h);
    if (this.piece) this.baseDist = fitDistance(this.camera, this.piece.radius, 1.12);
  }

  async show(id) {
    const index = this.items.findIndex((i) => i.id === id);
    if (index < 0) return;
    const item = this.items[index];
    this.index = index;
    this.ensureRenderer();

    if (!this.el.open) {
      this.lastFocus = document.activeElement;
      this.el.showModal();
      document.documentElement.classList.add('is-modal');
      requestAnimationFrame(() => this.el.classList.add('is-open'));
    }
    this.open = true;
    this.fill(item);
    this.stageEl.classList.add('is-loading');
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
    this.resize();

    const token = (this.token = (this.token || 0) + 1);
    const built = await buildItemModel(item);
    if (token !== this.token || !this.open) return;

    if (this.piece) { this.scene.remove(this.piece.root); this.piece.dispose(); }
    this.piece = new Showpiece(built);
    this.scene.add(this.piece.root);
    this.view = viewFor(item);
    this.baseDist = fitDistance(this.camera, this.piece.radius, 1.12);

    this.autoSpin = !reducedMotion();
    this.yaw = this.view.yaw - Math.PI * 1.2; this.yawT = null;   // spins in on open
    this.yawV = 0;
    this.elev = this.view.elevation;
    this.zoom = 0.7; this.zoomT = 1;
    this.explode = 0; this.explodeT = 0;
    this.intro = 0; this.idle = 0;
    this.syncTools();

    const supports = this.piece.supportsExplode;
    this.tools.explode.hidden = !supports;
    this.buildChips(item);

    this.stageEl.classList.remove('is-loading');
    this.start();
  }

  fill(item) {
    const cat = (this.MN.data.categories || []).find((c) => c.id === item.category);
    const veg = this.q('veg');
    veg.className = 'veg ' + (item.veg === false ? 'is-nonveg' : 'is-veg');
    veg.title = item.veg === false ? 'Non-vegetarian' : 'Vegetarian';
    this.q('cat').textContent = cat ? cat.name : '';
    this.q('tags').innerHTML = (item.tags || []).map((t) => `<span class="tag tag--${esc(t)}">${esc(TAG_LABELS[t] || t)}</span>`).join('');
    this.q('title').textContent = item.name;
    this.q('desc').textContent = item.description || '';
    this.q('price').textContent = this.MN.fmt ? this.MN.fmt(item.price) : item.price;
    const add = this.q('add');
    add.disabled = !!item.soldOut;
    add.classList.remove('is-done');
    add.textContent = item.soldOut ? 'Sold out' : 'Add to order';
    this.el.setAttribute('aria-label', `${item.name} in 3D`);
  }

  buildChips(item) {
    const box = this.q('layers');
    const parts = this.piece.built.parts;
    if (!parts || !this.piece.built.highlight) { box.hidden = true; box.innerHTML = ''; return; }
    const over = (this.MN.data.anatomy && this.MN.data.anatomy.labels) || {};
    box.hidden = false;
    box.innerHTML = '<span class="viewer__layers-title">Inside</span>' + parts
      .map((p, i) => ({ p, i }))
      .reverse()
      .map(({ p, i }) => `<button type="button" class="chip chip--layer" data-layer="${i}">${esc(layerInfo(p.key, over).name)}</button>`)
      .join('');
  }

  glow(i) {
    const b = this.piece && this.piece.built;
    if (!b || !b.highlight) return;
    b.highlight(i, i < 0 ? 0 : 0.85, this.theme.primary || '#ff2e93');
  }

  step(dir) {
    const cur = this.items[this.index];
    const same = this.items.filter((i) => i.category === cur.category);
    const list = same.length > 1 ? same : this.items;
    const at = list.findIndex((i) => i.id === cur.id);
    const next = list[(at + dir + list.length) % list.length];
    this.show(next.id);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.token++;
    this.el.classList.remove('is-open');
    const done = () => {
      if (this.el.open) this.el.close();
      document.documentElement.classList.remove('is-modal');
      this.stop();
      if (this.piece) { this.scene.remove(this.piece.root); this.piece.dispose(); this.piece = null; }
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus({ preventScroll: true });
    };
    setTimeout(done, reducedMotion() ? 0 : 280);
  }

  /* ---------------------------------------------------------------- loop */
  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.tick(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  tick(dt) {
    const p = this.piece;
    if (!p) return;
    this.intro = Math.min(1, this.intro + dt / 0.9);
    const k = ease(this.intro);

    // yaw: intro swing -> target, drag inertia, auto-spin
    if (this.yawT != null) {
      this.yaw += (this.yawT - this.yaw) * Math.min(1, dt * 7);
      if (Math.abs(this.yawT - this.yaw) < 0.002) this.yawT = null;
    } else if (this.intro < 1) {
      this.yaw += (this.view.yaw - this.yaw) * Math.min(1, dt * 4.5);
    }
    if (!this.dragging) {
      this.idle += dt;
      this.yaw += this.yawV; this.yawV *= Math.pow(0.02, dt);
      if (this.autoSpin && this.idle > 1.2 && this.yawT == null && this.intro >= 1) this.yaw += dt * 0.55;
    }
    if (this.elevT != null) { this.elev += (this.elevT - this.elev) * Math.min(1, dt * 7); if (Math.abs(this.elevT - this.elev) < 0.002) this.elevT = null; }
    this.zoom += (this.zoomT - this.zoom) * Math.min(1, dt * 8);
    this.explode += (this.explodeT - this.explode) * Math.min(1, dt * 5);
    if (p.supportsExplode && Math.abs(this.explode - p.explode) > 0.0005) p.setExplode(this.explode);

    p.setSpin(this.yaw);
    p.root.scale.setScalar(0.6 + 0.4 * k);
    placeCamera(this.camera, this.baseDist * this.zoom, this.elev);
    this.renderer.render(this.scene, this.camera);
  }
}

export function initViewer(MN) {
  const viewer = new Viewer(MN);
  MN.open3D = (id) => viewer.show(id);
  MN.viewer = viewer;
  return viewer;
}
