# Maruti Nandan Fast Food - 3D Website

Static, animated, SEO-ready fast food website. Har dish **3D me** ghumai ja sakti hai
(burger, pizza, momos, roll, sandwich, chowmein, fries, shake).
**Koi bhi change sirf ek file se hota hai: `data/shop-data.js`.**

---

## 1) Computer par chalana (demo ke liye)

Sirf Node.js chahiye (nodejs.org se install). Koi `npm install` nahi chahiye.

```
npm run serve          # phir browser me kholo:  http://localhost:8080
```

> `index.html` ko double-click karke bhi khul jata hai (3D ke saath), lekin asli `.glb` model files
> aur Google Maps ke liye `npm run serve` ya hosting chahiye.

---

## 2) Kuch bhi badalna ho -> `data/shop-data.js`

Is file ko VS Code / Notepad me kholo, text ya number badlo, save karo, browser refresh karo.
Badlav turant dikhta hai. File ke andar har jagah Hinglish me comments likhe hain.

| Kya badalna hai | File me kahan |
|---|---|
| Shop ka naam, phone, WhatsApp number, address, timing | `shop` (section 1) |
| Domain, logo, social links, colours, preloader/cursor on-off | `site`, `theme`, `features` (section 2) |
| Google me dikhne wala title/description/keywords | `seo` (section 3) |
| Home page ka bada text aur buttons | `hero` (section 4) |
| About / "Why us" points | `about` (section 5) |
| Menu items, prices, veg/non-veg, "sold out" | `menu` (section 7) |
| Combo offers | `combos` (section 8) |
| WhatsApp order message, minimum order | `ordering` (section 9) |
| Reviews | `reviews` (section 10) |
| Dukaan ki photos | `gallery` (section 11) |
| FAQ (Google ko bhi helpful) | `faq` (section 12) |

### Light / Dark mode
Website ab **light (cream) mode** me khulti hai. Neon dark look bhi maujood hai.

- `theme.mode: "light"` | `"dark"` | `"auto"` (auto = visitor ke phone/computer ki setting)
- Header me sun/moon button se visitor khud badal sakta hai (uski pasand yaad rakhi jati hai).
  Button hatana ho to `features.themeToggle: false`.
- Colours: `theme.light` aur `theme.dark` (background, surface, text, accent). Brand colours
  (`primary`, `secondary`, `tertiary`) dono modes me same rehte hain.
- `theme.mode` badalne ke baad `npm run seo` chalao, taaki page shuru se sahi mode me khule (flash na ho).

### Naya menu item jodna
`menu` ke andar ek item copy-paste karo aur badlo:

```js
{
  id: "masala-burger", name: "Masala Burger", category: "burgers", price: 69, veg: true,
  tags: ["new"],
  description: "Spicy masala tikki with fresh veggies.",
  model: "burger",
  modelOptions: { layers: ["lettuce", "tikki", "tomato", "sauce"] }
}
```

`id` har item ka alag hona chahiye. Item hatana ho to uska poora `{ ... },` block delete kar do.

### Doosre 3D models
`model` me ye likh sakte ho: `burger`, `pizza`, `momos`, `roll`, `sandwich`, `chowmein`, `fries`, `shake`.
Burger ki layers `modelOptions.layers` se badalti hain (tikki, patty, paneer, cheese, lettuce, tomato,
onion, sauce, mayo, pickle). Baaki models ke options data file ke menu section ke comments me hain.

### Asli (real) 3D model lagana
Agar kisi designer se asli `.glb` model banwaya hai:
1. File ko `assets/models/` folder me daalo (folder bana lo).
2. Us item me likho: `modelUrl: "assets/models/my-burger.glb"`.
Ye procedural model ki jagah dikhega. Chhota rakho (1-3 MB) taaki phone par tez khule.

---

## 3) Upload karne se PEHLE (zaroori)

Menu / text badalne ke baad ek baar ye chalao:

```
npm run seo            # ya:  node tools/seo.js
```

Ye Google, WhatsApp aur Facebook ke bots ke liye `index.html` me title, description, share image,
schema (restaurant + FAQ), `sitemap.xml` aur `robots.txt` pehle se likh deta hai.
**Ye na chalao to website browser me theek dikhegi, lekin Google ko purana content dikhega.**

### Launch checklist
- [ ] `site.url` me asli domain daalo (https:// ke saath, end me `/`)
- [ ] `shop.geo` me exact latitude/longitude (Google Maps -> right click -> pehla number)
- [ ] `shop.hours` me asli opening/closing time (abhi sample hai)
- [ ] Asli menu items aur prices (abhi sample hain)
- [ ] `shop.googleMapsUrl` / `googleReviewsUrl` (Maps -> Share -> Copy link)
- [ ] Dukaan ki photos `gallery` me
- [ ] `npm run seo`
- [ ] Google Business Profile me "Add website" par apna domain daalo
- [ ] Google Search Console me domain add karo aur `sitemap.xml` submit karo

---

## 4) Website live karna (hosting)

Ye static website hai - kisi bhi hosting par chalegi. Sabse aasaan (free):
**Netlify / Cloudflare Pages / Vercel / GitHub Pages** - poora folder drag-and-drop ya connect karo.

Live server par ye chahiye: `index.html`, `assets/`, `data/`, `robots.txt`, `sitemap.xml`, `site.webmanifest`.
(`src/`, `tools/`, `node_modules/`, `package.json` sirf development ke liye hain.)

---

## 5) Code (design / animation) badalna

Sirf tab jab `src/` ya CSS ka kaam karna ho. Menu/text ke liye iski zarurat nahi.

```
npm install            # ek baar
npm run build          # src/ -> assets/js/app.js + scene3d.js, aur SEO bake
npm run dev            # code badalte hi auto-rebuild
```

```
data/shop-data.js      <- SAB KUCH YAHAN SE BADLEGA
index.html             <- page (SEO tags + content tools/seo.js bhar deta hai)
assets/css/            <- design (base, sections, overlays)
assets/js/             <- build ka output (app.js = UI, scene3d.js = 3D)
assets/fonts/          <- self-hosted fonts (Anton, Outfit, Pacifico)
src/ui/                <- page render, animations (GSAP), cart
src/three/             <- 3D engine, viewer, har dish ka model (src/three/models/)
tools/                 <- build.js, seo.js, serve.js
```

---

## 6) Client ko dikhane ka tareeka (2 minute demo)

1. Phone par kholo: hero me burger ghoom raha hai, neon heading animate hoti hai.
2. Menu me kisi dish par tap karo -> 3D viewer: ungli se ghumao, pinch se zoom, **Explode** dabao.
3. Neeche scroll karo: burger scroll ke saath khulta hai aur har layer dikhti hai.
4. 2-3 items add karo -> **Order on WhatsApp** -> poora order message ban jata hai.
5. `shop-data.js` me ek price badlo, refresh karo - "dekho, sab kuch ek file se badalta hai."

---

## Aam dikkatein

- **3D nahi dikh raha:** purana browser / WebGL band hai. Site phir bhi chalti hai (dishes pictures ke roop me dikhti hain).
- **Badlav nahi dikha:** browser me Ctrl+Shift+R (hard refresh).
- **Google me purana text:** `npm run seo` chalao aur dobara upload karo.
- **`npm run build` me esbuild nahi mila:** pehle `npm install` chalao (internet chahiye).
