// QuietFlow service worker — offline shell + cache-first static assets + push notifications.
const CACHE = 'quietflow-v4';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isDoc = request.destination === 'document' ||
    (url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html'));

  // Navigation/HTML is NETWORK-FIRST so a new deploy never serves a stale
  // shell referencing old hashed chunk names (which caused ChunkLoadError).
  if (isDoc) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for same-origin GETs (hashed static assets are immutable),
  // network fallback, then cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// ─── Push Notifications ───────────────────────────────────────

// Listen for push events (from server or from app via registration.showNotification)
self.addEventListener('push', (event) => {
  let data = { title: 'QuietFlow', message: '' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { title: parsed.title || 'QuietFlow', message: parsed.message || '' };
    }
  } catch {
    data.message = event.data?.text() || '';
  }

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    tag: 'quietflow-notification',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click — focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        // Send a message to the client to navigate to notification context
        client.postMessage({ type: 'NOTIFICATION_CLICKED', data: event.notification.data || {} });
        return;
      }
      return self.clients.openWindow('/');
    })
  );
});
