// The studio with no server: what the Mac/Windows app's main.js answers (desktop/preload.js),
// answered here in the browser instead. The restaurant's details stay in this browser
// (localStorage), words come from the built-in phrases, and the video is saved with the
// browser's own download. There is no AI to choose, so the settings show only "no AI".
// build.js turns the CommonJS files imported below into modules the browser can load.

import settings from './lib/settings.js';
import copy from './lib/studio-copy.js';

const KEY = 'eatnow.studio.settings';
const copywriter = copy.createCopywriter({});
let stored = read();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

window.eatnowDesktop = {
  aiChoices: ['none'],
  settings: async () => settings.forWindow(read()),
  saveSettings: async (input) => {
    const restaurant = settings.cleanRestaurant(input?.restaurant);
    if (!restaurant) return { error: 'INVALID_INPUT' };
    const next = { restaurant, ai: { mode: 'none' } };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {} // a private window may refuse; the details then last until the page closes
    stored = next;
    return settings.forWindow(next);
  },
  profile: async () => settings.forStudio(stored),
  localAi: {
    status: async () => ({ supported: false }),
    prepare() {}, cancel() {}, remove() {},
    onProgress() {},
  },
  suggest: async (body) => {
    if (!stored.restaurant) return { error: 'INVALID_INPUT' };
    try {
      return await copywriter.suggest(stored.restaurant, body);
    } catch (err) {
      return { error: err.code || 'SERVER_ERROR' };
    }
  },
  setLang() {},
};

// Installed on a phone's home screen, the studio opens from these cached files even offline (sw.js).
try {
  navigator.serviceWorker?.register('./sw.js');
} catch {}
