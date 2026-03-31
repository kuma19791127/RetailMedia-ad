const CACHE_NAME = 'retail-ad-store-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/index.html'
    ])),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // ネットワーク・ファースト（Network First）
  // 常に最新データを取得し、オフラインの時だけキャッシュを返す
  e.respondWith(
    fetch(e.request).then((response) => {
      // ネットワーク通信成功時はキャッシュを更新（HTMLなどを常に新しく保つ）
      if (response && response.status === 200 && response.type === 'basic') {
        const url = e.request.url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
      }
      return response;
    }).catch(() => {
      // オフライン・通信エラー時はキャッシュから返す
      return caches.match(e.request);
    })
  );
});
