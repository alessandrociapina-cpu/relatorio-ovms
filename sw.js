const CACHE_NAME = 'ovms-app-v29'; 

const urlsToCache = [
  './',
  './index.html',
  './documentacao.html',
  './style.css?v=29',
  './script.js?v=29',
  './manifest.json',
  './sabesp-logo.png',
  'https://cdn.jsdelivr.net/npm/exif-js',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// O Motor Definitivo: 100% NETWORK FIRST para todos os ficheiros!
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam GET (segurança padrão)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a internet funcionou, guarda a versão mais nova escondido no cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Se falhou (telemóvel sem internet/offline na obra), usa o que tem no cache
        return caches.match(event.request);
      })
  );
});
