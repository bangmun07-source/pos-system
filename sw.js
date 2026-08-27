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

  // Jangan tangani request selain GET
  if (event.request.method !== "GET") {
    return;
  }

  // Jangan tangani request ke Supabase
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Jangan tangani endpoint API Vercel
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // ===================================================
  // NAVIGASI HALAMAN
  // ===================================================
  if (event.request.mode === "navigate") {

    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("/index.html"))
    );

    return;
  }


  // ===================================================
  // ASET STATIS
  // ===================================================
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {

        // Kalau ada di cache → gunakan
        if (cachedResponse) {
          return cachedResponse;
        }

        // Kalau belum ada → ambil dari network
        return fetch(event.request);
      })
  );
});
