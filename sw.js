const CACHE_NAME = 'ovms-app-v14'; 
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './sabesp-logo.png',
  'https://cdn.jsdelivr.net/npm/exif-js',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força a instalação imediata
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
  self.clients.claim(); // Assume o controle do aplicativo imediatamente
});

self.addEventListener('fetch', event => {
  // ESTRATÉGIA INTELIGENTE: Se for a página principal (HTML), tenta ir à internet primeiro!
  // Isso garante que o número da versão e a interface mudem instantaneamente.
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)) // Se estiver sem internet, usa o cache (Offline)
    );
    return;
  }

  // Para imagens, CSS e JS: Cache-First (Mantém o carregamento do app instantâneo)
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
