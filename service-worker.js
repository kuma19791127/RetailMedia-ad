self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('retail-ad-store').then((cache) => cache.addAll([
      '/',
      '/index.html'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch for now, caching can be improved later
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)).catch(() => {
        // Fallback for offline if fetch fails and not in cache
        return fetch(e.request);
    })
  );
});
