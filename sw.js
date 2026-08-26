const CACHE_NAME = "MUNO-v1";

// Aset statis utama yang ingin disimpan ke cache lokal
const ASSETS_TO_CACHE = [
  "/",
  "/index.html"
];


// =====================================================
// 1. INSTALL & CACHE ASET UTAMA
// =====================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  self.skipWaiting();
});


// =====================================================
// 2. ACTIVATE & BERSIHKAN CACHE LAMA
// =====================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});


// =====================================================
// 3. FETCH
// =====================================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request selain GET
  if (event.request.method !== "GET") {
    return;
  }

  // Jangan cache request ke Supabase
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Jangan cache endpoint API Vercel
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      // Kalau tersedia di cache → gunakan cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // Kalau belum ada → ambil dari network
      return fetch(event.request)
        .then((networkResponse) => {

          // Simpan response ke cache
          return caches.open(CACHE_NAME).then((cache) => {

            cache.put(
              event.request,
              networkResponse.clone()
            );

            return networkResponse;
          });

        })
        .catch(() => {

          // Fallback kalau offline total
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }

        });

    })
  );
});
