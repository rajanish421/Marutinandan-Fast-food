/* =====================================================================
   RENDER  -  shop-data.js  ->  page ka HTML (string)

   Ye file DOM use nahi karti, isliye dono jagah chalti hai:
     1. Browser me  (src/ui/main.js)   - page dikhane ke liye
     2. Node me     (tools/seo.js)     - Google ko poora content dikhane ke liye
                                         (HTML me pehle se likh deta hai)

   Design / layout badalna ho to yahan (HTML) aur assets/css/ (style) badlo.
   Menu / text / price badalna ho to yahan kuchh nahi - data/shop-data.js.
   ===================================================================== */
import { esc, money, groupHours, t12 } from './util.js';
import { icon, stars } from './icons.js';
import { TAG_LABELS, layerInfo } from '../shared/labels.js';
import { telHref, absUrl, themeToggleOn } from './seo.js';

const enc = encodeURIComponent;

/* ---------------------------------------------------------------- links */
export const waLink = (data, text) =>
  `https://wa.me/${String(data.shop.whatsapp || '').replace(/\D/g, '')}?text=${enc(text || (data.ordering && data.ordering.greeting) || 'Hello!')}`;

export const mapsLink = (data) =>
  data.shop.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${enc(data.shop.mapQuery || data.shop.name)}`;

export const directionsLink = (data) => {
  const g = data.shop.geo;
  const dest = g && g.lat ? `${g.lat},${g.lng}` : data.shop.mapQuery || data.shop.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${enc(dest)}`;
};

export const mapEmbed = (data) => `https://www.google.com/maps?q=${enc(data.shop.mapQuery || data.shop.name)}&output=embed`;

const reviewsLink = (data) => data.shop.googleReviewsUrl || mapsLink(data);

