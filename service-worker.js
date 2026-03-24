self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('retail-ad-store').then((cache) => cache.addAll([
      '/',
      '/index.html'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  // キャッシュ・ファースト（なければネットワーク）
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).catch(() => {
          // ネットワークも切断されており、キャッシュもない場合
          console.log("Network and cache both failed for:", e.request.url);
      });
    })
  );
});
