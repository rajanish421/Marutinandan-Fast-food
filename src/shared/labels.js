/* Words shown for burger/sandwich layers and menu tags.
   (Shop owner: neeche ka text badalna ho to data/shop-data.js me
    `anatomy.labels` use karo - yahan code me haath mat lagao.)            */

export const LAYER_INFO = {
  'bun-bottom': { name: 'Toasted base bun',  text: 'Soft, lightly toasted and strong enough to hold everything together.' },
  'bun-top':    { name: 'Sesame bun',        text: 'Glossy, golden and sprinkled with sesame seeds.' },
  tikki:        { name: 'Aloo tikki',        text: 'Crispy golden outside, soft and spicy potato inside.' },
  patty:        { name: 'Crispy patty',      text: 'Juicy, crunchy and fried to order.' },
  paneer:       { name: 'Grilled paneer',    text: 'A thick slab of paneer with smoky tandoori masala.' },
  cheese:       { name: 'Cheese slice',      text: 'Melts over the patty and drapes down the sides.' },
  lettuce:      { name: 'Fresh lettuce',     text: 'Cool and crunchy. It keeps every bite fresh.' },
  tomato:       { name: 'Tomato slice',      text: 'Juicy and a little tangy.' },
  onion:        { name: 'Onion rings',       text: 'Sharp, sweet crunch.' },
  sauce:        { name: 'House sauce',       text: 'Our tangy red sauce, spread on generously.' },
  mayo:         { name: 'Creamy mayo',       text: 'Cool, creamy and slightly minty.' },
  pickle:       { name: 'Pickle slices',     text: 'A sour kick to wake up your taste buds.' },
  chutney:      { name: 'Green chutney',     text: 'Fresh mint and coriander with a spicy bite.' },
  cucumber:     { name: 'Cucumber',          text: 'Thin, cool and crisp.' },
  corn:         { name: 'Sweet corn',        text: 'Sweet little pops of flavour.' },
};

export const TAG_LABELS = {
  bestseller: 'Bestseller',
  new: 'New',
  spicy: 'Spicy',
  chef: "Chef's pick",
};

/** name/text for a layer key, with optional shop overrides from data.anatomy.labels */
export function layerInfo(key, overrides = {}) {
  return { ...(LAYER_INFO[key] || { name: key, text: '' }), ...(overrides[key] || {}) };
}
