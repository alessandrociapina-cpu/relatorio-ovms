const CACHE_NAME = 'ovms-app-v50';

const urlsToCache = [
  './',
  './index.html',
  './documentacao.html',
  './style.css?v=50',
  './utils.js?v=50',
  './domUtils.js?v=50',
  './modules/storage.js?v=50',
  './modules/gps.js?v=50',
  './formHandler.js?v=50',
  './galleryManager.js?v=50',
  './reportGenerator.js?v=50',
  './script.js?v=50',
  './manifest.json',
  './sabesp-logo.png',
  'https://cdn.jsdelivr.net/npm/exif-js@2.3.0',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
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
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
