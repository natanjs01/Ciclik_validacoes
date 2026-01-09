const CACHE_NAME = 'ciclik-v2'; // Incrementado para forçar atualização
const BASE_PATH = '/Ciclik_validacoes/';
const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}icon-192-white.png`,
  `${BASE_PATH}icon-512-white.png`
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        // Tenta cachear, mas não falha se algum recurso não existir
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.log('Falha ao cachear:', url, err))
          )
        );
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // ESTRATÉGIA: Network First (busca da rede primeiro, cache como fallback)
    fetch(event.request)
      .then((response) => {
        // Verifica se recebeu uma resposta válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone da resposta para cachear
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Se falhar a requisição de rede, tenta buscar do cache
        return caches.match(event.request);
      })
  );
});
