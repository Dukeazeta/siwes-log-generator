const CACHE_NAME = "swiftlog-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/auth/callback",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Add other static assets
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("Failed to cache resources during install:", error);
      }),
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip caching for API routes and external requests
  const url = new URL(event.request.url);
  const isAPI = url.pathname.startsWith("/api/");
  const isExternal = url.origin !== location.origin;
  const isAuth = url.pathname.startsWith("/auth/");
  const isSupabase = url.hostname.includes("supabase");

  // Don't cache API requests, external requests, auth routes, or Supabase requests
  if (isAPI || isExternal || isAuth || isSupabase) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          // Check Content-Type to avoid caching non-cacheable content
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            // For HTML, only cache specific pages
            const pathname = new URL(event.request.url).pathname;
            if (!urlsToCache.includes(pathname) && pathname !== "/") {
              return response;
            }
          }

          // Clone the response before caching
          const responseToCache = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests
              if (event.request.method === "GET") {
                cache.put(event.request, responseToCache);
              }
            })
            .catch((error) => {
              console.error("Failed to cache response:", error);
            });

          return response;
        });
      })
      .catch((error) => {
        console.error("Fetch failed:", error);

        // Show offline fallback for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }

        // For other requests, return a basic offline response
        return new Response("Offline - Content not available", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({
            "Content-Type": "text/plain",
          }),
        });
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

// Skip waiting and activate immediately when a new service worker is available
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline form submissions when back online
  console.log("Background sync triggered");

  // You can implement logic here to sync offline data
  // For example, retrieve stored form data from IndexedDB and send to server
}

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification from SwiftLog",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/icons/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-192x192.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("SwiftLog", options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/dashboard"));
  }
});

// Handle service worker updates
self.addEventListener("controllerchange", () => {
  window.location.reload();
});
