/* GENIUS ∞ service worker — offline always, fresh on first reload.
   Navigations are network-first (so updates land immediately when online,
   cache serves when offline); hashed assets are cache-first (immutable). */
const CACHE = 'cre8-v1'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manual.html'])).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const sameOrigin = new URL(e.request.url).origin === location.origin
  const isNav = e.request.mode === 'navigate' || e.request.destination === 'document'
  if (isNav) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok && sameOrigin) { const cl = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cl)) }
        return res
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./'))),
    )
    return
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && sameOrigin) { const cl = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cl)) }
      return res
    })),
  )
})
