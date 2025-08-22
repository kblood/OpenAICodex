self.addEventListener('install', evt => {
  evt.waitUntil(caches.open('static-v3').then(cache => cache.addAll(['/','/index.html','/app.js','/manifest.json'])));
});
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !['static-v3'].includes(k)).map(k => caches.delete(k))
    ))
  );
});
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => res || fetch(evt.request))
  );
});
