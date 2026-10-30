const CACHE_NAME = 'filewiz-shell-v5';
const BASE_PATH = '/work/projects/filewiz/';
const APP_SHELL = [BASE_PATH, `${BASE_PATH}index.html`, `${BASE_PATH}manifest.webmanifest`, `${BASE_PATH}pwa-192.png`, `${BASE_PATH}pwa-512.png`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith(`${BASE_PATH}api/`)) return;

  if (request.mode === 'navigate' && url.pathname.startsWith(BASE_PATH)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cachedResponse = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(`${BASE_PATH}index.html`, cachedResponse)).catch(() => {}));
        }
        return response;
      } catch {
        return (await caches.match(`${BASE_PATH}index.html`)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith(`${BASE_PATH}assets/`)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(() => {}));
      return response;
    })());
  }
});
