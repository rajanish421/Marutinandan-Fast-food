/* =====================================================================
   MOTION  -  saari animations (GSAP + ScrollTrigger).

   Rule: animation sirf ek jagah ghoomti hai - yahan. Agar kisi ko
   "animations kam chahiye" to `prefers-reduced-motion` (phone/computer ki
   accessibility setting) apne aap sab band kar deti hai, aur
   data.features me cursor / progress line alag se band ho sakte hain.
   ===================================================================== */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { icon } from './icons.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export function initMotion(MN) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const feats = MN.data.features || {};

  /* ------------------------------------------------------------ scroll UI (works even with reduced motion) */
  function scrollUI() {
    const nav = $('[data-nav]');
    const filters = $('[data-filters]');
    let bar = null;
    if (feats.scrollProgress !== false) {
      bar = document.createElement('div');
      bar.className = 'progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    const onScroll = () => {
      const y = window.scrollY;
      nav && nav.classList.toggle('is-stuck', y > 12);
      if (bar) { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`; }
      if (filters) filters.classList.toggle('is-stuck', filters.getBoundingClientRect().top <= (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72) + 6);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------ burger "opens up" while you scroll */
  function anatomy() {
    const sec = $('[data-anatomy]');
    if (!sec) return;
    const rows = $$('.layer', sec);
    const bar = $('[data-anatomy-bar]', sec);
    const n = rows.length;
    let lastActive = -2, lastLive = -2;
    const update = (p) => {
      const explode = smooth(0.05, 0.32, p);
      const k = Math.min(1, Math.max(0, (p - 0.32) / 0.64));
      const idx = n - 1 - Math.min(n - 1, Math.floor(k * n));            // part index, top of the burger first
      if (idx !== lastActive) {
        lastActive = idx;
        rows.forEach((r) => r.classList.toggle('is-active', +r.dataset.layer === idx));
      }
      const live = p < 0.3 ? -1 : idx;
      window.dispatchEvent(new CustomEvent('mn:anatomy', { detail: { explode, active: live, spin: p } }));
      lastLive = live;
      if (bar) bar.style.transform = `scaleX(${p})`;
    };
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (s) => update(s.progress), onRefresh: (s) => update(s.progress) });
    update(0);
  }

  /* ------------------------------------------------------------ everything below is skipped for reduced motion */
  let prepared = false;
  function prepare() {
    if (prepared || reduced) return;
    prepared = true;

    // headings: words slide up out of a mask
    $$('[data-split]').forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.textContent = '';
      text.split(/\s+/).forEach((word, i, all) => {
        const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        const s = document.createElement('span'); s.textContent = word; w.appendChild(s);
        el.appendChild(w);
        if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
      });
      const spans = $$('.w > span', el);
      gsap.set(spans, { yPercent: 118 });
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.07 }) });
    });

    // text blocks
    $$('[data-reveal]').forEach((el) => {
      gsap.set(el, { opacity: 0, y: 26 });
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }) });
    });

    // groups (combos, features, quotes, faq): children arrive one after the other
    $$('[data-stagger]').forEach((box) => {
      const kids = [...box.children];
      gsap.set(kids, { opacity: 0, y: 46 });
      ScrollTrigger.create({ trigger: box, start: 'top 86%', once: true, onEnter: () => gsap.to(kids, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, clearProps: 'transform' }) });
    });

    // menu cards pop in as you scroll
    const dishes = $$('.dish');
    if (dishes.length) {
      gsap.set(dishes, { opacity: 0, y: 70 });
      ScrollTrigger.batch(dishes, {
        start: 'top 95%', once: true,
        onEnter: (els) => {
          els = els.filter((e) => !e.dataset.shown);
          els.forEach((e) => { e.dataset.shown = '1'; });
          gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' });
        },
      });
    }

    // soft depth on the hero rings and glows
    $$('[data-parallax]').forEach((el) => {
      gsap.to(el, { y: parseFloat(el.dataset.parallax) * 600, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });

    // hero starting positions (they are hidden behind the loading screen)
    gsap.set('.hero__line--1 .hero__lineinner', { yPercent: 115 });
    gsap.set('.hero__line--2', { opacity: 0 });
    gsap.set('[data-hero-in]', { opacity: 0, y: 26 });
    gsap.set('.hero__ring, .hero__glow', { opacity: 0, scale: 0.7 });
    gsap.set('.hero__scroll', { opacity: 0 });
    gsap.set('.nav', { yPercent: -110 });

    // marquee speeds up when you scroll fast
    const track = $('.marquee__track');
    const anim = track && track.getAnimations && track.getAnimations()[0];
    if (anim) {
      let boost = 0;
      ScrollTrigger.create({ onUpdate: (s) => { boost = Math.min(6, Math.abs(s.getVelocity()) / 450); } });
      gsap.ticker.add(() => { boost *= 0.93; anim.playbackRate = 1 + boost; });
    }

    // buttons lean towards the pointer
    if (fine) {
      $$('[data-magnetic]').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.35, ease: 'power3.out' });
        });
        el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }));
      });
    }
  }

  /** the one big moment: loading screen opens, sign turns on, burger drops in */
  function intro() {
    const neon = $('.hero__line--2');
    if (reduced) { neon && neon.classList.add('is-lit'); return; }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.nav', { yPercent: 0, duration: 0.9, clearProps: 'transform' }, 0.1)
      .to('.hero__ring, .hero__glow', { opacity: 1, scale: 1, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0)
      .to('.hero__line--1 .hero__lineinner', { yPercent: 0, duration: 1.1 }, 0.15)
      .add(() => { if (neon) { gsap.set(neon, { clearProps: 'opacity' }); neon.classList.add('is-lit'); } }, 0.55)
      .to('[data-hero-in]', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, clearProps: 'transform' }, 0.45)
      .to('.hero__scroll', { opacity: 1, duration: 0.8 }, 1.5);
  }

  /** menu filter: cards that stay/arrive spring back in */
  function filter(show, hide) {
    hide.forEach((e) => { e.hidden = true; });
    show.forEach((e) => { e.hidden = false; e.dataset.shown = '1'; });
    if (reduced) { gsap.set(show, { clearProps: 'all' }); ScrollTrigger.refresh(); return; }
    gsap.killTweensOf(show);
    gsap.fromTo(show, { opacity: 0, y: 34, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: { each: 0.045, amount: 0.45 }, clearProps: 'transform' });
    ScrollTrigger.refresh();
  }

  /** a glowing dot flies from the button into the order icon */
  function fly(from) {
    const to = $('.nav__cart');
    const nav = $('.nav__cart');
    const pop = () => { if (!nav) return; nav.classList.remove('is-bump'); void nav.offsetWidth; nav.classList.add('is-bump'); };
    if (reduced || !from || !to) { pop(); return; }
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly';
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    gsap.set(dot, { x: x0, y: y0 });
    const d = 0.75;
    gsap.to(dot, { x: x1, duration: d, ease: 'power1.in' });
    gsap.to(dot, { y: y1, duration: d, ease: 'power3.out' });
    gsap.to(dot, { scale: 0.35, duration: d, ease: 'power1.in', onComplete: () => { dot.remove(); pop(); } });
  }

  let toastTimer;
  function toast(message, actionLabel, onAction) {
    const box = $('[data-toasts]');
    if (!box) return;
    $$('.toast', box).forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = icon('check');
    const msg = document.createElement('span'); msg.textContent = message; t.appendChild(msg);
    if (actionLabel) { const b = document.createElement('button'); b.type = 'button'; b.textContent = actionLabel; b.addEventListener('click', () => { onAction && onAction(); t.remove(); }); t.appendChild(b); }
    box.appendChild(t);
    if (!reduced) gsap.from(t, { y: 30, opacity: 0, scale: 0.9, duration: 0.5, ease: 'back.out(1.7)' });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (reduced) { t.remove(); return; }
      gsap.to(t, { opacity: 0, y: 16, duration: 0.3, onComplete: () => t.remove() });
    }, 3200);
  }

  /* ------------------------------------------------------------ custom cursor ring */
  function cursor() {
    if (!fine || reduced || feats.customCursor === false) return;
    const ring = document.createElement('div');
    ring.className = 'cursor';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    const x = gsap.quickTo(ring, 'x', { duration: 0.28, ease: 'power3.out' });
    const y = gsap.quickTo(ring, 'y', { duration: 0.28, ease: 'power3.out' });
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; ring.classList.add('is-on'); x(e.clientX); y(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => ring.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, summary, label, input, textarea, [data-stage], .hero__canvas'))));
    addEventListener('pointerdown', () => ring.classList.add('is-down'));
    addEventListener('pointerup', () => ring.classList.remove('is-down'));
  }

  scrollUI();
  anatomy();
  cursor();

  // layout shifts when fonts / images arrive
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());

  return { prepare, intro, filter, fly, toast, refresh: () => ScrollTrigger.refresh(), reduced };
}
