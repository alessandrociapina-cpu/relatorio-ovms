const CACHE_NAME = 'ovms-app-v63';

// Apenas recursos locais no cache de instalação — CDNs externos não bloqueiam o SW se falharem
const localUrlsToCache = [
  './',
  './index.html',
  './documentacao.html',
  './style.css?v=63',
  './utils.js?v=63',
  './domUtils.js?v=63',
  './modules/storage.js?v=63',
  './modules/gps.js?v=63',
  './formHandler.js?v=63',
  './galleryManager.js?v=63',
  './reportGenerator.js?v=63',
  './script.js?v=63',
  './manifest.json',
  './sabesp-logo.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(localUrlsToCache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
