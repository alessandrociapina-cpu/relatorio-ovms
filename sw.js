const CACHE_NAME = 'ovms-app-v16'; 

self.addEventListener('install', event => {
  self.skipWaiting();
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

// Estratégia "Network First": Tenta sempre buscar o arquivo da internet primeiro.
// Se falhar (modo Offline), ele busca do cache.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza o cache silenciosamente com a versão mais nova
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Sem internet? Usa o cache salvo.
        return caches.match(event.request);
      })
  );
});
