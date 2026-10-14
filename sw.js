// FXMT: do not cache private account data or financial API responses.
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
