const CACHE = 'sdl-v1';
const STATIC = [
  './css/style.css',
  './js/theme.js',
  './js/storage.js',
  './js/dashboard.js',
  './js/tasks.js',
  './js/exams.js',
  './js/pomodoro.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // HTML pages — always try network first, fall back to cache
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS / JS / assets — cache first, update in background
  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return res;
      });
      return cached || network;
    })
  );
});