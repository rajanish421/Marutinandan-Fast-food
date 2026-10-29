/* Small helpers shared by the browser code AND the Node SEO script (no DOM here). */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_SHORT = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const DAY_LONG = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

export function money(n, currency = '₹') {
  const v = Number(n) || 0;
  return currency + v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Tiny stable hash of the data object - lets the page know if shop-data.js changed after the SEO build. */
export function dataHash(data) {
  const s = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** "20:00" -> "8:00 PM" */
export function t12(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m || 0).padStart(2, '0')} ${ap}`;
}
// short form for tight spaces: 11:00 AM -> 11 AM
const t12s = (hhmm) => t12(hhmm).replace(':00', '');

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

/** Group days that share the same hours: [{ days:['mon','tue'], label:'Mon–Tue', hours:['11:00','20:00']|null }] */
export function groupHours(hours = {}) {
  const groups = [];
  DAYS.forEach((d) => {
    const h = hours[d] || null;
    const key = h ? h.join('-') : 'closed';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(d);
    else groups.push({ key, days: [d], hours: h });
  });
  return groups.map((g) => ({
    days: g.days,
    hours: g.hours,
    label: g.days.length === 1 ? DAY_SHORT[g.days[0]] : `${DAY_SHORT[g.days[0]]}–${DAY_SHORT[g.days[g.days.length - 1]]}`,
  }));
}

/** Current weekday + minutes in the shop's own timezone. */
export function shopNow(tz = 'Asia/Kolkata', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { day: get('weekday').toLowerCase().slice(0, 3), min: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** { open:boolean, text:string, today:'mon'|... } */
export function openStatus(shop, now = new Date()) {
  const hours = shop.hours || {};
  const { day, min } = shopNow(shop.timezone || 'Asia/Kolkata', now);
  const idx = DAYS.indexOf(day);
  const today = hours[day];
  if (today) {
    const o = toMin(today[0]), c = toMin(today[1]);
    const isOpen = c > o ? (min >= o && min < c) : (min >= o || min < c);
    if (isOpen) return { open: true, today: day, text: `Open now, closes ${t12(today[1])}`, short: `Open until ${t12s(today[1])}` };
    if (min < o) return { open: false, today: day, text: `Closed now, opens today at ${t12(today[0])}`, short: `Opens ${t12s(today[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = DAYS[(idx + i) % 7];
    if (hours[d]) return { open: false, today: day, text: `Closed now, opens ${i === 1 ? 'tomorrow' : DAY_SHORT[d]} at ${t12(hours[d][0])}`, short: `Closed · opens ${i === 1 ? '' : DAY_SHORT[d] + ' '}${t12s(hours[d][0])}` };
  }
  return { open: false, today: day, text: 'Closed', short: 'Closed' };
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
