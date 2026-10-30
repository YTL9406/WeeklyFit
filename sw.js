/* Weekly Fit 離線快取：有網路時抓最新版，沒網路時用上次存的版本 */
const CACHE = "weekly-fit-v1";
const FILES = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000);
      const res = await fetch(r, { signal: ctl.signal, cache: "no-cache" });
      clearTimeout(t);
      if (res && res.ok) cache.put(r, res.clone());
      return res;
    } catch (err) {
      const hit = (await cache.match(r, { ignoreSearch: true })) || (r.mode === "navigate" ? await cache.match("./index.html") : null);
      return hit || Response.error();
    }
  })());
});
