/* Scroll story: the burger opens up layer by layer while you scroll.
   The page (app.js) sends  mn:anatomy { explode, active, spin }  - we just draw it. */
import {
  createRenderer, createScene, makeCamera, placeCamera, fitDistance, resizeTo,
  Showpiece, buildItemModel, viewFor, reducedMotion,
} from './stage.js';

export async function initAnatomy(MN) {
  const host = document.querySelector('[data-anatomy3d]');
  const cfg = MN.data.anatomy;
  if (!host || !cfg || cfg.enabled === false) return null;
  const item = (MN.data.menu || []).find((i) => i.id === cfg.itemId);
  if (!item) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'anatomy__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const renderer = createRenderer({ canvas, maxDpr: 2 });
  const scene = createScene(renderer, MN.data.theme);
  const camera = makeCamera(26);
  const piece = new Showpiece(await buildItemModel(item));
  scene.add(piece.root);
  const view = viewFor(item);

  let dist = 10;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (w < 4 || h < 4) return;
    resizeTo(renderer, camera, w, h);
    dist = fitDistance(camera, piece.radius * 1.02, 1.0);
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const S = { explode: 0, explodeT: 0, active: -1, spin: 0, spinT: 0 };
  window.addEventListener('mn:anatomy', (e) => {
    const d = e.detail || {};
    S.explodeT = d.explode ?? S.explodeT;
    S.spinT = d.spin ?? S.spinT;
    if (d.active !== undefined && d.active !== S.active) {
      S.active = d.active;
      piece.built.highlight && piece.built.highlight(S.active, S.active < 0 ? 0 : 0.8, MN.data.theme.primary || '#ff2e93');
    }
  });

  let visible = false, last = performance.now(), raf = 0;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);

  const still = reducedMotion();
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    const f = Math.min(1, dt * (still ? 30 : 6));
    S.explode += (S.explodeT - S.explode) * f;
    S.spin += (S.spinT - S.spin) * f;
    if (piece.supportsExplode) piece.setExplode(S.explode);
    piece.setSpin(view.yaw + S.spin * Math.PI * 1.5);
    placeCamera(camera, dist, 0.2 + 0.1 * S.explode);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  return { piece, renderer };
}
