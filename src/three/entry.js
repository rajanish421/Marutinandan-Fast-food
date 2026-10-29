/* Entry point of assets/js/scene3d.js  (everything 3D lives in this bundle).
   app.js is loaded first and creates window.MN (cart, data, events).            */
import { Thumbs, LiveHover, initCards } from './thumbs.js';
import { initViewer } from './viewer.js';
import { initHero } from './hero.js';
import { initAnatomy } from './anatomy.js';

const MN = (window.MN = window.MN || {});
MN.data = MN.data || window.SHOP_DATA;

function ready() {
  MN.ready3D = true;
  window.dispatchEvent(new Event('mn:3d-ready'));
}

async function boot() {
  const root = document.documentElement;
  if (!MN.data) return ready();

  let thumbs, live;
  try {
    thumbs = new Thumbs(MN.data.theme);
    live = new LiveHover(MN.data.theme);
  } catch (err) {
    console.warn('[3D] WebGL is not available - showing pictures only.', err);
    root.classList.add('no-3d');
    return ready();
  }
  root.classList.add('has-3d');

  try {
    initViewer(MN);
    initCards(MN, { thumbs, live });
    initAnatomy(MN).catch((e) => console.warn('[3D] anatomy:', e));
    const hero = await initHero(MN);
    if (hero) {
      if (MN.introDone) hero.intro();
      else window.addEventListener('mn:intro', () => hero.intro(), { once: true });
    }
  } catch (err) {
    console.warn('[3D] setup problem:', err);
  }
  ready();
}

boot();
