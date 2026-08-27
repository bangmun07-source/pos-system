const CACHE_NAME = "MUNO-v2";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html"
];


// =====================================================
// 1. INSTALL
// =====================================================
self.addEventListener("install", (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );

  self.skipWaiting();
});


// =====================================================
// 2. ACTIVATE
// =====================================================
self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then((cacheNames) => {

      return Promise.all(

        cacheNames.map((cache) => {

          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }

          return null;

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

  const request = event.request;
  const url = new URL(request.url);

  // Hanya GET
  if (request.method !== "GET") {
    return;
  }

  // Supabase → langsung network
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Vercel API → langsung network
  if (url.pathname.startsWith("/api/")) {
    return;
  }


  // ===================================================
  // NAVIGATION
  // NETWORK FIRST
  // ===================================================
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then((response) => {

          return response;

        })
        .catch(() => {

          return caches.match("/index.html");

        })

    );

    return;
  }


  // ===================================================
  // JS / CSS / ASSET
  // NETWORK FIRST
  // ===================================================
  event.respondWith(

    fetch(request)

      .then((response) => {

        // Simpan response terbaru
        if (response &&
            response.status === 200 &&
            response.type === "basic") {

          const responseClone =
            response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });

        }

        return response;

      })

      .catch(() => {

        return caches.match(request);

      })

  );

});
