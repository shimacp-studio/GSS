const VERSION = 'v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(`app-${VERSION}`).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k.startsWith('app-') && k !== `app-${VERSION}` ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch {
        const cache = await caches.match(req);
        return cache || caches.match('./offline.html');
      }
    })());
    return;
  }
  const url = new URL(req.url);
  const isGas = /script\.google(?:usercontent)?\.com/.test(url.host);
  if (isGas) {
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch {
        return new Response(JSON.stringify({ ok:false, offline:true }), {
          headers: { 'Content-Type': 'application/json' }, status: 503
        });
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const cacheHit = await caches.match(req);
    const fetchPromise = fetch(req).then(res => {
      const copy = res.clone();
      caches.open(`app-${VERSION}`).then(c => c.put(req, copy));
      return res;
    }).catch(() => null);
    return cacheHit || fetchPromise || new Response('', { status: 504 });
  })());
});
