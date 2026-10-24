const CACHE = 'sdl-v26';

const FA_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0';

const STATIC = [
  './',
  './index.html',
  './html/tasks.html',
  './html/exams.html',
  './html/pomodoro.html',
  './html/notes.html',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './css/features.css',
  './css/responsive.css',
  './js/theme.js',
  './js/nav.js',
  './js/storage.js',
  './js/dashboard.js',
  './js/tasks.js',
  './js/exams.js',
  './js/pomodoro.js',
  './js/notes.js',
  './js/calendar.js',
  './manifest.json',
  './images/studydesk_lite_logo.svg',
  './images/icon-192.png',
  './images/icon-512.png',
  `${FA_BASE}/css/all.min.css`,
  `${FA_BASE}/webfonts/fa-solid-900.woff2`,
  `${FA_BASE}/webfonts/fa-regular-400.woff2`,
  `${FA_BASE}/webfonts/fa-brands-400.woff2`
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

function cachePut(request, response) {
  return caches.open(CACHE)
    .then(c => c.put(request, response))
    .catch(() => { /* quota exceeded or cache unavailable — ignore */ });
}

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(request)
        .then(res => {
          cachePut(request, res.clone());
          return res;
        })
        .catch(() =>
          caches.match(request).then(r => r || Response.error())
        )
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        cachePut(request, res.clone());
        return res;
      });
      return cached || network;
    })
  );
});