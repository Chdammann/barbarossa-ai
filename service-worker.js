self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("barbarossa-cache").then(cache => {
      return cache.addAll(["/", "/index.html", "/avatar.glb"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
