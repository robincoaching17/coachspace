// Service worker CoachSpace
// - Pages : réseau d'abord (toujours la dernière version en ligne), copie de secours si pas de réseau
// - Icônes : mises en cache
// - Firebase, polices et autres sites : jamais interceptés
const CACHE = 'coachspace-v2';
const PRECACHE = ['/', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/')))
    );
    return;
  }

  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
      }))
    );
  }
});
