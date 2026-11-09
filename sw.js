/* Quick Pot & Fry — offline cache (versioned). */
var CACHE = 'qpf-v5-1';
var ASSETS = [
  './',
  './index.html',
  './app.js',
  './recipes.js',
  './styles.css',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE) return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Network-first for navigations and app files; fall back to cache when offline.
// Online opens/refreshes pick up a new publish; offline still works from cache.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(req, copy);
        });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        if (cached) return cached;
        // SPA fallback: serve index for navigation requests
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return caches.match(req.url).then(function (c2) {
          return c2 || Response.error();
        });
      });
    })
  );
});
