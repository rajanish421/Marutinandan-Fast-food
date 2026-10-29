/* SEO builders - used by tools/seo.js (Node, bakes tags into index.html)
   AND by the browser (re-applies them if shop-data.js was edited after the last build). */
import { esc, groupHours, DAY_LONG } from './util.js';

export const absUrl = (base, path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return String(base || '').replace(/\/?$/, '/') + String(path).replace(/^\.?\//, '');
};

const phoneIntl = (p) => {
  const d = String(p || '').replace(/[^\d+]/g, '');
  return d.startsWith('+') ? d : d ? `+${d}` : '';
};
export const telHref = (p) => 'tel:' + phoneIntl(p);

/* ---------------------------------------------------------------- theme (light / dark)
   data.theme.mode = "light" | "dark" | "auto"   (auto = visitor ke phone/computer ki setting)
   data.theme.light / data.theme.dark = us mode ke colours (background, surface, text, + optional primary, accent...) */
export const THEME_DEFAULTS = {
  light: { background: '#fff8ef', surface: '#ffffff', text: '#24122f' },
  dark: { background: '#0a0510', surface: '#150b20', text: '#fff6ef' },
};
const THEME_VARS = { primary: '--c-primary', secondary: '--c-secondary', tertiary: '--c-tertiary', background: '--c-bg', surface: '--c-surface', text: '--c-text', accent: '--c-accent' };
const defined = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v));

export const themeMode = (data) => { const m = (data.theme || {}).mode; return m === 'dark' || m === 'auto' ? m : 'light'; };
export const themeToggleOn = (data) => !data.features || data.features.themeToggle !== false;

/** colours of one mode: shared brand colours + defaults + (old flat keys count as dark) + data.theme[mode] */
export function themePalette(data, mode) {
  const t = data.theme || {};
  const legacy = mode === 'dark' ? { background: t.background, surface: t.surface, text: t.text } : {};
  return { ...defined({ primary: t.primary, secondary: t.secondary, tertiary: t.tertiary }), ...THEME_DEFAULTS[mode], ...defined(legacy), ...defined(t[mode]) };
}

export function themeCss(data) {
  const decl = (p) => Object.entries(THEME_VARS).filter(([k]) => p[k]).map(([k, v]) => `${v}:${p[k]}`).join(';');
  return `:root,html[data-theme="dark"]{${decl(themePalette(data, 'dark'))}}html[data-theme="light"]{${decl(themePalette(data, 'light'))}}`;
}

/** tiny inline script: sets data-theme BEFORE first paint (no white/dark flash) */
export function themeBoot(data) {
  const bg = { light: themePalette(data, 'light').background, dark: themePalette(data, 'dark').background };
  return `<script>(function(){var d=document.documentElement,m=${JSON.stringify(themeMode(data))},s=null;try{s=localStorage.getItem('mn-theme')}catch(e){}${themeToggleOn(data) ? "if(s==='light'||s==='dark')m=s;" : ''}if(m==='auto')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.setAttribute('data-theme',m);var c=${JSON.stringify(bg)},t=document.querySelector('meta[name=theme-color]');if(t)t.setAttribute('content',c[m])})()</script>`;
}

