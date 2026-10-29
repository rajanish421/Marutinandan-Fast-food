# Project phases - Maruti Nandan Fast Food website

Har phase chhota rakha gaya hai taaki ek din ke free token limit me poora ho jaye.

## Status

| Phase | Kaam | Status |
|---|---|---|
| 1 | Foundation: project setup, single data file (`data/shop-data.js`), design system, self-hosted fonts | Done |
| 2 | 3D engine + 8 procedural models (burger, pizza, momos, roll, sandwich, chowmein, fries, shake) + 3D viewer (rotate, zoom, explode) | Done |
| 3 | Page sections: hero (3D showcase), marquee, menu + filters, burger "anatomy" scroll, combos, about, reviews, FAQ, visit/map, footer | Done |
| 4 | Animations (GSAP), preloader, neon cursor, cart + WhatsApp order, open/closed badge | Done |
| 5 | SEO: meta + share tags, JSON-LD (restaurant, website, FAQ), prerendered content, sitemap, robots, manifest, OG image, README | Done |
| 6 | **Light mode** (cream theme, default) + dark/light toggle + UI/UX audit (contrast, tap targets, keyboard, overflow, flows) aur uske fixes | Done |
| 7 | Launch prep: asli data (menu, prices, hours, photos, exact location), domain + hosting, Search Console | **Next - client ke data ka intezaar** |
| 8 | Optional upgrades (neeche list) | Optional |

## Phase 7 - launch ke liye kya chahiye (client se lena hai)

- Asli menu: item names, prices, veg/non-veg, kaunsi dish bestseller hai
- Asli opening/closing time (Google par sirf "Closes 8 pm" dikh raha tha)
- Dukaan ki 6-10 achhi photos (neon sign, counter, food) -> `gallery`
- Exact Google Maps link + latitude/longitude
- Domain name (ya free `*.netlify.app` se shuru karo)
- WhatsApp number confirm karna (abhi Google listing wala phone number lagaya hai)

Phir: `data/shop-data.js` bharo -> `npm run seo` -> hosting par upload -> Google Business Profile me website jodo.

## Phase 8 - optional upgrades (jo client ko upsell kiya ja sakta hai)

- Asli photo-scanned / artist-made `.glb` models (hero burger ke liye sabse zyada fark padega)
- Hindi / English language toggle
- Google Analytics + WhatsApp click tracking
- Offer popup / "Today's special" banner (data file se on-off)
- QR code poster jo seedha menu page kholta hai (dukaan ke counter ke liye)
- Online payment (UPI link) order ke saath

## Abhi tak kya test hua, kya nahi

Test hua (headless Chromium, desktop 1440/1280 aur mobile 390, light aur dark dono mode):
- Page load, 0 console errors, saare 21 menu items ka 3D viewer, filters, veg-only, cart, FAQ, WhatsApp message text
- **Contrast (WCAG AA):** light aur dark dono me 0 failures (~200 text elements per run); fixes: faint text, chip count, "Save" tag
- **Tap targets (mobile):** koi button/link 44px se chhota nahi (veg toggle ka label wapas dikhaya aur bada kiya)
- **Keyboard:** Tab se har cheez tak pahunch, 3px focus ring, cart popup me focus fasa rehta hai, Esc se band hone par focus wapas cart button par
- **Layout:** 320 / 360 / 414 / 768 / 1024 / 1280 / 1920px par koi horizontal scroll nahi
- **Theme:** toggle, choice yaad rehna (reload ke baad bhi), `theme.mode: "auto"` visitor ki OS setting maanta hai
- Bina WebGL ke fallback (pictures/emoji) theek dikhta hai; `file://` se kholna
- SEO: 1 h1, alt text, button names, JSON-LD parse hota hai

Test NAHI hua (asli device par karna hai):
- Phone/GPU par smoothness. Test machine software rendering par tha (~2 FPS), isliye animation speed
  ka asli andaza nahi mila. Client ko dikhane se pehle apne phone par zarur chala lo.
- Google Maps embed (test machine par internet block tha)
- Lighthouse score, WhatsApp link asli phone par, screen reader (NVDA/TalkBack) ke saath
