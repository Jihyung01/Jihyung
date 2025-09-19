// public/service-worker.js
const CACHE_NAME = 'jihyung-app-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.css',
  '/favicon.ico'
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Fetch event with offline support
self.addEventListener('fetch', event => {
  // Skip for non-GET requests
  if (event.request.method !== 'GET') return

  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online, cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline message for API calls
            return new Response(JSON.stringify({
              error: 'Offline',
              message: '현재 오프라인 상태입니다. 네트워크 연결을 확인해주세요.'
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response
        }

        // Clone the request
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })

          return response
        }).catch(() => {
          // If offline and no cache, return offline page
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})