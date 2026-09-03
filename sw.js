const CACHE_NAME = 'ovms-app-v61';

// Apenas recursos locais no cache de instalação — CDNs externos não bloqueiam o SW se falharem
const localUrlsToCache = [
  './',
  './index.html',
  './documentacao.html',
  './style.css?v=61',
  './utils.js?v=61',
  './domUtils.js?v=61',
  './modules/storage.js?v=61',
  './modules/gps.js?v=61',
  './formHandler.js?v=61',
  './galleryManager.js?v=61',
  './reportGenerator.js?v=61',
  './script.js?v=61',
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
