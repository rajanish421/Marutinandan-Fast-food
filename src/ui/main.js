/* =====================================================================
   MAIN  -  poore page ko jodne wali file.

   Kya karti hai:
     1. data/shop-data.js padhti hai (window.SHOP_DATA)
     2. colours + SEO tags lagati hai
     3. page ka HTML banati hai (render.js)
     4. menu filter, order cart, open/closed status, map, mobile menu
     5. loading screen hatati hai, animations aur 3D chalu karti hai

   Build:  npm run build  ->  assets/js/app.js
   ===================================================================== */
import { renderApp } from './render.js';
import { initMotion } from './motion.js';
import { createCart } from './cart.js';
import { openStatus, money, dataHash, esc } from './util.js';
import { headTags, themeCss, themeMode, themeToggleOn } from './seo.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const root = document.documentElement;

const data = window.SHOP_DATA;

if (!data) {
  console.error('[Maruti Nandan] data/shop-data.js load nahi hui. index.html me <script src="data/shop-data.js"> hona chahiye.');
  const p = $('#preloader');
  if (p) p.remove();
} else {
  try { boot(); } catch (err) {
    console.error('[Maruti Nandan] page start nahi ho paya:', err);
    const p = $('#preloader');
    if (p) p.remove();
  }
}

function boot() {
  const ordering = !data.ordering || data.ordering.enabled !== false;
  const cur = (data.ordering && data.ordering.currency) || '₹';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MN = (window.MN = window.MN || {});
  MN.data = data;
  MN.fmt = (n) => money(n, cur);
  MN.introDone = false;

  /* ---------------------------------------------------------- 1. colours + SEO */
  let style = $('#mn-theme');
  if (!style) { style = document.createElement('style'); style.id = 'mn-theme'; document.head.appendChild(style); }
  style.textContent = themeCss(data);
  initTheme();

  // shop-data.js SEO build ke baad badli ho to tags browser me hi taza kar do
  const hash = dataHash(data);
  if (root.dataset.hash !== hash) {
    $$('[data-seo]').forEach((n) => n.remove());
    document.head.insertAdjacentHTML('beforeend', headTags(data));
    root.dataset.hash = hash;
  }
  root.lang = (data.site && data.site.language) || 'en-IN';

  /* ---------------------------------------------------------- 2. page */
  $('#app').innerHTML = renderApp(data);

  MN.cart = ordering ? createCart(MN) : null;
  const motion = (MN.motion = initMotion(MN));
  motion.prepare();

  wireNav();
  wireStatus();
  wireMap();
  wireMenu(motion);
  wireClicks(MN, motion);
  if (MN.cart) wireCart(MN, motion);
  load3D(MN);
  runPreloader(MN, motion, reduced);
  loadAnalytics();

  /* =========================================================== helpers */

  /* ---------- light / dark mode ----------
     Pehle visitor ki chuni hui mode (agar toggle on hai), nahi to data.theme.mode ("light" | "dark" | "auto"). */
  function initTheme() {
    const toggleOn = themeToggleOn(data);
    const read = () => { try { return localStorage.getItem('mn-theme'); } catch (e) { return null; } };
    const resolve = () => {
      const saved = toggleOn ? read() : null;
      if (saved === 'light' || saved === 'dark') return saved;
      const m = themeMode(data);
      return m === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : m;
    };
    const apply = (mode, save) => {
      root.setAttribute('data-theme', mode);
      if (save) { try { localStorage.setItem('mn-theme', mode); } catch (e) { /* private mode: ok */ } }
      const bg = getComputedStyle(root).getPropertyValue('--c-bg').trim();
      $$('meta[name="theme-color"]').forEach((el) => { el.removeAttribute('media'); if (bg) el.setAttribute('content', bg); });
      $$('[data-theme-toggle]').forEach((b) => {
        const dark = mode === 'dark';
        b.setAttribute('aria-pressed', String(dark));
        if (b.classList.contains('nav__theme')) b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        const l = $('[data-theme-label]', b);
        if (l) l.textContent = dark ? 'Light mode' : 'Dark mode';
      });
      window.dispatchEvent(new CustomEvent('mn:theme', { detail: { mode } }));
    };
    apply(resolve(), false);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-theme-toggle]')) return;
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------- mobile menu + current-section highlight ---------- */
  function wireNav() {
    const nav = $('[data-nav]');
    const toggle = $('[data-menu-toggle]');
    if (!nav || !toggle) return;
    const setOpen = (v) => {
      nav.classList.toggle('nav--open', v);
      root.classList.toggle('is-locked', v);
      toggle.setAttribute('aria-expanded', String(v));
      toggle.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
    $$('.nav__links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    matchMedia('(min-width: 881px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

    const links = $$('.nav__links a[href^="#"]');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-current'));
        const a = map.get(en.target.id);
        if (a) a.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- open / closed badge ---------- */
  function wireStatus() {
    const paint = () => {
      const s = openStatus(data.shop);
      $$('[data-status]').forEach((el) => {
        el.hidden = false;
        el.classList.toggle('is-open', s.open);
        el.classList.toggle('is-closed', !s.open);
        const t = $('[data-status-text]', el);
        if (t) t.textContent = el.classList.contains('status--nav') ? (s.short || s.text) : s.text;
      });
      $$('.hours__list li').forEach((li) => li.classList.toggle('is-today', (li.dataset.days || '').split(' ').includes(s.today)));
    };
    paint();
    setInterval(paint, 60000);
  }

  /* ---------- Google map loads only when you scroll near it ---------- */
  function wireMap() {
    const box = $('[data-map]');
    if (!box) return;
    const load = () => {
      if ($('iframe', box)) return;
      const f = document.createElement('iframe');
      f.src = box.dataset.map;
      f.title = `Map of ${data.shop.name}`;
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
    };
    if (!('IntersectionObserver' in window)) return load();
    const io = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '500px' });
    io.observe(box);
  }

  /* ---------- menu filters ---------- */
  function wireMenu(m) {
    const bar = $('[data-filters]');
    if (!bar) return;
    const dishes = $$('.dish');
    const chips = $$('[data-filter]', bar);
    const vegBox = $('[data-veg-only]', bar);
    const empty = $('[data-menu-empty]');
    let cat = 'all';
    const apply = () => {
      const vegOnly = !!(vegBox && vegBox.checked);
      const show = [], hide = [];
      dishes.forEach((d) => ((cat === 'all' || d.dataset.cat === cat) && (!vegOnly || d.dataset.veg === '1') ? show : hide).push(d));
      m.filter(show, hide);
      if (empty) empty.hidden = show.length > 0;
    };
    chips.forEach((c) => c.addEventListener('click', () => {
      cat = c.dataset.filter;
      chips.forEach((x) => { const on = x === c; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
      apply();
    }));
    if (vegBox) vegBox.addEventListener('change', apply);
  }

  /* ---------- clicks that are not about the cart ---------- */
  function wireClicks(M, m) {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-open3d]');
      if (el && M.open3D) { e.preventDefault(); M.open3D(el.dataset.open3d); }
    });
  }

  /* ---------- order cart + WhatsApp ---------- */
  function wireCart(M, m) {
    const cart = M.cart;
    const dlg = $('[data-cart]');
    const form = $('[data-cart-form]');
    const list = $('[data-cart-list]');
    const bar = $('.cartbar');
    const minEl = $('[data-cart-min]');
    if (!dlg || !form) return;

    const open = () => { if (!dlg.open) { dlg.showModal(); root.classList.add('is-modal'); } };
    const close = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener('close', () => root.classList.remove('is-modal'));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });

    // remember what the customer typed
    const saved = cart.loadForm();
    ['name', 'note'].forEach((k) => { const f = form.elements[k]; if (f && saved[k]) f.value = saved[k]; });
    const readForm = () => ({ name: (form.elements.name ? form.elements.name.value : '').trim(), note: (form.elements.note ? form.elements.note.value : '').trim() });
    form.addEventListener('input', () => cart.saveForm(readForm()));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cart.count) return;
      if (!cart.minOk()) { if (minEl) minEl.hidden = false; return; }
      const f = readForm();
      cart.saveForm(f);
      window.open(cart.whatsappUrl(f), '_blank', 'noopener');
    });

    document.addEventListener('click', (e) => {
      const t = e.target.closest('button, a');
      if (!t) return;
      const d = t.dataset;
      if (d.add) { cart.add(d.add); m.fly(t); }
      else if (d.addCombo) { cart.addCombo(d.addCombo); m.fly(t); }
      else if (d.inc) cart.inc('i:' + d.inc);
      else if (d.dec) cart.dec('i:' + d.dec);
      else if (d.lineInc) cart.inc(d.lineInc);
      else if (d.lineDec) cart.dec(d.lineDec);
      else if (d.lineRm) cart.remove(d.lineRm);
      else if (t.hasAttribute('data-cart-open')) open();
      else if (t.hasAttribute('data-cart-close')) close();
      else if (t.hasAttribute('data-cart-clear')) cart.clear();
    });

    const lineHtml = (l) => `
      <li class="line" data-line="${esc(l.key)}">
        <span class="line__ic" aria-hidden="true">${esc(l.icon)}</span>
        <div class="line__txt"><p class="line__name">${esc(l.name)}</p><p class="line__unit">${M.fmt(l.unit)} each</p></div>
        <span class="line__total">${M.fmt(l.total)}</span>
        <div class="line__ctl">
          <div class="stepper">
            <button type="button" data-line-dec="${esc(l.key)}" aria-label="One less ${esc(l.name)}">${icon('minus')}</button>
            <output>${l.qty}</output>
            <button type="button" data-line-inc="${esc(l.key)}" aria-label="One more ${esc(l.name)}">${icon('plus')}</button>
          </div>
          <button class="line__rm" type="button" data-line-rm="${esc(l.key)}" aria-label="Remove ${esc(l.name)}">${icon('trash')}</button>
        </div>
      </li>`;

    const snap = () => new Map(cart.lines.map((l) => [l.key, { qty: l.qty, name: l.name }]));
    let prev = snap();

    const sync = () => {
      const n = cart.count;
      $$('[data-cart-count]').forEach((b) => { b.textContent = n; b.hidden = !n; });
      $$('[data-qty-for]').forEach((box) => {
        const q = cart.qty(box.dataset.qtyFor);
        box.classList.toggle('is-in', q > 0);
        const st = $('.stepper', box);
        if (st) st.hidden = q === 0;
        const out = $('[data-qty-val]', box);
        if (out) out.textContent = q;
      });
      if (bar) {
        bar.hidden = !n;
        $('[data-cartbar-count]', bar).textContent = `${n} item${n === 1 ? '' : 's'}`;
        $('[data-cartbar-total]', bar).textContent = M.fmt(cart.total);
      }
      root.classList.toggle('has-cartbar', n > 0);
      dlg.classList.toggle('is-empty', !n);
      list.innerHTML = cart.lines.map(lineHtml).join('');
      $('[data-cart-total]', dlg).textContent = M.fmt(cart.total);
      if (minEl) minEl.hidden = cart.minOk() || !n;
    };

    cart.on(() => {
      const now = snap();
      sync();
      if (!dlg.open) {
        for (const [key, v] of now) {
          if (v.qty > ((prev.get(key) || {}).qty || 0)) { m.toast(`${v.name} added`, 'View order', open); break; }
        }
      }
      prev = now;
    });
    sync();
  }
}

