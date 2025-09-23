// public/service-worker.js
const CACHE_NAME = 'jihyung-app-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Filter out URLs with unsupported schemes
        const validUrls = urlsToCache.filter(url =>
          !url.startsWith('chrome-extension:') &&
          !url.startsWith('moz-extension:')
        )
        return cache.addAll(validUrls)
      })
      .catch(error => {
        console.log('Cache addAll failed:', error)
      })
  )
})

// Fetch event with offline support
self.addEventListener('fetch', event => {
  // Skip for non-GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome-extension and other non-http schemes
  if (event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('moz-extension:') ||
      !event.request.url.startsWith('http')) {
    return
  }

  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online, cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              try {
                cache.put(event.request, responseClone)
              } catch (error) {
                console.log('Cache put failed for API:', error)
              }
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
              try {
                cache.put(event.request, responseToCache)
              } catch (error) {
                console.log('Cache put failed:', error)
              }
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