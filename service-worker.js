const CACHE_NAME = 'padel-pro-evo-v1';
const ASSETS = [
  '/game3d.html',
  '/js/game3d.js',
  '/js/renderer3d.js',
  '/js/physics3d.js',
  '/js/ai3d.js',
  '/js/audio.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