const addressLine = (a = {}) => [a.line1, a.line2, a.city, [a.state, a.pincode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

/* ---------------------------------------------------------------- small parts */
const section = (cls, id, inner, extra = '') =>
  `<section class="${cls}" id="${id}" ${extra}>${inner}</section>`;

const sHead = (id, cfg = {}, cls = '') => `
  <div class="shead ${cls}">
    <h2 class="h2" id="${id}-title" data-split>${esc(cfg.title || '')}</h2>
    ${cfg.text ? `<p class="shead__text" data-reveal>${esc(cfg.text)}</p>` : ''}
  </div>`;

const vegDot = (veg) => `<span class="veg ${veg === false ? 'is-nonveg' : 'is-veg'}" role="img" aria-label="${veg === false ? 'Non-vegetarian' : 'Vegetarian'}" title="${veg === false ? 'Non-vegetarian' : 'Vegetarian'}"></span>`;

const tagList = (tags = []) =>
  tags.length ? `<span class="tags">${tags.map((t) => `<span class="tag tag--${esc(t)}">${esc(TAG_LABELS[t] || t)}</span>`).join('')}</span>` : '';

/* ---------------------------------------------------------------- header */
function header(data) {
  const { shop, site } = data;
  const ord = ordering(data);
  const themeBtn = themeToggleOn(data);
  const links = [
    ['#menu', 'Menu'],
    data.anatomy && data.anatomy.enabled !== false && anatomyKeys(data) ? ['#anatomy', 'Inside the burger', 'needs3d'] : null,
    (data.combos || []).length ? ['#combos', 'Combos'] : null,
    (data.reviews || []).length ? ['#reviews', 'Reviews'] : null,
    ['#visit', 'Find us'],
  ].filter(Boolean);

  const logo = site.logo
    ? `<img class="brand__img" src="${esc(site.logo)}" alt="" width="40" height="40">`
    : `<span class="brand__mark" aria-hidden="true">${esc((shop.shortName || shop.name).trim().charAt(0))}</span>`;

  return `
  <header class="nav" data-nav>
    <div class="nav__bar">
      <a class="brand" href="#top" aria-label="${esc(shop.name)} - home">
        ${logo}<span class="brand__name">${esc(shop.shortName || shop.name)}</span>
      </a>
      <nav class="nav__links" id="site-nav" aria-label="Main">
        ${links.map(([h, t, f]) => `<a href="${h}"${f ? ` data-${f}` : ''}>${esc(t)}</a>`).join('')}
        <a class="nav__call" href="${telHref(shop.phone)}">${icon('phone')}<span>${esc(shop.phone)}</span></a>
        ${themeBtn ? `<button class="nav__themebtn" type="button" data-theme-toggle><span class="nav__themeicons">${icon('sun')}${icon('moon')}</span><span data-theme-label>Dark mode</span></button>` : ''}
      </nav>
      <div class="nav__tools">
        <span class="status status--nav" data-status hidden><i class="status__dot"></i><span data-status-text></span></span>
        ${themeBtn ? `<button class="nav__theme" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false"><span class="nav__themeicons">${icon('sun')}${icon('moon')}</span></button>` : ''}
        ${ord ? `<button class="nav__cart" type="button" data-cart-open aria-label="Open your order">${icon('bag')}<span class="badge" data-cart-count hidden>0</span></button>` : ''}
        <button class="nav__burger" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav" aria-label="Open menu"><span></span><span></span></button>
      </div>
    </div>
  </header>`;
}

const ordering = (data) => !data.ordering || data.ordering.enabled !== false;

/* ---------------------------------------------------------------- hero */
function hero(data) {
  const { shop, hero: h = {} } = data;
  const lines = Array.isArray(h.headline) ? h.headline : [String(h.headline || shop.name)];
  const items = (h.showcase || []).map((id) => (data.menu || []).find((m) => m.id === id)).filter(Boolean);
  const cat = (it) => ((data.categories || []).find((c) => c.id === it.category) || {}).icon || '🍽️';
  const r = shop.rating;

  return `
  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="hero__bg" aria-hidden="true">
      <span class="hero__ring hero__ring--a" data-parallax="-0.08"></span>
      <span class="hero__ring hero__ring--b" data-parallax="0.12"></span>
      <span class="hero__glow hero__glow--a" data-parallax="0.18"></span>
      <span class="hero__glow hero__glow--b" data-parallax="-0.14"></span>
    </div>
    <div class="wrap hero__grid">
      <div class="hero__copy">
        <p class="chip chip--loc" data-hero-in>${icon('pin')}<span>${esc(h.eyebrow || '')}</span></p>
        <h1 class="hero__title" id="hero-title">
          <span class="sr-only">${esc(shop.name)}: </span>
          ${lines.map((l, i) => `<span class="hero__line hero__line--${i + 1}${i === 1 ? ' neon' : ''}"><span class="hero__lineinner">${esc(l)}</span></span>`).join('')}
        </h1>
        <p class="hero__text" data-hero-in>${esc(h.text || '')}</p>
        <div class="hero__cta" data-hero-in>
          <a class="btn btn--primary" href="${waLink(data)}" target="_blank" rel="noopener" data-magnetic>${icon('whatsapp')}<span>${esc(h.primaryButton || 'Order on WhatsApp')}</span></a>
          <a class="btn btn--ghost" href="#menu" data-magnetic>${icon('cube')}<span>${esc(h.secondaryButton || 'See the menu')}</span></a>
        </div>
        <ul class="hero__facts" data-hero-in>
          ${r ? `<li><a class="fact fact--rating" href="#reviews">${stars(r.value)}<strong>${esc(r.value)}</strong><span>${esc(r.source || 'Google')} (${esc(r.count)} reviews)</span></a></li>` : ''}
          ${shop.priceRange ? `<li><span class="fact">${icon('tag')}<span>${esc(shop.priceRange)} per person</span></span></li>` : ''}
          <li><span class="fact status" data-status hidden><i class="status__dot"></i><span data-status-text></span></span></li>
        </ul>
      </div>
      <div class="hero__stage" data-hero3d>
        <div class="hero__fallback" aria-hidden="true">
          ${items.slice(0, 3).map((it, i) => `<span class="hero__emoji hero__emoji--${i + 1}">${cat(it)}</span>`).join('')}
        </div>
      </div>
    </div>
    <a class="hero__scroll" href="#menu" aria-label="Scroll to the menu"><span class="hero__scrollbar"></span></a>
  </section>`;
}

/* ---------------------------------------------------------------- marquee */
function marquee(data) {
  const words = (data.marquee && data.marquee.length ? data.marquee : (data.categories || []).map((c) => c.name)).filter(Boolean);
  if (!words.length) return '';
  const run = words.map((w, i) => `<span class="marquee__item${i % 2 ? ' is-outline' : ''}">${esc(w)}</span><span class="marquee__sep" aria-hidden="true">${icon('sparkles')}</span>`).join('');
  return `
  <div class="marquee" aria-label="${esc(words.join(', '))}" data-marquee>
    <div class="marquee__track" aria-hidden="true">
      <div class="marquee__run">${run}${run}</div>
      <div class="marquee__run">${run}${run}</div>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- menu */
function dishCard(data, it, ord) {
  const cat = (data.categories || []).find((c) => c.id === it.category) || {};
  const sold = !!it.soldOut;
  return `
    <article class="dish${sold ? ' is-sold' : ''}" data-dish="${esc(it.id)}" data-cat="${esc(it.category)}" data-veg="${it.veg === false ? 0 : 1}">
      <button class="dish__stage" type="button" data-stage="${esc(it.id)}" aria-label="View ${esc(it.name)} in 3D">
        <span class="dish__disc" aria-hidden="true"></span>
        <span class="dish__emoji" aria-hidden="true">${esc(cat.icon || '🍽️')}</span>
        <img class="dish__art" alt="" width="512" height="512" decoding="async">
        <span class="dish__view" aria-hidden="true">${icon('cube')}<span>3D</span></span>
        ${sold ? '<span class="dish__soldtag">Sold out</span>' : ''}
      </button>
      <div class="dish__body">
        <div class="dish__title">${vegDot(it.veg)}<h3 class="dish__name">${esc(it.name)}</h3></div>
        <p class="dish__desc">${esc(it.description || '')}</p>
        ${tagList(it.tags)}
        <div class="dish__foot">
          <span class="price"><span class="sr-only">Price </span>${money(it.price, data.ordering && data.ordering.currency)}</span>
          ${ord ? `<div class="qty" data-qty-for="${esc(it.id)}">
            <button class="add" type="button" data-add="${esc(it.id)}"${sold ? ' disabled' : ''}>${icon('plus')}<span>${sold ? 'Sold out' : 'Add'}</span></button>
            <div class="stepper" hidden>
              <button type="button" data-dec="${esc(it.id)}" aria-label="Remove one ${esc(it.name)}">${icon('minus')}</button>
              <output data-qty-val>0</output>
              <button type="button" data-inc="${esc(it.id)}" aria-label="Add one more ${esc(it.name)}">${icon('plus')}</button>
            </div>
          </div>` : ''}
        </div>
      </div>
    </article>`;
}

function menu(data) {
  const items = data.menu || [];
  const ord = ordering(data);
  const cats = (data.categories || []).filter((c) => items.some((i) => i.category === c.id));
  const hasNonVeg = items.some((i) => i.veg === false);
  return section('section menu', 'menu', `
    <div class="wrap">
      ${sHead('menu', data.sections && data.sections.menu)}
      <div class="filters" data-filters>
        <div class="filters__cats" role="group" aria-label="Filter the menu by category">
          <button class="fchip is-active" type="button" data-filter="all" aria-pressed="true">All<span class="fchip__n">${items.length}</span></button>
          ${cats.map((c) => `<button class="fchip" type="button" data-filter="${esc(c.id)}" aria-pressed="false"><span aria-hidden="true">${esc(c.icon || '')}</span>${esc(c.name)}</button>`).join('')}
        </div>
        ${hasNonVeg ? `<label class="vegtoggle"><input type="checkbox" data-veg-only><span class="vegtoggle__box" aria-hidden="true"></span><span>Veg only</span></label>` : ''}
      </div>
      <div class="dishes" data-dishes>
        ${items.map((it) => dishCard(data, it, ord)).join('')}
      </div>
      <p class="menu__empty" data-menu-empty hidden>Nothing matches these filters. Pick another category or turn off Veg only.</p>
    </div>`, 'aria-labelledby="menu-title"');
}

/* ---------------------------------------------------------------- anatomy (scroll story) */
const BURGER_KEYS = ['tikki', 'patty', 'paneer', 'cheese', 'lettuce', 'tomato', 'onion', 'sauce', 'mayo', 'pickle'];

/** same order the 3D burger is built in: bottom bun, layers..., top bun */
export function anatomyKeys(data) {
  const cfg = data.anatomy;
  if (!cfg || cfg.enabled === false) return null;
  const item = (data.menu || []).find((i) => i.id === cfg.itemId);
  if (!item || (item.model || 'burger') !== 'burger') return null;
  const wanted = item.modelOptions && item.modelOptions.layers && item.modelOptions.layers.length ? item.modelOptions.layers : ['lettuce', 'tikki', 'tomato', 'sauce'];
  return ['bun-bottom', ...wanted.filter((k) => BURGER_KEYS.includes(k)), 'bun-top'];
}

function anatomy(data) {
  const keys = anatomyKeys(data);
  if (!keys) return '';
  const cfg = data.anatomy;
  const item = data.menu.find((i) => i.id === cfg.itemId);
  const over = cfg.labels || {};
  const rows = keys.map((k, i) => ({ k, i })).reverse();
  return section('anatomy', 'anatomy', `
    <div class="anatomy__sticky">
      <div class="anatomy__copy">
        <h2 class="h2" id="anatomy-title" data-split>${esc(cfg.title || item.name)}</h2>
        ${cfg.text ? `<p class="anatomy__lead">${esc(cfg.text)}</p>` : ''}
        <ol class="layers" data-layers>
          ${rows.map(({ k, i }) => { const L = layerInfo(k, over); return `<li class="layer" data-layer="${i}"><span class="layer__name">${esc(L.name)}</span><span class="layer__text">${esc(L.text)}</span></li>`; }).join('')}
        </ol>
        <button class="btn btn--ghost anatomy__open" type="button" data-open3d="${esc(item.id)}">${icon('cube')}<span>Open ${esc(item.name)} in 3D</span></button>
      </div>
      <div class="anatomy__stage" data-anatomy3d role="img" aria-label="${esc(item.name)} opening up layer by layer in 3D"></div>
      <p class="anatomy__progress" aria-hidden="true"><span data-anatomy-bar></span></p>
    </div>`, `style="--n:${keys.length}" data-anatomy aria-labelledby="anatomy-title"`);
}

/* ---------------------------------------------------------------- combos */
function combos(data) {
  const list = data.combos || [];
  if (!list.length) return '';
  const ord = ordering(data);
  const byId = new Map((data.menu || []).map((m) => [m.id, m]));
  const cur = data.ordering && data.ordering.currency;
  return section('section combos', 'combos', `
    <div class="wrap">
      ${sHead('combos', data.sections && data.sections.combos)}
      <div class="combos__grid" data-stagger>
        ${list.map((c) => {
          const parts = (c.items || []).map((id) => byId.get(id)).filter(Boolean);
          const save = c.oldPrice && c.oldPrice > c.price ? c.oldPrice - c.price : 0;
          return `
          <article class="combo" data-combo="${esc(c.id)}">
            ${c.badge ? `<span class="combo__badge">${esc(c.badge)}</span>` : ''}
            <div class="combo__thumbs" aria-hidden="true">
              ${parts.map((p) => `<span class="combo__thumb" data-thumb-for="${esc(p.id)}"><img alt="" width="512" height="512" decoding="async"></span>`).join('<span class="combo__plus">+</span>')}
            </div>
            <h3 class="combo__name">${esc(c.name)}</h3>
            <p class="combo__desc">${esc(c.description || parts.map((p) => p.name).join(' + '))}</p>
            <ul class="combo__list">${parts.map((p) => `<li>${esc(p.name)}</li>`).join('')}</ul>
            <div class="combo__foot">
              <div class="combo__price">
                <span class="price">${money(c.price, cur)}</span>
                ${save ? `<s class="combo__old">${money(c.oldPrice, cur)}</s><span class="combo__save">Save ${money(save, cur)}</span>` : ''}
              </div>
              ${ord ? `<button class="btn btn--primary btn--sm" type="button" data-add-combo="${esc(c.id)}">${icon('plus')}<span>Add combo</span></button>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>`, 'aria-labelledby="combos-title"');
}

/* ---------------------------------------------------------------- about */
function about(data) {
  const a = data.about;
  if (!a) return '';
  return section('section about', 'about', `
    <div class="wrap about__grid">
      <div class="about__copy">
        <h2 class="h2" id="about-title" data-split>${esc(a.title)}</h2>
        <p class="about__text" data-reveal>${esc(a.text)}</p>
      </div>
      <ul class="about__feats" data-stagger>
        ${(a.features || []).map((f) => `<li class="feat"><span class="feat__ic">${icon(f.icon || 'sparkles')}</span><h3 class="feat__title">${esc(f.title)}</h3><p class="feat__text">${esc(f.text)}</p></li>`).join('')}
      </ul>
    </div>`, 'aria-labelledby="about-title"');
}

/* ---------------------------------------------------------------- reviews */
function reviews(data) {
  const list = data.reviews || [];
  if (!list.length) return '';
  const r = data.shop.rating;
  return section('section reviews', 'reviews', `
    <div class="wrap">
      ${sHead('reviews', data.sections && data.sections.reviews)}
      <div class="reviews__grid">
        ${r ? `<aside class="score" data-reveal>
          <p class="score__num">${esc(r.value)}</p>
          ${stars(r.value)}
          <p class="score__sub">${esc(r.count)} ${esc(r.source || 'Google')} reviews</p>
          <a class="btn btn--ghost btn--sm" href="${esc(reviewsLink(data))}" target="_blank" rel="noopener">Read all on ${esc(r.source || 'Google')}</a>
        </aside>` : ''}
        <div class="quotes" data-stagger>
          ${list.map((q) => `
          <figure class="quote">
            <span class="quote__mark" aria-hidden="true">${icon('quote')}</span>
            <blockquote><p>${esc(q.text)}</p></blockquote>
            <figcaption>${stars(q.rating)}<span>${esc(q.name || 'Customer')}${q.source ? `, ${esc(q.source)}` : ''}</span></figcaption>
          </figure>`).join('')}
        </div>
      </div>
    </div>`, 'aria-labelledby="reviews-title"');
}

/* ---------------------------------------------------------------- gallery */
function gallery(data) {
  const list = data.gallery || [];
  if (!list.length) return '';
  return section('section gallery', 'gallery', `
    <div class="wrap">
      ${sHead('gallery', data.sections && data.sections.gallery)}
      <div class="gallery__grid" data-stagger>
        ${list.map((g) => `<figure class="shot"><img src="${esc(g.src)}" alt="${esc(g.alt || data.shop.name)}" loading="lazy" decoding="async"></figure>`).join('')}
      </div>
    </div>`, 'aria-labelledby="gallery-title"');
}

/* ---------------------------------------------------------------- faq */
function faq(data) {
  const list = data.faq || [];
  if (!list.length) return '';
  return section('section faq', 'faq', `
    <div class="wrap faq__grid">
      ${sHead('faq', data.sections && data.sections.faq, 'shead--side')}
      <div class="faq__list" data-stagger>
        ${list.map((f) => `<details class="qa" name="faq"><summary><span>${esc(f.q)}</span><i class="qa__ic" aria-hidden="true">${icon('plus')}</i></summary><div class="qa__a"><p>${esc(f.a)}</p></div></details>`).join('')}
      </div>
    </div>`, 'aria-labelledby="faq-title"');
}

/* ---------------------------------------------------------------- visit */
function visit(data) {
  const { shop } = data;
  const rows = groupHours(shop.hours);
  const social = Object.entries((data.site && data.site.social) || {}).filter(([, v]) => v);
  return section('section visit', 'visit', `
    <div class="wrap">
      ${sHead('visit', data.sections && data.sections.visit)}
      <div class="visit__grid">
        <div class="visit__info" data-reveal>
          <address class="visit__addr">${icon('pin')}<span>${esc(addressLine(shop.address))}</span></address>
          <p class="visit__row">${icon('phone')}<a href="${telHref(shop.phone)}">${esc(shop.phone)}</a></p>
          ${shop.email ? `<p class="visit__row">${icon('nav')}<a href="mailto:${esc(shop.email)}">${esc(shop.email)}</a></p>` : ''}
          <div class="hours">
            <h3 class="hours__title">${icon('clock')}<span>Opening hours</span></h3>
            <span class="status" data-status hidden><i class="status__dot"></i><span data-status-text></span></span>
            <ul class="hours__list">
              ${rows.map((r) => `<li data-days="${r.days.join(' ')}"><span>${esc(r.label)}</span><span>${r.hours ? `${t12(r.hours[0])} to ${t12(r.hours[1])}` : 'Closed'}</span></li>`).join('')}
            </ul>
          </div>
          <div class="visit__cta">
            <a class="btn btn--primary" href="${esc(directionsLink(data))}" target="_blank" rel="noopener">${icon('nav')}<span>Get directions</span></a>
            <a class="btn btn--ghost" href="${telHref(shop.phone)}">${icon('phone')}<span>Call us</span></a>
            <a class="btn btn--ghost" href="${waLink(data)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a>
          </div>
        </div>
        <div class="visit__map" data-map="${esc(mapEmbed(data))}">
          <div class="visit__mapfallback"><span>${icon('pin')}</span><p>${esc(shop.name)}</p><a href="${esc(mapsLink(data))}" target="_blank" rel="noopener">Open in Google Maps</a></div>
        </div>
      </div>
    </div>`, 'aria-labelledby="visit-title"');
}

/* ---------------------------------------------------------------- footer */
function footer(data) {
  const { shop, site } = data;
  const social = Object.entries((site && site.social) || {}).filter(([, v]) => v);
  const year = new Date().getFullYear();
  return `
  <footer class="foot">
    <p class="foot__word" aria-hidden="true">${esc(shop.shortName || shop.name)}</p>
    <div class="wrap foot__grid">
      <div>
        <p class="foot__name">${esc(shop.name)}</p>
        <p class="foot__tag">${esc(shop.tagline || '')}</p>
      </div>
      <nav class="foot__nav" aria-label="Footer">
        <a href="#menu">Menu</a>
        ${(data.combos || []).length ? '<a href="#combos">Combos</a>' : ''}
        ${(data.faq || []).length ? '<a href="#faq">FAQ</a>' : ''}
        <a href="#visit">Find us</a>
      </nav>
      <div class="foot__contact">
        <a href="${telHref(shop.phone)}">${esc(shop.phone)}</a>
        <span>${esc(shop.address.line2 || '')}, ${esc(shop.address.city || '')}</span>
        ${social.length ? `<span class="foot__social">${social.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(shop.name)} on ${esc(k)}">${icon(k)}</a>`).join('')}</span>` : ''}
      </div>
    </div>
    <div class="wrap foot__legal">
      <p>&copy; ${year} ${esc(shop.name)}. All rights reserved.</p>
      ${site && site.credit && site.credit.text ? `<p>${site.credit.url ? `<a href="${esc(site.credit.url)}" target="_blank" rel="noopener">${esc(site.credit.text)}</a>` : esc(site.credit.text)}</p>` : ''}
    </div>
  </footer>`;
}

/* ---------------------------------------------------------------- cart (drawer) */
function cart(data) {
  if (!ordering(data)) return '';
  const o = data.ordering || {};
  return `
  <dialog class="cart" id="cart" aria-labelledby="cart-title" data-cart>
    <div class="cart__panel">
      <header class="cart__head">
        <h2 class="cart__title" id="cart-title">Your order</h2>
        <button class="iconbtn" type="button" data-cart-close aria-label="Close your order">${icon('close')}</button>
      </header>
      <div class="cart__body">
        <ul class="cart__list" data-cart-list></ul>
        <div class="cart__empty" data-cart-empty>
          <span class="cart__emptyic">${icon('bag')}</span>
          <p>Nothing here yet.</p>
          <a class="btn btn--ghost btn--sm" href="#menu" data-cart-close>Browse the menu</a>
        </div>
      </div>
      <form class="cart__foot" data-cart-form novalidate>
        ${o.askName !== false ? `<label class="field"><span>Your name</span><input name="name" type="text" autocomplete="name" placeholder="Name"></label>` : ''}
        ${o.askAddress !== false ? `<label class="field"><span>Delivery address or pickup note</span><textarea name="note" rows="2" placeholder="e.g. Pickup at 7 PM, or your address"></textarea></label>` : ''}
        <p class="cart__total"><span>Total</span><strong data-cart-total>${money(0, o.currency)}</strong></p>
        ${o.minOrder ? `<p class="cart__min" data-cart-min hidden>Minimum order is ${money(o.minOrder, o.currency)}.</p>` : ''}
        ${o.note ? `<p class="cart__note">${esc(o.note)}</p>` : ''}
        <button class="btn btn--wa" type="submit" data-cart-send>${icon('whatsapp')}<span>Send order on WhatsApp</span></button>
        <button class="linkbtn" type="button" data-cart-clear>Clear order</button>
      </form>
    </div>
  </dialog>
  <button class="cartbar" type="button" data-cart-open hidden>
    <span class="cartbar__l">${icon('bag')}<span data-cartbar-count>0 items</span></span>
    <span class="cartbar__r"><strong data-cartbar-total>${money(0, o.currency)}</strong><span>View order</span></span>
  </button>
  <div class="toasts" data-toasts aria-live="polite" aria-atomic="false"></div>`;
}

/* ---------------------------------------------------------------- whole page */
export function renderApp(data) {
  return [
    header(data),
    `<main id="main">`,
    hero(data),
    marquee(data),
    menu(data),
    anatomy(data),
    combos(data),
    about(data),
    reviews(data),
    gallery(data),
    faq(data),
    visit(data),
    `</main>`,
    footer(data),
    cart(data),
  ].join('\n');
}
