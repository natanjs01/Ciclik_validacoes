const CACHE_NAME = 'ciclik-v2';
const BASE_PATH = '/Ciclik_validacoes/';

// Lista mínima de recursos essenciais
const urlsToCache = [
  `${BASE_PATH}index.html`,
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        // Não falha se não conseguir cachear
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url)
              .then(() => console.log('[Service Worker] Cacheado:', url))
              .catch(err => console.warn('[Service Worker] Falha ao cachear:', url, err))
          )
        );
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições - modo passivo (sempre busca da rede)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou que são de outros domínios
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for bem-sucedida, cacheia para uso offline futuro
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Em caso de erro de rede, tenta buscar do cache
        return caches.match(event.request);
      })
  );
});
        });
      })
  );
});
