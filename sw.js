const CACHE = 'sdl-v42';

const FA_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0';

// Local application files
const STATIC = [
  './',
  './index.html',
  './html/tasks.html',
  './html/exams.html',
  './html/pomodoro.html',
  './html/notes.html',
  './html/settings.html',
  './html/help.html',

  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './css/features.css',
  './css/responsive.css',

  './js/theme.js',
  './js/nav.js',
  './js/utils.js',
  './js/toast.js',
  './js/dialog.js',
  './js/storage.js',
  './js/settings.js',
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

  './sound.mp3'
];

// External resources
const EXTERNAL = [
  `${FA_BASE}/css/all.min.css`,
  `${FA_BASE}/webfonts/fa-solid-900.woff2`,
  `${FA_BASE}/webfonts/fa-regular-400.woff2`,
  `${FA_BASE}/webfonts/fa-brands-400.woff2`
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      // 'reload' bypasses the browser HTTP cache so fresh files are stored
      await cache.addAll(STATIC.map(url => new Request(url, { cache: 'reload' })));

      // Optional external resources
      await Promise.allSettled(
        EXTERNAL.map(async url => {
          const response = await fetch(url);

          if (response.ok) {
            await cache.put(url, response);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key.startsWith('sdl-') && key !== CACHE)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// Cache successful responses
async function cachePut(request, response) {
  if (response.ok) {
    try {
      const cache = await caches.open(CACHE);
      await cache.put(request, response);
    } catch {
      // Ignore cache storage errors
    }
  }
}

// Fetch
self.addEventListener('fetch', e => {
  const { request } = e;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  const isAppCode =
    sameOrigin &&
    (
      request.mode === 'navigate' ||
      url.pathname === '/' ||
      url.pathname.endsWith('/') ||
      /\.(html|js|css|json)$/.test(url.pathname)
    );

  // App code (HTML, JS, CSS, manifest): network first, cache fallback.
  // Keeps JS in sync with HTML and still works offline.
  if (isAppCode) {
    e.respondWith(
      (async () => {
        try {
          const req = request.mode === 'navigate'
            ? request
            : new Request(request, { cache: 'no-cache' });

          const response = await fetch(req);

          if (response.ok) {
            e.waitUntil(cachePut(request, response.clone()));
          }

          return response;
        } catch {
          return (await caches.match(request)) || Response.error();
        }
      })()
    );

    return;
  }

  // Everything else (images, audio, fonts, external CSS): cache first, network fallback
  e.respondWith(
    (async () => {
      const cached = await caches.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);
        await cachePut(request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});