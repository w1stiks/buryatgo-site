/* BuryatGo service worker: игра открывается и без интернета.
   Свои файлы — из кэша с фоновым обновлением; запросы к серверу аккаунтов не кэшируются. */
const CACHE = 'buryatgo-v1.11.42-pants';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/data.js', 'js/store.js', 'js/cloud-config.js', 'js/cloud.js', 'js/pwa.js',
  'js/audio.js', 'js/art.js', 'js/mascot.js', 'js/yurt.js', 'js/places.js', 'js/datsan.js', 'js/app.js',
  'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
    .then(list => list.forEach(c => c.postMessage({ type: 'reload' }))));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'skip') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  const code = /\.(js|css|html)$/.test(url.pathname) || /\/$/.test(url.pathname);
  e.respondWith(caches.open(CACHE).then(cache => {
    const net = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => cache.match(req));
    if (code) return net;
    return cache.match(req).then(hit => hit || net);
  }));
});
