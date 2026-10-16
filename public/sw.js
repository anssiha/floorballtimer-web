// Both placeholders below are filled in by the `sw-build-version` plugin in vite.config.ts.
// Every build gets its own cache name, so a new deploy installs a fresh service worker
// that precaches the new files and deletes the previous build's cache.
const CACHE_VERSION = /*__CACHE_VERSION__*/ 'dev';
const BUILD_ASSETS = /*__BUILD_ASSETS__*/ [];

const BASE = '/floorballtimer-web/';
const CACHE_NAME = `floorball-timer-${CACHE_VERSION}`;
const INDEX_URL = `${BASE}index.html`;

// Files the app can't start without. If any of them fails to download, the install fails
// and the previous version (and its offline cache) stays in place.
const REQUIRED_URLS = [INDEX_URL, ...BUILD_ASSETS.map((file) => `${BASE}${file}`)];

// Nice to have offline; a failure here doesn't block the update
const OPTIONAL_URLS = [
  `${BASE}pwa-192.png`,
  `${BASE}pwa-512.png`,
  `${BASE}icon.png`,
  `${BASE}manifest.json`,
];

// How long a page load waits for the network before falling back to the cached page
const NAVIGATION_TIMEOUT_MS = 3000;

// Dev server (placeholders not stamped): this worker must not cache anything. Earlier
// versions did cache source modules in dev, which mixes stale and fresh code and leaves a
// white screen. When the browser picks up this file it wipes all caches, unregisters itself
// and reloads open pages, so a stuck dev setup repairs itself on the next page load.
const IS_DEV_BUILD = CACHE_VERSION === 'dev';

if (IS_DEV_BUILD) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => client.navigate(client.url));
      })()
    );
  });
}

self.addEventListener('install', (event) => {
  if (IS_DEV_BUILD) return;
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(REQUIRED_URLS);
      await Promise.all(
        OPTIONAL_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('PWA: Failed to cache asset:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  if (IS_DEV_BUILD) return;
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (IS_DEV_BUILD) return;
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  // Pages: network first, so a new deploy shows up on the first load. Fall back to the
  // cached page when offline, or when the network is too slow (e.g. weak signal in a hall).
  if (request.mode === 'navigate') {
    const network = fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_URL, responseToCache));
      }
      return networkResponse;
    });
    // Keep the worker alive so a slow response still refreshes the cache after the timeout
    event.waitUntil(network.catch(() => undefined));

    const cachedPage = () =>
      caches.match(request).then((cached) => cached || caches.match(INDEX_URL));
    const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS));

    event.respondWith(
      Promise.race([network, timeout.then(cachedPage)])
        .then((response) => response || network)
        .catch(() => cachedPage().then((cached) => cached || network))
    );
    return;
  }

  // Everything else (hashed JS/CSS, icons): cache first. Hashed file names change on every
  // build, so a cached copy is never stale.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});
