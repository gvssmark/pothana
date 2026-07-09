self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("pothana-cache").then(cache => cache.addAll(["/", "/index.html", "/styles.css", "/app.js", "/ui.js", "/db.js"]))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
