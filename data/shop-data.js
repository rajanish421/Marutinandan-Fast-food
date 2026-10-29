/* =====================================================================
   MARUTI NANDAN FAST FOOD  -  SHOP DATA
   ---------------------------------------------------------------------
   ⭐ Website me kuchh bhi badalna ho to SIRF YEH FILE edit karo.
      (naam, phone, menu, prices, photos, reviews, colours, SEO ...)

   Kaise use karein:
   1. Is file ko kisi bhi text editor (VS Code / Notepad) me kholo.
   2. Neeche jo bhi text ya number badalna hai, badlo. Quotes " " ke andar
      hi likhna. Comma , mat hatana.
   3. Save karo aur browser me page refresh karo  ->  badlav turant dikhega.
   4. Website live (hosting) karne se pehle ek baar  `node tools/seo.js`
      chalao, taaki Google ke liye SEO tags/menu bhi update ho jayein.

   ⚠️  Jo data "SAMPLE" likha hai woh sirf demo ke liye hai
       (menu items, prices, FAQ, timing etc.) - asli data se badal dena.
   ✅  Jo data Google listing se liya gaya hai: shop ka naam, address,
       phone, rating (3.9 / 7 reviews), price range, 3 reviews.
   ===================================================================== */

window.SHOP_DATA = {

  /* ===================================================================
     1) DUKAAN KI JAANKARI
     =================================================================== */
  shop: {
    name: "Maruti Nandan Fast Food",
    shortName: "Maruti Nandan",              // logo / chhote jagah ke liye
    tagline: "Swad jo dil jeet le",
    cuisine: "Fast Food",
    priceRange: "₹200–400",                  // per person (Google listing)

    phone: "+91 95597 36329",                // jaise dikhana hai waisa likho
    whatsapp: "919559736329",                // country code ke saath, bina + / space ke
    email: "",                               // khali chhod sakte ho

    address: {
      line1: "Front of 1 India Family Mart",
      line2: "Kasia Bazaar",
      city: "Kushinagar",
      state: "Uttar Pradesh",
      pincode: "274402",
      country: "IN"
    },

    // Google Maps se exact latitude/longitude daal dena (SEO ke liye). Abhi approx hai.
    geo: { lat: 26.7408, lng: 83.8884 },

    // Map ke liye search text (ya neeche googleMapsUrl me apna Google Maps link daalo)
    mapQuery: "Maruti Nandan fast food, Kasia Bazaar, Kushinagar, Uttar Pradesh 274402",
    googleMapsUrl: "",                       // "Share" -> "Copy link" wala Google Maps link
    googleReviewsUrl: "",                    // khali ho to Maps search link use hoga

    // Timing - 24 ghante format "HH:MM". Band din ke liye null likho.
    // SAMPLE: Google par sirf "Closes 8 pm" dikh raha tha, opening time asli se badal lena.
    timezone: "Asia/Kolkata",
    hours: {
      mon: ["11:00", "20:00"],
      tue: ["11:00", "20:00"],
      wed: ["11:00", "20:00"],
      thu: ["11:00", "20:00"],
      fri: ["11:00", "20:00"],
      sat: ["11:00", "20:00"],
      sun: ["11:00", "20:00"]
    },

    // Google rating (listing se). Sirf dikhane ke liye.
    rating: { value: 3.9, count: 7, source: "Google" }
  },


  /* ===================================================================
     2) WEBSITE / SOCIAL / BRANDING
     =================================================================== */
  site: {
    // ⚠️ Domain milte hi yahan apna asli address daalo (https:// ke saath, end me /)
    url: "https://www.example.com/",
    language: "en-IN",
    logo: "",                                // optional: "assets/img/logo.png" (khali = text logo)
    ogImage: "assets/img/og-image.png",      // WhatsApp/Facebook share image (1200x630)
    social: {
      instagram: "",                         // pura link: "https://instagram.com/..."
      facebook: "",
      youtube: ""
    },
    // Google Analytics (optional) - "G-XXXXXXXXXX"
    googleAnalyticsId: "",
    // Developer credit footer me (khali = nahi dikhega)
    credit: { text: "", url: "" }
  },

  theme: {
    // "light" = ujla (cream) look  |  "dark" = neon dark look  |  "auto" = visitor ke phone/computer ki setting
    mode: "light",

    // Brand colours (dono modes me same) - hex code
    primary: "#ff2e93",                      // neon pink
    secondary: "#ffd23f",                    // neon yellow
    tertiary: "#8b5cf6",                     // purple

    // Light mode ke colours
    light: {
      background: "#fff8ef",                 // cream
      surface: "#ffffff",                    // cards
      text: "#24122f",                       // gehra plum (padhne me aasaan)
      accent: "#9a5400"                      // prices / icons ka gehra amber (peela text white par dikhta nahi)
    },
    // Dark (neon) mode ke colours
    dark: {
      background: "#0a0510",
      surface: "#150b20",
      text: "#fff6ef"
    }
  },

  // Animations on/off
  features: {
    themeToggle: true,                       // upar sun/moon button - visitor light/dark badal sake
    preloader: true,                         // shuru wali loading screen
    customCursor: true,                      // computer par neon cursor ring
    scrollProgress: true                     // upar ki pink progress line
  },


  /* ===================================================================
     3) SEO  (Google me dikhne ke liye)
     =================================================================== */
  seo: {
    title: "Maruti Nandan Fast Food | Burgers, Momos, Rolls & Pizza in Kasia, Kushinagar",
    description: "Hungry in Kasia Bazaar, Kushinagar? Maruti Nandan Fast Food serves fresh burgers, momos, paneer rolls, pizza, chowmein, fries & shakes. See every dish in 3D and order on WhatsApp.",
    keywords: [
      "fast food in Kushinagar", "burger in Kasia", "momos in Kushinagar",
      "paneer roll Kasia Bazaar", "best fast food near Kasia", "Maruti Nandan fast food"
    ]
  },


  /* ===================================================================
     4) HOME PAGE (HERO) KA TEXT
     =================================================================== */
  hero: {
    eyebrow: "Fast food in Kasia, Kushinagar",
    headline: ["Swad jo", "dil jeet le"],   // 2 lines: pehli line bold, doosri neon style
    text: "Crispy burgers, pillowy momos, loaded rolls & more - made fresh at Maruti Nandan. Spin every dish in 3D, then order on WhatsApp in seconds.",
    primaryButton: "Order on WhatsApp",
    secondaryButton: "Explore the 3D Menu",
    // Hero me ghoomne wale 3D items (menu ke item "id" likho)
    showcase: ["aloo-tikki-burger", "paneer-roll", "veg-steamed-momos", "margherita-pizza", "cold-coffee"]
  },

  // Chalti hui patti (marquee) ka text - khali [] ho to categories ke naam use honge
  marquee: ["Burgers", "Momos", "Paneer Rolls", "Pizza", "Chowmein", "Sandwich", "Fries", "Shakes"],


  /* ===================================================================
     5) ABOUT / WHY US
     =================================================================== */
  about: {
    title: "Small shop. Big flavour.",
    text: "Maruti Nandan Fast Food is a neon-lit favourite in Kasia Bazaar, right in front of 1 India Family Mart. From a crispy aloo tikki burger to hot momos and our famous paneer roll - everything is made fresh, served hot and priced for everyday cravings.",
    features: [
      { icon: "flame",  title: "Made Fresh",        text: "Cooked hot to order - never reheated, never boring." },
      { icon: "smile",  title: "Generous Portions", text: "Loaded fillings and full plates. Our regulars call it 'paisa vasool'." },
      { icon: "tag",    title: "Pocket Friendly",   text: "Tasty bites for every budget - most dishes between ₹50 and ₹150." },
      { icon: "sparkles", title: "Great Vibes",     text: "Bright neon corner spot, perfect for friends, family and evening snacks." }
    ]
  },


  /* ===================================================================
     6) BURGER 3D "ANATOMY" SECTION (scroll karne par burger khulta hai)
     =================================================================== */
  anatomy: {
    enabled: true,
    itemId: "double-decker-burger",          // kaun sa burger dikhana hai (menu ka id)
    title: "Inside our Double Decker",
    text: "Keep scrolling. The burger opens up and shows you every layer.",
    // Kisi layer ka naam/description badalna ho to:  layerKey: { name: "...", text: "..." }
    labels: {}
  },


  /* ===================================================================
     7) MENU  -  categories + items
     =================================================================== */
  sections: {
    menu:    { title: "Tap. Spin. Crave.", text: "Spin any dish in 3D, zoom in close, then add it to your order." },
    combos:  { title: "Combo deals", text: "Jodi me khao, paise bachao." },
    reviews: { title: "What Kasia says", text: "Real reviews from our Google listing." },
    faq:     { title: "Quick answers", text: "" },
    visit:   { title: "Come hungry", text: "Kasia Bazaar, right in front of 1 India Family Mart." },
    gallery: { title: "Inside the shop", text: "" }
  },

  // Category ka "id" neeche menu items me use hota hai. icon = koi bhi emoji.
  categories: [
    { id: "burgers",  name: "Burgers",  icon: "🍔" },
    { id: "pizza",    name: "Pizza",    icon: "🍕" },
    { id: "momos",    name: "Momos",    icon: "🥟" },
    { id: "rolls",    name: "Rolls",    icon: "🌯" },
    { id: "sandwich", name: "Sandwich", icon: "🥪" },
    { id: "noodles",  name: "Chowmein", icon: "🍜" },
    { id: "snacks",   name: "Snacks",   icon: "🍟" },
    { id: "drinks",   name: "Shakes & Coffee", icon: "🥤" }
  ],

  /* -------------------------------------------------------------------
     MENU ITEMS (SAMPLE)
     Har item aisa dikhta hai:
       id          : unique naam (chhote letters, - ke saath, space nahi)
       name        : dish ka naam
       category    : upar wali categories me se koi ek id
       price       : sirf number (₹ apne aap lagega)
       description : 1-2 line ka text
       veg         : true = hara dot, false = laal dot
       tags        : ["bestseller", "new", "spicy", "chef"]  (jo chahiye woh)
       model       : 3D model ka type -> burger, pizza, momos, roll, sandwich,
                     chowmein, fries, shake
       modelOptions: us model ko customize karne ke options (neeche guide dekho)
       modelUrl    : (optional) asli 3D file "assets/models/xyz.glb" - ho to woh
                     procedural model ki jagah dikhegi
       soldOut     : true karo to "Sold out" dikhega
     ------------------------------------------------------------------- */
  menu: [

    /* ---------- BURGERS ----------
       modelOptions.layers = neeche se upar ki layers (buns apne aap lagte hain)
       layers ke options: "tikki", "patty", "paneer", "cheese", "lettuce",
                          "tomato", "onion", "sauce", "mayo", "pickle"          */
    {
      id: "aloo-tikki-burger", name: "Aloo Tikki Burger", category: "burgers", price: 49, veg: true,
      tags: ["bestseller"],
      description: "Crispy golden aloo tikki, crunchy lettuce, onion and our tangy house sauce in a toasted sesame bun.",
      model: "burger",
      modelOptions: { layers: ["lettuce", "tikki", "tomato", "onion", "sauce"] }
    },
    {
      id: "cheese-burger", name: "Cheese Loaded Burger", category: "burgers", price: 79, veg: true,
      tags: ["new"],
      description: "Aloo tikki topped with a thick melty cheese slice, fresh tomato and creamy sauce.",
      model: "burger",
      modelOptions: { layers: ["lettuce", "tikki", "cheese", "tomato", "sauce"] }
    },
    {
      id: "double-decker-burger", name: "Double Decker Burger", category: "burgers", price: 119, veg: true,
      tags: ["chef"],
      description: "Two patties, double cheese and a full garden of veggies. Our tallest, loudest burger.",
      model: "burger",
      modelOptions: { layers: ["lettuce", "tikki", "cheese", "paneer", "cheese", "tomato", "onion", "sauce"] }
    },
    {
      id: "paneer-tandoori-burger", name: "Paneer Tandoori Burger", category: "burgers", price: 89, veg: true,
      tags: ["spicy"],
      description: "Thick paneer slab with smoky tandoori masala, onion rings and mint mayo.",
      model: "burger",
      modelOptions: { layers: ["onion", "paneer", "mayo", "lettuce", "tomato"] }
    },
    {
      id: "crispy-chicken-burger", name: "Crispy Chicken Burger", category: "burgers", price: 99, veg: false,
      tags: [],
      description: "Juicy crispy chicken patty, cheese, lettuce and sauce. (Non-veg example item)",
      model: "burger",
      modelOptions: { layers: ["lettuce", "patty", "cheese", "tomato", "sauce"] }
    },

    /* ---------- PIZZA ----------
       modelOptions.toppings: "basil", "tomato", "capsicum", "onion", "olive",
                              "corn", "paneer", "pepperoni"                      */
    {
      id: "margherita-pizza", name: "Margherita Pizza", category: "pizza", price: 129, veg: true,
      tags: ["bestseller"],
      description: "Classic cheesy pizza with rich tomato sauce and fresh basil on a soft, golden crust.",
      model: "pizza",
      modelOptions: { toppings: ["basil", "tomato"] }
    },
    {
      id: "veggie-supreme-pizza", name: "Veggie Supreme Pizza", category: "pizza", price: 179, veg: true,
      tags: ["new"],
      description: "Loaded with capsicum, onion, olives, sweet corn and paneer. Every bite is a party.",
      model: "pizza",
      modelOptions: { toppings: ["capsicum", "onion", "olive", "corn", "paneer", "basil"] }
    },

    /* ---------- MOMOS ----------
       modelOptions.style : "steamed", "fried", "tandoori"
       modelOptions.serve : "steamer" (bamboo basket) ya "plate"                 */
    {
      id: "veg-steamed-momos", name: "Veg Steamed Momos (6 pcs)", category: "momos", price: 50, veg: true,
      tags: ["bestseller"],
      description: "Soft, juicy steamed dumplings stuffed with fresh veggies. Served with fiery red chutney.",
      model: "momos",
      modelOptions: { style: "steamed", serve: "steamer", count: 6 }
    },
    {
      id: "paneer-fried-momos", name: "Paneer Fried Momos (6 pcs)", category: "momos", price: 80, veg: true,
      tags: [],
      description: "Golden crispy outside, spiced paneer inside. Dip it in our special chutney.",
      model: "momos",
      modelOptions: { style: "fried", serve: "plate", count: 6 }
    },
    {
      id: "tandoori-momos", name: "Tandoori Momos (6 pcs)", category: "momos", price: 90, veg: true,
      tags: ["spicy", "new"],
      description: "Smoky, char-grilled momos coated in tandoori masala. Spicy, smoky, addictive.",
      model: "momos",
      modelOptions: { style: "tandoori", serve: "plate", count: 6 }
    },

    /* ---------- ROLLS ----------
       modelOptions.filling : "paneer", "veg"
       modelOptions.sauce   : sauce ka colour (hex)                              */
    {
      id: "paneer-roll", name: "Paneer Roll", category: "rolls", price: 70, veg: true,
      tags: ["bestseller"],
      description: "Our customers' favourite! Grilled paneer, onion and green chutney rolled in a flaky paratha.",
      model: "roll",
      modelOptions: { filling: "paneer", sauce: "#7bbf3a" }
    },
    {
      id: "schezwan-veg-roll", name: "Schezwan Veg Roll", category: "rolls", price: 60, veg: true,
      tags: ["spicy"],
      description: "Crunchy veggies tossed in spicy schezwan sauce, wrapped hot and ready to go.",
      model: "roll",
      modelOptions: { filling: "veg", sauce: "#d2371a" }
    },

    /* ---------- SANDWICH ----------
       modelOptions.fillings: "chutney", "cucumber", "tomato", "onion",
                              "cheese", "corn", "lettuce"                        */
    {
      id: "grilled-veg-sandwich", name: "Grilled Veg Sandwich", category: "sandwich", price: 60, veg: true,
      tags: [],
      description: "Toasted bread with green chutney, cucumber, tomato and onion. Crispy outside, fresh inside.",
      model: "sandwich",
      modelOptions: { fillings: ["chutney", "cucumber", "tomato", "onion"] }
    },
    {
      id: "cheese-corn-sandwich", name: "Cheese Corn Sandwich", category: "sandwich", price: 80, veg: true,
      tags: [],
      description: "Sweet corn and gooey cheese pressed between golden grilled bread.",
      model: "sandwich",
      modelOptions: { fillings: ["cheese", "corn", "tomato", "cheese"] }
    },

    /* ---------- CHOWMEIN ----------
       modelOptions.style : "hakka" ya "schezwan"                                */
    {
      id: "hakka-chowmein", name: "Hakka Chowmein", category: "noodles", price: 60, veg: true,
      tags: [],
      description: "Wok-tossed noodles with crunchy carrot, cabbage and capsicum. Simple, hot, satisfying.",
      model: "chowmein",
      modelOptions: { style: "hakka" }
    },
    {
      id: "schezwan-chowmein", name: "Schezwan Chowmein", category: "noodles", price: 80, veg: true,
      tags: ["spicy"],
      description: "Fiery schezwan noodles with a smoky wok flavour for spice lovers.",
      model: "chowmein",
      modelOptions: { style: "schezwan" }
    },

    /* ---------- SNACKS ----------
       modelOptions.style : "classic" ya "periperi"                              */
    {
      id: "french-fries", name: "French Fries", category: "snacks", price: 60, veg: true,
      tags: ["bestseller"],
      description: "Golden, crispy and perfectly salted fries with a side of ketchup.",
      model: "fries",
      modelOptions: { style: "classic" }
    },
    {
      id: "peri-peri-fries", name: "Peri Peri Fries", category: "snacks", price: 80, veg: true,
      tags: ["spicy"],
      description: "Crispy fries dusted with tangy peri peri masala. Warning: you can't stop at one.",
      model: "fries",
      modelOptions: { style: "periperi" }
    },

    /* ---------- DRINKS ----------
       modelOptions.liquid  : [neeche ka colour, upar ka colour] (hex)
       modelOptions.cream   : true / false  (whipped cream)
       modelOptions.topping : "cherry", "choco", "mango", "none"                 */
    {
      id: "cold-coffee", name: "Cold Coffee", category: "drinks", price: 60, veg: true,
      tags: ["bestseller"],
      description: "Thick, chilled and creamy cold coffee topped with whipped cream and chocolate.",
      model: "shake",
      modelOptions: { liquid: ["#3a2013", "#a87a52"], cream: true, topping: "choco", straw: "#ff3d7f" }
    },
    {
      id: "chocolate-shake", name: "Chocolate Shake", category: "drinks", price: 80, veg: true,
      tags: [],
      description: "Rich chocolate milkshake with a cherry on top. Pure happiness in a glass.",
      model: "shake",
      modelOptions: { liquid: ["#3d2014", "#7a4326"], cream: true, topping: "cherry", straw: "#ffd23f" }
    },
    {
      id: "mango-shake", name: "Mango Shake", category: "drinks", price: 70, veg: true,
      tags: ["new"],
      description: "Fresh, thick mango shake with juicy mango cubes. Summer in a glass, all year.",
      model: "shake",
      modelOptions: { liquid: ["#ffa51f", "#ffd45a"], cream: false, topping: "mango", straw: "#35d0c4" }
    }
  ],


  /* ===================================================================
     8) COMBO OFFERS (SAMPLE)
        items : menu ke ids (ek hi id do baar likh sakte ho)
        price : combo ki final price   |  oldPrice : (optional) kati hui price
     =================================================================== */
  combos: [
    {
      id: "combo-burger-meal", name: "Burger Meal", price: 149, oldPrice: 169,
      items: ["aloo-tikki-burger", "french-fries", "cold-coffee"],
      description: "Aloo Tikki Burger + French Fries + Cold Coffee.", badge: "Best value"
    },
    {
      id: "combo-momos-party", name: "Momos Party Pack", price: 199, oldPrice: 220,
      items: ["veg-steamed-momos", "tandoori-momos", "chocolate-shake"],
      description: "Steamed Momos + Tandoori Momos + Chocolate Shake.", badge: "Sharing"
    },
    {
      id: "combo-roll-fries", name: "Roll & Fries", price: 119, oldPrice: 130,
      items: ["paneer-roll", "peri-peri-fries"],
      description: "Paneer Roll + Peri Peri Fries.", badge: "Quick bite"
    }
  ],


  /* ===================================================================
     9) ORDERING (cart + WhatsApp)
     =================================================================== */
  ordering: {
    enabled: true,
    currency: "₹",
    greeting: "Hello Maruti Nandan! Mujhe ye order karna hai:",
    askName: true,
    askAddress: true,                        // delivery / pickup ka note
    note: "Order WhatsApp par confirm hoga. Payment shop par ya delivery ke time.",
    minOrder: 0
  },


  /* ===================================================================
     10) REVIEWS  (Google listing se liye gaye - naam jodna ho to jod lo)
     =================================================================== */
  reviews: [
    { name: "Google Reviewer", rating: 5, source: "Google", text: "Best place for snacks 😋 And beautiful environment." },
    { name: "Google Reviewer", rating: 5, source: "Google", text: "Great taste, generous portion, and excellent quality." },
    { name: "Google Reviewer", rating: 5, source: "Google", text: "I love paneer roll of here." }
  ],


  /* ===================================================================
     11) GALLERY (optional) - dukaan ki photos
         Photos "assets/img/gallery/" me daalo aur yahan likho. Khali = section nahi dikhega.
         Example:  { src: "assets/img/gallery/shop-1.jpg", alt: "Neon sign at Maruti Nandan" }
     =================================================================== */
  gallery: [],


  /* ===================================================================
     12) FAQ (SAMPLE) - Google ko bhi helpful hota hai
     =================================================================== */
  faq: [
    {
      q: "Where is Maruti Nandan Fast Food located?",
      a: "We are in Kasia Bazaar, Kushinagar (Uttar Pradesh 274402), right in front of 1 India Family Mart."
    },
    {
      q: "What are your opening hours?",
      a: "We are open every day from 11:00 AM to 8:00 PM. (Sample timing - edit in shop-data.js)"
    },
    {
      q: "Can I order on WhatsApp?",
      a: "Yes! Pick your dishes on this website, tap 'Order on WhatsApp' and your order reaches us instantly. You can also call +91 95597 36329."
    },
    {
      q: "Do you have vegetarian options?",
      a: "Absolutely. Most of our menu is vegetarian, marked with a green dot. Non-veg items carry a red dot."
    },
    {
      q: "What is the average cost per person?",
      a: "A full meal usually costs ₹200–400 per person, while single snacks start from just ₹50."
    }
  ]
};
