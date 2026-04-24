const CACHE_NAME = 'casebook-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/cases',
  '/clients',
  '/tasks',
  '/calendar',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Skip non-GET and non-http requests
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  // Network-first for API/Supabase calls
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('/api/')
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Cache-first for static assets (_next/static)
  if (event.request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
          return res
        })
      )
    )
    return
  }

  // Network-first for pages, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
