const CACHE = 'postureping-v1';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './onboarding.html',
  './session.html',
  './manifest.json',
  './css/app.css',
  './js/store.js',
  './js/exercises.js',
  './js/notifications.js',
  './js/timer.js',
  './js/app.js',
  './js/dashboard.js',
  './js/onboarding.js',
  './js/session.js',
  './assets/exercises/neck.svg',
  './assets/exercises/shoulders.svg',
  './assets/exercises/eyes.svg',
  './assets/exercises/back.svg',
  './assets/exercises/wrist.svg',
  './assets/exercises/breath.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
