/* Inline SVG icons (stroke style). icon('name') -> string. */
const P = {
  flame: '<path d="M12 3c.8 3.2-3.2 5.2-3.2 9.2a4.9 4.9 0 0 0 9.8 0c0-2.2-1-3.7-2.2-5.3-.4 2-1.7 3-2.9 3.1.6-3-.5-5.2-1.5-7z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.3 14.3a4.6 4.6 0 0 0 7.4 0M9 9.6h.01M15 9.6h.01"/>',
  tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="7.8" cy="8.8" r="1.1"/>',
  sparkles: '<path d="M11 3l1.7 5L18 9.7l-5.3 1.7L11 16.5l-1.7-5.1L4 9.7 9.3 8zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  phone: '<path d="M5.2 3.8h3.3l1.7 4.3-2.1 1.4a11 11 0 0 0 5.4 5.4l1.4-2.1 4.3 1.7v3.3a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 3.2 5.9a2 2 0 0 1 2-2.1z"/>',
  whatsapp: '<path d="M20.2 11.6a8.1 8.1 0 0 1-11.9 7.1L3.9 20l1.3-4.2a8.1 8.1 0 1 1 15-4.2z"/><path d="M9.2 8.2c-.3.6-.3 1.4.2 2.4a8 8 0 0 0 3.9 3.5c.9.4 1.6.3 2.1-.2l.5-.8-1.9-1-.9.8a4.6 4.6 0 0 1-2-2l.7-.9-.9-2z"/>',
  pin: '<path d="M12 21s7-6 7-11.3a7 7 0 1 0-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>',
  bag: '<path d="M5.2 8.3h13.6l-1 11.7H6.2z"/><path d="M9 8.3V6.8a3 3 0 0 1 6 0v1.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  nav: '<path d="M3.5 11l17-7.5-7.5 17-2-7.5z"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M17 7h.01"/>',
  facebook: '<path d="M14.2 8H17V4h-2.8A4.2 4.2 0 0 0 10 8.2V11H7v4h3v6h4v-6h2.8l.8-4H14V8.6c0-.4.2-.6.2-.6z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10.5 9.5v5l4.2-2.5z"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11m0-1V5a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v5.5A6.5 6.5 0 0 1 10.5 20h-.4a6 6 0 0 1-4.6-2.1L3 14.6a1.6 1.6 0 0 1 2.4-2L8 15"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2z"/>',
  quote: '<path d="M9.5 6C6.5 7 4.5 9.5 4.5 13v5h6v-6H7.6c.2-2 1.2-3.2 3-3.9zM19.5 6c-3 1-5 3.5-5 7v5h6v-6h-2.9c.2-2 1.2-3.2 3-3.9z" fill="currentColor" stroke="none"/>',
};
export function icon(name, cls = 'i') {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
}
export const star = '<svg class="star" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>';
export const stars = (n = 5) => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${star.repeat(Math.max(0, Math.min(5, Math.round(n))))}</span>`;
