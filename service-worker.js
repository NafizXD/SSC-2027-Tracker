const CACHE = 'orbit-ssc-2027-shell-v3';   // v1.1: bumped v2 -> v3 so old caches refresh
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './cloud-config.js',
  './supabase.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './updateindex.html',      // v1.1: update channel precached for offline first-run
  './update-loader.js'       // v1.1
];

/* v1.1: these two must always come from the NETWORK first, otherwise returning
   users stay on stale offline copies and never receive new update packs. */
const NETWORK_FIRST = [
  /\/updateindex\.html$/,
  /\/update-loader\.js$/
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const url = new URL(request.url);
    const freshFirst = NETWORK_FIRST.some(re => re.test(url.pathname));

    /* --- update channel: network-first, cache fallback (ignore ?v= busting param) --- */
    if (freshFirst) {
      try {
        const response = await fetch(request);
        if (response.ok && !url.search) {          // don't store cache-busted copies
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        throw error;
      }
    }

    /* --- everything else: original cache-first behaviour --- */
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return caches.match('./index.html');
      throw error;
    }
  })());
});
