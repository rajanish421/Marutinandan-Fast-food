/* =====================================================================
   SEO  -  Google ke liye website ko "pehle se likha hua" (prerendered) banata hai.

   Website data/shop-data.js se browser me banti hai, lekin Google, WhatsApp,
   Facebook ke bots JavaScript nahi chalate. Ye script unke liye index.html me
   ye sab pehle se likh deta hai:
     - title, description, share-image tags, schema (restaurant + menu + FAQ)
     - poora page content (menu, reviews, address ...)
     - sitemap.xml, robots.txt, site.webmanifest

   Kab chalana hai:  shop-data.js badalne ke baad, website upload karne se PEHLE.
       node tools/seo.js        (ya  npm run seo)

   Sirf Node.js chahiye, koi package install nahi.
   ===================================================================== */
import { readFile, writeFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderApp } from '../src/ui/render.js';
import { headTags, themeCss, themeBoot, themeMode, themePalette } from '../src/ui/seo.js';
import { dataHash } from '../src/ui/util.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (...p) => path.join(root, ...p);
const exists = (p) => access(p).then(() => true, () => false);

/* ---- 1. shop-data.js padho ---- */
const sandbox = { window: {} };
vm.runInNewContext(await readFile(file('data', 'shop-data.js'), 'utf8'), sandbox, { filename: 'shop-data.js' });
const data = sandbox.window.SHOP_DATA;
if (!data) { console.error('data/shop-data.js me window.SHOP_DATA nahi mila.'); process.exit(1); }

/* ---- 2. index.html ke marked hisse badlo ---- */
let html = await readFile(file('index.html'), 'utf8');

function swap(startMarker, endMarker, inner, keepStart = true) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker);
  if (a < 0 || b < 0 || b < a) { console.error(`index.html me ${startMarker} ... ${endMarker} nahi mila.`); process.exit(1); }
  const startEnd = keepStart && startMarker.endsWith('-->') ? a + startMarker.length : html.indexOf('-->', a) + 3;
  html = html.slice(0, startEnd) + inner + html.slice(b);
}

swap('<!-- SEO:START', '<!-- SEO:END -->', `\n  ${headTags(data)}\n  `);
swap('<!-- THEME:START -->', '<!-- THEME:END -->', `<style id="mn-theme">${themeCss(data)}</style>${themeBoot(data)}`);
swap('<!-- APP:START -->', '<!-- APP:END -->', `<div id="app">${renderApp(data)}</div>`);

const hash = dataHash(data);
const bakedMode = themeMode(data) === 'dark' ? 'dark' : 'light';   // 'auto' me pehle light; inline script turant sahi mode laga deti hai
html = html.replace(/<html[^>]*>/, `<html lang="${data.site.language || 'en-IN'}" data-theme="${bakedMode}" data-hash="${hash}">`);
await writeFile(file('index.html'), html);

/* ---- 3. sitemap, robots, manifest ---- */
const base = String(data.site.url || '').replace(/\/?$/, '/');
const today = new Date().toISOString().slice(0, 10);
await writeFile(file('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);
await writeFile(file('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);
await writeFile(file('site.webmanifest'), JSON.stringify({
  name: data.shop.name,
  short_name: data.shop.shortName || data.shop.name,
  description: data.seo.description,
  start_url: './',
  display: 'standalone',
  background_color: themePalette(data, bakedMode).background,
  theme_color: themePalette(data, bakedMode).background,
  icons: [{ src: 'assets/img/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
}, null, 2) + '\n');

/* ---- 4. report ---- */
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0);
console.log('✓ index.html     SEO tags + schema + poora content bake ho gaya (' + kb(html) + ' KB)');
console.log('✓ sitemap.xml, robots.txt, site.webmanifest');
console.log(`  menu items: ${data.menu.length}, combos: ${(data.combos || []).length}, faq: ${(data.faq || []).length}`);

const warn = [];
if (/example\.com/.test(base)) warn.push('site.url abhi "example.com" hai. Domain milte hi shop-data.js me asli address daalo, phir ye script dobara chalao.');
if (data.site.ogImage && !(await exists(file(data.site.ogImage)))) warn.push(`Share image nahi mili: ${data.site.ogImage} (1200x630 ki image daalo).`);
if (data.shop.geo && !data.shop.googleMapsUrl) warn.push('shop.geo abhi approx hai. Google Maps se exact latitude/longitude daalo.');
if (!base.startsWith('https://')) warn.push('site.url https:// se shuru hona chahiye.');
if (warn.length) console.log('\n⚠️  Dhyan do:\n' + warn.map((w) => '   - ' + w).join('\n'));