/* ---------- 3D bundle (alag file, taaki text pehle dikhe) ---------- */
function load3D(MN) {
  const s = document.createElement('script');
  s.src = 'assets/js/scene3d.js';
  s.defer = true;
  s.onerror = () => {
    root.classList.add('no-3d');
    $$('[data-needs3d]').forEach((a) => a.remove());
    MN.ready3D = true;
    window.dispatchEvent(new Event('mn:3d-ready'));
  };
  document.body.appendChild(s);
  window.addEventListener('mn:3d-ready', () => {
    if (root.classList.contains('no-3d')) $$('[data-needs3d]').forEach((a) => a.remove());
  }, { once: true });
}

/* ---------- loading screen -> intro animation ---------- */
function runPreloader(MN, motion, reduced) {
  const pre = $('#preloader');
  const feats = MN.data.features || {};
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    MN.introDone = true;
    window.dispatchEvent(new Event('mn:intro'));
    motion.intro();
  };
  if (!pre || feats.preloader === false) { if (pre) pre.remove(); go(); return; }

  const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(1500)]) : Promise.resolve();
  const three = new Promise((res) => { if (MN.ready3D) res(); else window.addEventListener('mn:3d-ready', res, { once: true }); });
  Promise.all([fonts, Promise.race([three, wait(5000)]), wait(reduced ? 300 : 1800)]).then(() => {
    pre.classList.add('is-done');
    wait(reduced ? 0 : 420).then(go);
    wait(1200).then(() => pre.remove());
  });
}

/* ---------- Google Analytics (sirf tab jab id di ho) ---------- */
function loadAnalytics() {
  const id = data.site && data.site.googleAnalyticsId;
  if (!id || !/^G-[A-Z0-9]+$/i.test(id)) return;
  const start = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 4000 }); else setTimeout(start, 2500);
}
