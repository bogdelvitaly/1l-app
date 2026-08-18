// Minimal service worker — exists only so the browser can install 1L as an app.
// No caching: the app always requires a live network connection.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
