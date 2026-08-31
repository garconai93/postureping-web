const CACHE = 'postureping-v4-disabled';
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
  // v4: skip caching, force network only
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // delete ALL old caches to force fresh fetch
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // network-first only, no cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
