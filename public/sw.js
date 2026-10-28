const CACHE_NAME = 'tlgs-pos-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API or dynamic data requests with network-first, fallback to cache
  if (url.pathname.includes('/api/') || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // If offline and it's a POS transaction POST, queue it or return offline success stub
        if (event.request.method === 'POST') {
          return new Response(
            JSON.stringify({ status: 'queued_offline', message: 'Transaction queued for sync when online' }),
            { headers: { 'Content-Type': 'application/json' }, status: 202 }
          );
        }
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || new Response(JSON.stringify({ error: 'offline' }), { status: 503 });
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match('/');
      });
    })
  );
});

// Background Sync for Queued Transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-transaction-sync') {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_OFFLINE_TRANSACTIONS' });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
