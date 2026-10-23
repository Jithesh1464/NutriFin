const CACHE_NAME = 'gains-ledger-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Gains Ledger — Nutrition & Finance.html',
  encodeURI('/Gains Ledger — Nutrition & Finance.html')
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all(
      urlsToCache.map(url => {
        try {
          return fetch(url, { cache: 'no-store' })
            .then(res => caches.open(CACHE_NAME).then(cache => cache.put(url, res.clone())))
            .catch(() => {});
        } catch (err) {
          return Promise.resolve();
        }
      })
    )
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET' || requestUrl.protocol === 'file:' || requestUrl.origin === 'null') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => response || new Response('Offline - Page not cached'))
          .catch(() => new Response('Offline'));
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23c3ff4d" width="192" height="192"/><text x="96" y="140" font-size="100" font-weight="bold" text-anchor="middle" fill="%23000">GL</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23c3ff4d" width="96" height="96"/><text x="48" y="70" font-size="50" text-anchor="middle" fill="%23000">G</text></svg>',
    tag: data.tag || 'gains-ledger',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gains Ledger', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});