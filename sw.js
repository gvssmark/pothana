const CACHE_NAME = "pothana-cache-v13";

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        "./",
        "./index.html",
        "./styles.css",
        "./app.js",
        "./ui.js",
        "./db.js",
        "./data.js",
        "./manifest.json"
      ]);
      // Take over as soon as install finishes, instead of waiting
      // for every open tab/app window to be closed first.
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      // Remove old cache versions so they don't pile up.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
      // Start controlling already-open pages immediately.
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
