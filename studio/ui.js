// Icons, food art and small controls shared by every page. Pictures do the explaining so
// the labels can stay short. (The test version in demo/ uses the same set.)

import { escapeHtml } from './i18n.js';

// Stroke icons on a 24×24 grid.
const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19.5c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.4 0 4 1.6 4.6 4.5"/>',
  walk: '<circle cx="13.5" cy="4" r="2"/><path d="M11 21l1.8-6.5L15.5 17v4M9 12.5 10.8 8l3.4 1.6 2.3 3.2M10.8 8 8 9.6 6.8 13"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.5"/>',
  radius: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2.5 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  table: '<path d="M3.5 9.5h17M6.5 9.5v10M17.5 9.5v10M5 9.5l1.5-4h11l1.5 4"/>',
  phone: '<path d="M5.5 3.5h3l1.8 4.5-2.3 1.4a11 11 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3.5 5.5a2 2 0 0 1 2-2z"/>',
  sms: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" stroke-width="3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5M4.5 9.5v10.5h15V9.5M10 20v-5h4v5"/><path d="M4 9.5c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 2.5 3h1c1.2 0 2.5-1.3 2.5-3 0 1.7 1.3 3 3 3s3-1.3 3-3"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  nav: '<path d="M4 11 20 4l-7 16-2-7z"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  flag: '<path d="M5.5 21V4M5.5 4h11l-2 4 2 4h-11"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01" stroke-width="2.4"/>',
  refresh: '<path d="M20 11.5A8 8 0 1 1 17.7 6"/><path d="M20 4.5V10h-5.5"/>',
  logout: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  cloud: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.4 9.1 4.5 4.5 0 0 0 7 18z"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  warn: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.3h.01" stroke-width="2.4"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  upload: '<path d="M12 15.5V4M7 8.5 12 4l5 4.5M4.5 14.5v5h15v-5"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke-width="2.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  glass: '<path d="M7 3.5h10l-.6 5.5a4.4 4.4 0 0 1-8.8 0zM12 13.5V20M8.5 20.5h7"/>',
  sake: '<path d="M10 3.5h4v3c2.5 1.5 3.5 3.5 3.5 6.5v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V13c0-3 1-5 3.5-6.5z"/><path d="M6.5 14h11"/>',
  stand: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v7M9 21l3-6.5 3 6.5M8 10.5l4-2 4 2"/>',
  smoke: '<path d="M3.5 15.5h13v3h-13zM19 15.5v3M21 15.5v3M18 12c0-2 2-2 2-4s-1.5-2.5-1.5-3.5"/>',
  nosmoke: '<path d="M3.5 15.5h13v3h-13zM19 15.5v3M21 15.5v3"/><path d="M4 4l16 16" />',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  film: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M7.5 4v16M16.5 4v16M3.5 9h4M3.5 15h4M16.5 9h4M16.5 15h4"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
  music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  type: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  trash: '<path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  download: '<path d="M12 4v11.5M7 11l5 4.5 5-4.5M4.5 15v4.5h15V15"/>',
  folder: '<path d="M3.5 6.5v12h17v-10h-8.5l-2-2.5h-6.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  sparkle: '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
};

export const ic = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;

// Food art per cuisine: an emoji on a soft tile (tone 1–4 picks the tile color).
export const CUISINE_ART = {
  sushi: ['🍣', 1], ramen: ['🍜', 4], izakaya: ['🏮', 1], yakitori: ['🍢', 4], yakiniku: ['🥩', 1], japanese: ['🍱', 2], italian: ['🍝', 4],
  french: ['🥐', 4], chinese: ['🥟', 3], korean: ['🌶️', 1], indian: ['🍛', 4], thai: ['🍲', 2], cafe: ['☕', 3], burger: ['🍔', 4],
  bar: ['🍷', 3],
};

// Facilities and house rules shown as an icon row on the restaurant page.
export const FEATURE_ICONS = {
  drinks: 'glass', sake: 'sake', standing: 'stand', counter: 'table', vape_only: 'smoke',
  no_smoking: 'nosmoke', cards: 'card', english: 'globe',
};

// A restaurant's video (or photo) for the feed and the page header. Without one, the food
// art fills the frame on a dark tile so the feed still reads as pictures, not a list.
export function mediaHtml(r, { autoplay = false } = {}) {
  const m = r.media ?? r.profile?.media ?? null;
  const [emoji, tone] = CUISINE_ART[r.cuisine] || ['🍽️', 3];
  if (m?.video) {
    return `<video class="media" src="${escapeHtml(m.video)}" ${m.poster ? `poster="${escapeHtml(m.poster)}"` : ''} muted loop playsinline preload="metadata" ${autoplay ? 'autoplay' : ''}></video>`;
  }
  if (m?.poster) return `<img class="media" src="${escapeHtml(m.poster)}" alt="">`;
  return `<div class="media media--art media--${tone}" aria-hidden="true"><span>${emoji}</span></div>`;
}

export const art = (cuisine, size = '') => {
  const [emoji, tone] = CUISINE_ART[cuisine] || ['🍽️', 3];
  return `<span class="art art--${tone} ${size}" aria-hidden="true">${emoji}</span>`;
};

// −/+ control. `attrs` names what the buttons do, e.g. 'data-action="party"'; each also gets data-delta.
export function stepperHtml(attrs, value, min, max, label, { big = false, icon = null } = {}) {
  return `<div class="stepper${big ? ' stepper--lg' : ''}" role="group" aria-label="${escapeHtml(label)}">
    ${icon ? `<span class="stepper__ic">${ic(icon)}</span>` : ''}
    <button type="button" ${attrs} data-delta="-1" ${value <= min ? 'disabled' : ''} aria-label="−">${ic('minus')}</button>
    <output aria-live="polite">${value}</output>
    <button type="button" ${attrs} data-delta="1" ${value >= max ? 'disabled' : ''} aria-label="+">${ic('plus')}</button>
  </div>`;
}

export function toggleHtml(action, on, onText, offText, label) {
  return `<button type="button" class="toggle" role="switch" aria-checked="${on}" aria-label="${escapeHtml(label)}" data-action="${action}">
    <span class="toggle__track"><span class="toggle__thumb"></span></span><span class="toggle__text">${escapeHtml(on ? onText : offText)}</span></button>`;
}