export function jsonLd(data) {
  const { shop, site, seo } = data;
  const base = site.url;
  const a = shop.address || {};
  const cats = data.categories || [];
  const sections = cats
    .map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      hasMenuItem: (data.menu || []).filter((m) => m.category === c.id).map((m) => ({
        '@type': 'MenuItem',
        name: m.name,
        description: m.description,
        suitableForDiet: m.veg === false ? undefined : 'https://schema.org/VegetarianDiet',
        offers: { '@type': 'Offer', price: String(m.price), priceCurrency: 'INR' },
      })),
    }))
    .filter((s) => s.hasMenuItem.length);

  const hours = groupHours(shop.hours).filter((g) => g.hours).map((g) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days.map((d) => DAY_LONG[d]),
    opens: g.hours[0],
    closes: g.hours[1],
  }));

  const restaurant = {
    '@type': ['FastFoodRestaurant', 'Restaurant'],
    '@id': absUrl(base, '#restaurant'),
    name: shop.name,
    description: seo.description,
    url: base,
    image: [absUrl(base, site.ogImage)].filter(Boolean),
    logo: site.logo ? absUrl(base, site.logo) : undefined,
    telephone: phoneIntl(shop.phone),
    email: shop.email || undefined,
    priceRange: shop.priceRange,
    servesCuisine: [shop.cuisine, 'Indian Street Food', 'Burgers', 'Momos'].filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [a.line1, a.line2].filter(Boolean).join(', '),
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.pincode,
      addressCountry: a.country || 'IN',
    },
    geo: shop.geo ? { '@type': 'GeoCoordinates', latitude: shop.geo.lat, longitude: shop.geo.lng } : undefined,
    hasMap: shop.googleMapsUrl || undefined,
    openingHoursSpecification: hours.length ? hours : undefined,
    hasMenu: sections.length ? { '@type': 'Menu', name: `${shop.name} menu`, url: absUrl(base, '#menu'), hasMenuSection: sections } : undefined,
    sameAs: Object.values(site.social || {}).filter(Boolean),
  };

  const graph = [
    restaurant,
    { '@type': 'WebSite', '@id': absUrl(base, '#website'), url: base, name: shop.name, inLanguage: site.language || 'en-IN', publisher: { '@id': restaurant['@id'] } },
  ];
  if ((data.faq || []).length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: data.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** <head> tags (all carry data-seo so the browser can swap them). */
export function headTags(data) {
  const { shop, site, seo } = data;
  const url = site.url;
  const img = absUrl(url, site.ogImage);
  const a = shop.address || {};
  const kw = (seo.keywords || []).join(', ');
  const m = (attrs) => `<meta data-seo ${attrs}>`;
  const ld = JSON.stringify(jsonLd(data)).replace(/</g, '\\u003c');
  const lines = [
    `<title data-seo>${esc(seo.title)}</title>`,
    m(`name="description" content="${esc(seo.description)}"`),
    kw ? m(`name="keywords" content="${esc(kw)}"`) : '',
    m('name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"'),
    m(`name="theme-color" content="${esc(themePalette(data, themeMode(data) === 'dark' ? 'dark' : 'light').background)}"`),
    `<link data-seo rel="canonical" href="${esc(url)}">`,
    m('property="og:type" content="website"'),
    m(`property="og:site_name" content="${esc(shop.name)}"`),
    m(`property="og:title" content="${esc(seo.title)}"`),
    m(`property="og:description" content="${esc(seo.description)}"`),
    m(`property="og:url" content="${esc(url)}"`),
    img ? m(`property="og:image" content="${esc(img)}"`) : '',
    img ? m('property="og:image:width" content="1200"') : '',
    img ? m('property="og:image:height" content="630"') : '',
    img ? m(`property="og:image:alt" content="${esc(shop.name)} - 3D burger and fast food menu"`) : '',
    m(`property="og:locale" content="${esc((site.language || 'en-IN').replace('-', '_'))}"`),
    m('name="twitter:card" content="summary_large_image"'),
    m(`name="twitter:title" content="${esc(seo.title)}"`),
    m(`name="twitter:description" content="${esc(seo.description)}"`),
    img ? m(`name="twitter:image" content="${esc(img)}"`) : '',
    m(`name="geo.region" content="IN-UP"`),
    m(`name="geo.placename" content="${esc([a.city, a.state].filter(Boolean).join(', '))}"`),
    shop.geo ? m(`name="geo.position" content="${shop.geo.lat};${shop.geo.lng}"`) : '',
    shop.geo ? m(`name="ICBM" content="${shop.geo.lat}, ${shop.geo.lng}"`) : '',
    `<script data-seo type="application/ld+json">${ld}</script>`,
  ];
  return lines.filter(Boolean).join('\n  ');
}
