// HTML은 열어 볼 때 캐시한다. 미리 담는 주소 목록은 없다.
// 새 주 페이지를 추가하면 이 이름만 올려 예전 캐시를 비운다.
const CACHE = "jw4-study-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("jw4-") && key !== CACHE).map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isHTML(request, url) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  const path = url.pathname;
  return path.endsWith(".html") || path.endsWith("/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/audio/")) return;
  if (!isHTML(request, url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  })());
});
