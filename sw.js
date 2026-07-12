self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("pothana-cache-v4").then(cache => cache.addAll([
      "./",
      "./index.html",
      "./styles.css",
      "./app.js",
      "./ui.js",
      "./db.js",
      "./data.js",
      "./manifest.json"
    ]))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});



