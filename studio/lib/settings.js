// Built from desktop/settings.js by studio-static/build.js.

const module = { exports: {} };
const require = (name) => ({  })[name];
(function (require, module, exports) {
'use strict';

// The desktop app's settings: the restaurant's details (what the web studio gets from the
// owner's account) and how word suggestions are made. Kept free of Electron so it can be tested.
//
// Stored as JSON in the app's data folder:
//   { restaurant: { name: { en, ja }, cuisine, hours: { open, close } },
//     ai: { mode: 'none' | 'claude' | 'local', key } }
// `key` is the Claude API key, encrypted by the operating system (see main.js); it never
// leaves the main process. The local AI is set up and run by the app itself (local-ai.js).

const CUISINES = [
  'sushi', 'ramen', 'izakaya', 'yakitori', 'yakiniku', 'japanese', 'italian', 'french',
  'chinese', 'korean', 'indian', 'thai', 'cafe', 'burger', 'bar',
];
const MODES = ['none', 'claude', 'local'];
const LOCAL_MODEL = 'gemma4:12b'; // checked against Claude on the Tomo Sushi clips (docs/dev-record.md)
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const str = (v, max) => String(v ?? '').trim().slice(0, max);

// The restaurant as the studio and the copywriter expect it, or null without a name.
function cleanRestaurant(input = {}) {
  const r = {
    name: { en: str(input.name?.en, 60), ja: str(input.name?.ja, 60) },
    cuisine: CUISINES.includes(input.cuisine) ? input.cuisine : 'japanese',
  };
  const open = str(input.hours?.open, 5);
  const close = str(input.hours?.close, 5);
  if (TIME.test(open) && TIME.test(close)) r.hours = { open, close };
  return r.name.en || r.name.ja ? r : null;
}

function cleanAi(input = {}, prev = {}) {
  return { mode: MODES.includes(input.mode) ? input.mode : 'none', key: prev.key || null };
}

// What the settings window may see: everything but the key itself.
function forWindow(settings = {}) {
  const ai = cleanAi(settings.ai, settings.ai);
  return {
    restaurant: settings.restaurant || null,
    ai: { mode: ai.mode, hasKey: Boolean(ai.key) },
    cuisines: CUISINES,
  };
}

// What the studio needs: the restaurant and which kind of suggestions it gets
// ('claude', 'local' or false, as the web server's /api/owner/me says).
function forStudio(settings = {}) {
  const ai = cleanAi(settings.ai, settings.ai);
  const studioAi = ai.mode === 'claude' && ai.key ? 'claude' : ai.mode === 'local' ? 'local' : false;
  return { restaurant: settings.restaurant || null, studioAi };
}

// The environment for createCopywriter (src/studio-copy.js), given the decrypted key and the
// address of the running local AI.
function copywriterEnv(settings = {}, { key = null, localUrl = null } = {}) {
  const ai = cleanAi(settings.ai, settings.ai);
  if (ai.mode === 'claude' && key) return { ANTHROPIC_API_KEY: key };
  if (ai.mode === 'local' && localUrl) return { OLLAMA_URL: localUrl, OLLAMA_MODEL: LOCAL_MODEL };
  return {};
}

module.exports = { CUISINES, LOCAL_MODEL, cleanRestaurant, cleanAi, forWindow, forStudio, copywriterEnv };

})(require, module, module.exports);
export default module.exports;
