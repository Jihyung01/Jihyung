// PWA 유틸리티 함수들
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private installPromptShown = false;

  constructor() {
    this.init();
  }

  private init() {
    this.checkInstallation();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  // 설치 상태 확인
  private checkInstallation() {
    // PWA가 설치되었는지 확인
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // iOS Safari에서 홈 화면에 추가되었는지 확인
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  // 이벤트 리스너 설정
  private setupEventListeners() {
    // 설치 프롬프트 이벤트 처리
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallBanner();
    });

    // 앱이 설치되었을 때
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallBanner();
      this.trackEvent('pwa_installed');
      console.log('PWA was installed');
    });

    // 온라인/오프라인 상태 변경
    window.addEventListener('online', () => {
      this.showNotification('온라인 상태로 돌아왔습니다', { type: 'success' });
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.showNotification('오프라인 모드로 전환됩니다', { type: 'warning' });
    });

    // 페이지 가시성 변경 (백그라운드/포그라운드)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppForeground();
      } else {
        this.handleAppBackground();
      }
    });
  }

  // Service Worker 등록
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        this.serviceWorker = registration;

        // Service Worker 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Service Worker 메시지 처리
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // 앱 설치 프롬프트 표시
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt || this.isInstalled) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.trackEvent('pwa_install_accepted');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        this.trackEvent('pwa_install_dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // 설치 배너 표시
  private showInstallBanner() {
    if (this.installPromptShown || this.isInstalled) return;

    // 3초 후에 설치 배너 표시
    setTimeout(() => {
      if (!this.installPromptShown && !this.isInstalled) {
        this.createInstallBanner();
        this.installPromptShown = true;
      }
    }, 3000);
  }

  // 설치 배너 생성
  private createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 transform translate-y-full transition-transform duration-300';

    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">JIHYUNG 앱 설치</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">더 빠르고 편리한 사용을 위해 앱을 설치하세요</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <button id="install-app-btn" class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity">
          설치
        </button>
        <button id="dismiss-banner-btn" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          나중에
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // 애니메이션으로 배너 표시
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 100);

    // 이벤트 리스너 추가
    const installBtn = banner.querySelector('#install-app-btn');
    const dismissBtn = banner.querySelector('#dismiss-banner-btn');

    installBtn?.addEventListener('click', async () => {
      const installed = await this.showInstallPrompt();
      if (installed) {
        this.hideInstallBanner();
      }
    });

    dismissBtn?.addEventListener('click', () => {
      this.hideInstallBanner();
      this.trackEvent('pwa_banner_dismissed');
    });

    // 10초 후 자동으로 숨김
    setTimeout(() => {
      if (document.getElementById('pwa-install-banner')) {
        this.hideInstallBanner();
      }
    }, 10000);
  }

  // 설치 배너 숨김
  private hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // 업데이트 알림 표시
  private showUpdateAvailable() {
    this.showNotification('새로운 업데이트가 있습니다', {
      type: 'info',
      persistent: true,
      action: {
        text: '업데이트',
        callback: () => this.updateApp()
      }
    });
  }

  // 앱 업데이트
  private async updateApp() {
    if (this.serviceWorker?.waiting) {
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

      // 페이지 새로고침
      window.location.reload();
    }
  }

  // Service Worker 메시지 처리
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'VERSION':
        console.log('Service Worker version:', data.version);
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.urls);
        break;
      case 'SYNC_COMPLETE':
        this.showNotification('데이터 동기화가 완료되었습니다', { type: 'success' });
        break;
    }
  }

  // 알림 표시
  private showNotification(message: string, options: {
    type?: 'success' | 'error' | 'warning' | 'info';
    persistent?: boolean;
    action?: { text: string; callback: () => void };
  } = {}) {
    // Sonner toast 라이브러리 사용 (이미 프로젝트에 설치됨)
    if (typeof window !== 'undefined' && (window as any).toast) {
      const toast = (window as any).toast;

      switch (options.type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast(message);
      }
    } else {
      console.log(`[PWA] ${message}`);
    }
  }

  // 앱이 포그라운드로 돌아왔을 때
  private handleAppForeground() {
    // 데이터 새로고침 또는 동기화
    this.syncOfflineData();
    this.trackEvent('app_foreground');
  }

  // 앱이 백그라운드로 갔을 때
  private handleAppBackground() {
    // 중요한 데이터 저장
    this.saveImportantData();
    this.trackEvent('app_background');
  }

  // 오프라인 데이터 동기화
  private async syncOfflineData() {
    if (!navigator.onLine || !this.serviceWorker) return;

    try {
      // Service Worker에 동기화 요청
      if (this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'SYNC_DATA'
        });
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  // 중요한 데이터 저장
  private saveImportantData() {
    // localStorage나 IndexedDB에 중요한 상태 저장
    try {
      const appState = {
        timestamp: Date.now(),
        // 필요한 앱 상태 데이터 추가
      };
      localStorage.setItem('pwa_app_state', JSON.stringify(appState));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }

  // 이벤트 추적
  private trackEvent(eventName: string, properties?: Record<string, any>) {
    // Google Analytics나 다른 분석 도구와 연동
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        custom_parameter: properties,
        app_name: 'JIHYUNG',
        app_version: '2.0.0'
      });
    }

    console.log(`[PWA Event] ${eventName}:`, properties);
  }

  // Push 알림 권한 요청
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Push 알림 구독
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorker) return null;

    try {
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // VAPID 키 변환
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 서버에 구독 정보 전송
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: this.getCurrentUserId(),
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // 현재 사용자 ID 가져오기 (실제 구현 필요)
  private getCurrentUserId(): string {
    // 실제 인증 시스템과 연동
    return 'user-' + Date.now();
  }

  // Getter 메서드들
  public get isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public get canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  public get isOnline(): boolean {
    return navigator.onLine;
  }
}

// 싱글톤 인스턴스
export const pwaManager = new PWAManager();

// 유틸리티 함수들
export const PWAUtils = {
  // 앱 설치 상태 확인
  isInstalled: () => pwaManager.isAppInstalled,

  // 설치 프롬프트 표시
  showInstallPrompt: () => pwaManager.showInstallPrompt(),

  // 알림 권한 요청
  requestNotifications: () => pwaManager.requestNotificationPermission(),

  // Push 알림 구독
  subscribeToPush: () => pwaManager.subscribeToPush(),

  // 온라인 상태 확인
  isOnline: () => pwaManager.isOnline,

  // 네트워크 상태 모니터링
  onNetworkChange: (callback: (online: boolean) => void) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  // 앱 데이터 캐시
  cacheAppData: async (key: string, data: any) => {
    try {
      const cache = await caches.open('jihyung-app-data');
      const response = new Response(JSON.stringify(data));
      await cache.put(new Request(key), response);
    } catch (error) {
      console.error('Failed to cache app data:', error);
    }
  },

  // 캐시된 데이터 가져오기
  getCachedData: async (key: string) => {
    try {
      const cache = await caches.open('jihyung-app-data');
      const response = await cache.match(new Request(key));
      if (response) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    return null;
  }
};

export default PWAUtils;