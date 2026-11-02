// Keeps the studio's own files on the device, so the home-screen app opens without a network
// and nothing is fetched twice. build.js fills in VERSION (from the files' contents) and FILES;
// a new version is picked up the next time the studio is opened, never in the middle of a video.
const VERSION = '0a3e04e021db';
const FILES = ["./","./bridge.js","./desktop.css","./i18n.js","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./index.html","./lang-default.js","./lib/app-error.js","./lib/settings.js","./lib/studio-copy.js","./logo.png","./manifest.webmanifest","./net.js","./settings.js","./studio-music.js","./studio-render.js","./studio.css","./studio.js","./styles.css","./ui.js"];
const CACHE = `eatnow-studio-${VERSION}`;

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('eatnow-studio-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// The studio's files come from the cache; anything else (there is nothing else today) goes to the network.
self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET' || new URL(ev.request.url).origin !== location.origin) return;
  ev.respondWith(caches.match(ev.request, { ignoreSearch: true }).then((hit) => hit || fetch(ev.request)));
});
