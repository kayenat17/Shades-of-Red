const CACHE_NAME = 'sor-cache-v1';
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'try2.html',
  'signup.html',
  'sor.html',
  'final.css',
  'try2.css',
  'style.css',
  'try2.js',
  'script.js',
  'app.js',
  'calendar.css',
  'calendar.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

