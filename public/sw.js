// Service Worker for JIHYUNG PWA
const CACHE_NAME = 'jihyung-v2.0.0';
const OFFLINE_URL = '/offline.html';

// 캐시할 리소스 목록
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // 핵심 CSS/JS는 빌드 후 동적으로 추가됩니다
];

// 런타임 캐시 전략을 위한 경로 패턴
const RUNTIME_CACHE_PATTERNS = {
  images: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  styles: /\.css$/,
  scripts: /\.js$/,
  fonts: /\.(?:woff|woff2|ttf|otf)$/,
  api: /^\/api\//,
};

// Install Event - 초기 캐시 설정
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // 새 서비스 워커를 즉시 활성화
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-caching failed:', error);
      })
  );
});

// Activate Event - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 탭에서 새 서비스 워커 사용
        return self.clients.claim();
      })
  );
});

// Fetch Event - 네트워크 요청 가로채기 및 캐시 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension 요청은 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API 요청 처리
  if (RUNTIME_CACHE_PATTERNS.api.test(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 이미지 요청 처리
  if (RUNTIME_CACHE_PATTERNS.images.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // 정적 리소스 처리 (CSS, JS, Fonts)
  if (RUNTIME_CACHE_PATTERNS.styles.test(url.pathname) ||
      RUNTIME_CACHE_PATTERNS.scripts.test(url.pathname) ||
      RUNTIME_CACHE_PATTERNS.fonts.test(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // HTML 페이지 처리 (Navigation requests)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // 기본 네트워크 우선 전략
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// API 요청 처리 - Network First 전략
async function handleApiRequest(request) {
  const cacheName = `${CACHE_NAME}-api`;

  try {
    // 네트워크를 먼저 시도
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 성공적인 응답을 캐시에 저장 (GET 요청만)
      if (request.method === 'GET') {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API network failed, trying cache:', request.url);

    // 네트워크 실패 시 캐시에서 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 오프라인 API 응답
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: '현재 오프라인 상태입니다. 네트워크 연결을 확인해주세요.',
      offline: true,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// 이미지 요청 처리 - Cache First 전략
async function handleImageRequest(request) {
  const cacheName = `${CACHE_NAME}-images`;

  // 캐시를 먼저 확인
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // 네트워크에서 가져와서 캐시에 저장
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 기본 이미지 또는 오프라인 이미지 반환
    console.log('[SW] Image load failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// 정적 리소스 처리 - Stale While Revalidate
async function handleStaticRequest(request) {
  const cacheName = `${CACHE_NAME}-static`;
  const cache = await caches.open(cacheName);

  // 캐시된 버전을 먼저 반환
  const cachedResponse = await caches.match(request);

  // 백그라운드에서 새 버전 확인 및 업데이트
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || networkPromise;
}

// 네비게이션 요청 처리
async function handleNavigationRequest(request) {
  try {
    // 네트워크를 먼저 시도
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // 오프라인일 때 캐시된 페이지 반환
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }

    // 오프라인 페이지 반환
    return caches.match(OFFLINE_URL);
  }
}

// Background Sync - 오프라인 중 수행된 작업을 온라인 시 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // IndexedDB나 localStorage에서 오프라인 중 저장된 데이터 가져와서 동기화
    console.log('[SW] Performing background sync');

    // 예시: 오프라인 중 작성된 노트나 할 일 동기화
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData);
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push 알림 처리
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'jihyung-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: '/icon-open.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icon-close.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification('JIHYUNG', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// 클라이언트와의 메시지 통신
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
});

// 유틸리티 함수들
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

async function getOfflineData() {
  // IndexedDB에서 오프라인 데이터 가져오기 (실제 구현 필요)
  return [];
}

async function syncOfflineData(data) {
  // 오프라인 데이터를 서버와 동기화 (실제 구현 필요)
  for (const item of data) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('[SW] Sync item failed:', error);
    }
  }
}

// 캐시 크기 관리
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name =>
    name.startsWith('jihyung-') && name !== CACHE_NAME
  );

  return Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}

// 정기적인 캐시 정리 (24시간마다)
setInterval(cleanupOldCaches, 24 * 60 * 60 * 1000);

console.log('[SW] Service Worker initialized:', CACHE_NAME);