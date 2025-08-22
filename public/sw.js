self.addEventListener('install', evt => {
  evt.waitUntil(caches.open('static').then(cache => cache.addAll(['/','/index.html','/app.js','/manifest.json'])));
});
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => res || fetch(evt.request))
  );
});
