const APP_CACHE = "dabt-app-v2";
const MUSHAF_CACHE = "dabt-mushaf-v1";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/data-client.js",
  "/browser-local-api.js",
  "/surah-pages.js",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, MUSHAF_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isMushafResource(url) {
  return (
    url.origin === "https://api.quran.com" ||
    url.origin === "https://verses.quran.foundation" ||
    url.origin === "https://www.ahadees.com"
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw _error;
  }
}

function isAppShellAsset(url) {
  return (
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/styles.css" ||
    url.pathname === "/app.js" ||
    url.pathname === "/data-client.js" ||
    url.pathname === "/browser-local-api.js" ||
    url.pathname === "/surah-pages.js" ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) {
      return;
    }

    if (request.mode === "navigate") {
      event.respondWith(
        networkFirst(request, APP_CACHE).catch(async () => {
          const cached = await caches.match("/index.html");
          return cached || Response.error();
        }),
      );
      return;
    }

    if (isAppShellAsset(url)) {
      event.respondWith(
        networkFirst(request, APP_CACHE).catch(async () => {
          const cached = await caches.match(request);
          return cached || Response.error();
        }),
      );
      return;
    }

    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  if (isMushafResource(url)) {
    const isApiJson = url.origin === "https://api.quran.com";
    event.respondWith(isApiJson ? networkFirst(request, MUSHAF_CACHE) : staleWhileRevalidate(request, MUSHAF_CACHE));
  }
});
