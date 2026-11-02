/* Training Cycle offline support. Keeps a copy of the beginner app so it opens with no signal.
   Online: always loads the newest version (falls back to the saved copy after 4 seconds or on failure).
   Only handles the Training Cycle page; every other file in the site passes straight through. */
const CACHE = 'training-cycle-v1';
const MATCH = /training-cycle\.html$/i;
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('training-cycle-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || !MATCH.test(url.pathname)) return;
  const key = url.origin + url.pathname;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(e.request).then(r => { if (r && r.ok) cache.put(key, r.clone()); return r; });
    const timeout = new Promise(res => setTimeout(() => res(null), 4000));
    try {
      const r = await Promise.race([net, timeout]);
      if (r) return r;
    } catch (err) {}
    const cached = await cache.match(key);
    if (cached) return cached;
    return net;
  })());
});
