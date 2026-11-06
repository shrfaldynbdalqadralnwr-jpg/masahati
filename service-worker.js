/* مساحتي — Service Worker: يخزّن التطبيق لتشغيله دون إنترنت */
const VERSION = 'v2';
const CACHE = 'masahati-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('masahati-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // التنقل: من الذاكرة أولاً، مع تحديث خلفي عند توفر الإنترنت
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        const fresh = fetch(req).then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
          return res;
        }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  // بقية الملفات: من الذاكرة أولاً ثم الشبكة
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached))
  );
});
