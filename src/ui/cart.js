/* =====================================================================
   CART  -  order list + WhatsApp message.
   Browser me yaad rakhta hai (localStorage), taaki page refresh par
   order gayab na ho. Menu se hata hua item apne aap nikal jata hai.
   ===================================================================== */
import { money } from './util.js';

export function createCart(MN) {
  const data = MN.data;
  const ord = data.ordering || {};
  const cur = ord.currency || '₹';
  const items = new Map((data.menu || []).map((m) => [m.id, m]));
  const combos = new Map((data.combos || []).map((c) => [c.id, c]));
  const icons = new Map((data.categories || []).map((c) => [c.id, c.icon]));
  const KEY = 'mn-order:' + (data.shop.whatsapp || data.shop.name);
  const FORM = KEY + ':form';
  const listeners = new Set();

  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* private mode etc. */ } };

  const valid = (key) => {
    const [t, id] = [key.slice(0, 1), key.slice(2)];
    if (t === 'i') { const it = items.get(id); return !!it && !it.soldOut; }
    if (t === 'c') return combos.has(id);
    return false;
  };

  let lines = (read(KEY) || []).filter((l) => l && typeof l.key === 'string' && l.qty > 0 && valid(l.key)).map((l) => ({ key: l.key, qty: Math.min(99, l.qty | 0) }));

  const emit = () => { write(KEY, lines); listeners.forEach((fn) => fn(api)); };

  function resolve(l) {
    const t = l.key.slice(0, 1), id = l.key.slice(2);
    if (t === 'c') {
      const c = combos.get(id);
      return { key: l.key, type: 'combo', id, name: c.name, unit: c.price, qty: l.qty, total: c.price * l.qty, icon: '🎁', sub: c.description };
    }
    const it = items.get(id);
    return { key: l.key, type: 'item', id, name: it.name, unit: it.price, qty: l.qty, total: it.price * l.qty, icon: icons.get(it.category) || '🍽️' };
  }

  const bump = (key, d) => {
    if (!valid(key)) return;
    const l = lines.find((x) => x.key === key);
    if (l) { l.qty = Math.max(0, Math.min(99, l.qty + d)); if (!l.qty) lines = lines.filter((x) => x !== l); }
    else if (d > 0) lines.push({ key, qty: 1 });
    emit();
  };

  const api = {
    add: (id) => bump('i:' + id, 1),
    addCombo: (id) => bump('c:' + id, 1),
    inc: (key) => bump(key, 1),
    dec: (key) => bump(key, -1),
    remove: (key) => { lines = lines.filter((l) => l.key !== key); emit(); },
    clear: () => { lines = []; emit(); },
    qty: (id) => (lines.find((l) => l.key === 'i:' + id) || { qty: 0 }).qty,
    get lines() { return lines.map(resolve); },
    get count() { return lines.reduce((n, l) => n + l.qty, 0); },
    get total() { return lines.reduce((s, l) => s + resolve(l).total, 0); },
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },

    loadForm: () => read(FORM) || {},
    saveForm: (v) => write(FORM, v),

    /** text that goes into the WhatsApp chat */
    message(form = {}) {
      const rows = api.lines.map((l, i) => `${i + 1}. ${l.name}${l.type === 'combo' ? ' (combo)' : ''} x ${l.qty} = ${money(l.total, cur)}`);
      const out = [ord.greeting || 'Hello! I want to order:', '', ...rows, '', `Total: ${money(api.total, cur)}`];
      if (form.name) out.push('', `Name: ${form.name}`);
      if (form.note) out.push(`Address / pickup note: ${form.note}`);
      return out.join('\n');
    },
    whatsappUrl(form) {
      return `https://wa.me/${String(data.shop.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(api.message(form))}`;
    },
    minOk: () => !ord.minOrder || api.total >= ord.minOrder,
  };
  return api;
}
