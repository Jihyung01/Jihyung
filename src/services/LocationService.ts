export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
  city?: string
  country?: string
}

export interface LocationPermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
  lastRequested?: number
  userChoice?: 'granted' | 'denied' | 'dismissed'
}

class LocationService {
  private currentLocation: LocationData | null = null
  private permissionState: LocationPermissionState = {
    granted: false,
    denied: false,
    prompt: true
  }
  private watchId: number | null = null
  private onLocationUpdate: ((location: LocationData) => void) | null = null

  constructor() {
    this.loadPermissionState()
    this.checkInitialPermission()
  }

  // Load permission state from localStorage
  private loadPermissionState(): void {
    try {
      const saved = localStorage.getItem('jihyung-location-permission')
      if (saved) {
        this.permissionState = { ...this.permissionState, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('위치 권한 상태 로드 실패:', error)
    }
  }

  // Save permission state to localStorage
  private savePermissionState(): void {
    try {
      localStorage.setItem('jihyung-location-permission', JSON.stringify(this.permissionState))
    } catch (error) {
      console.error('위치 권한 상태 저장 실패:', error)
    }
  }

  // Check initial permission without prompting
  private async checkInitialPermission(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })

        switch (permission.state) {
          case 'granted':
            this.permissionState.granted = true
            this.permissionState.denied = false
            this.permissionState.prompt = false
            break
          case 'denied':
            this.permissionState.granted = false
            this.permissionState.denied = true
            this.permissionState.prompt = false
            break
          case 'prompt':
            this.permissionState.granted = false
            this.permissionState.denied = false
            this.permissionState.prompt = true
            break
        }

        this.savePermissionState()

        // Listen for permission changes
        permission.addEventListener('change', () => {
          this.checkInitialPermission()
        })
      } catch (error) {
        console.error('위치 권한 확인 실패:', error)
      }
    }
  }

  // Request location permission
  async requestPermission(): Promise<LocationPermissionState> {
    if (!this.isSupported()) {
      throw new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.')
    }

    // Don't ask again if user previously denied and it hasn't been 24 hours
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    if (this.permissionState.denied &&
        this.permissionState.lastRequested &&
        (now - this.permissionState.lastRequested) < dayInMs) {
      return this.permissionState
    }

    this.permissionState.lastRequested = now

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - permission granted
          this.permissionState = {
            granted: true,
            denied: false,
            prompt: false,
            lastRequested: now,
            userChoice: 'granted'
          }

          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }

          this.savePermissionState()
          this.reverseGeocode(this.currentLocation)
          resolve(this.permissionState)
        },
        (error) => {
          // Error - permission denied or other error
          console.error('위치 접근 오류:', error)

          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.permissionState = {
                granted: false,
                denied: true,
                prompt: false,
                lastRequested: now,
                userChoice: 'denied'
              }
              break
            case error.POSITION_UNAVAILABLE:
            case error.TIMEOUT:
              // Don't change permission state for these errors
              break
          }

          this.savePermissionState()
          resolve(this.permissionState)
        },
        options
      )
    })
  }

  // Get current location (if permission granted)
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.permissionState.granted) {
      return null
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }

          this.currentLocation = location
          this.reverseGeocode(location)
          resolve(location)
        },
        (error) => {
          console.error('위치 가져오기 실패:', error)
          reject(error)
        },
        options
      )
    })
  }

  // Start watching location changes
  startWatching(callback: (location: LocationData) => void): void {
    if (!this.permissionState.granted) {
      console.warn('위치 권한이 없어 위치 추적을 시작할 수 없습니다.')
      return
    }

    this.onLocationUpdate = callback

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000 // 1 minute
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }

        this.currentLocation = location
        this.reverseGeocode(location)
        callback(location)
      },
      (error) => {
        console.error('위치 추적 오류:', error)
      },
      options
    )
  }

  // Stop watching location changes
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
      this.onLocationUpdate = null
    }
  }

  // Reverse geocoding (convert coordinates to address)
  private async reverseGeocode(location: LocationData): Promise<void> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'JIHYUNG-App/1.0'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()

        if (data.address) {
          location.address = data.display_name
          location.city = data.address.city || data.address.town || data.address.village
          location.country = data.address.country

          // Update current location with address info
          if (this.currentLocation) {
            this.currentLocation.address = location.address
            this.currentLocation.city = location.city
            this.currentLocation.country = location.country
          }

          // Notify callback if watching
          if (this.onLocationUpdate) {
            this.onLocationUpdate(location)
          }
        }
      }
    } catch (error) {
      console.error('주소 변환 실패:', error)
    }
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180)
  }

  // Check if location services are supported
  isSupported(): boolean {
    return 'geolocation' in navigator
  }

  // Get permission state
  getPermissionState(): LocationPermissionState {
    return { ...this.permissionState }
  }

  // Get current cached location
  getCachedLocation(): LocationData | null {
    return this.currentLocation ? { ...this.currentLocation } : null
  }

  // Reset permission state (for testing or user request)
  resetPermissionState(): void {
    this.permissionState = {
      granted: false,
      denied: false,
      prompt: true
    }
    this.savePermissionState()
    this.currentLocation = null
  }

  // Check if user is near a specific location
  isNearLocation(targetLat: number, targetLon: number, radiusKm: number = 1): boolean {
    if (!this.currentLocation) return false

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      targetLat,
      targetLon
    )

    return distance <= radiusKm
  }

  // Get location-based suggestions (e.g., nearby tasks/events)
  getLocationBasedSuggestions(): string[] {
    if (!this.currentLocation || !this.currentLocation.city) {
      return []
    }

    const suggestions: string[] = []
    const { city, country } = this.currentLocation

    // Add location-based task suggestions
    suggestions.push(`${city}에서 할 일 추가`)

    if (city) {
      suggestions.push(`${city} 날씨 확인`)
      suggestions.push(`${city} 교통정보 확인`)
    }

    if (country === '대한민국' || country === 'South Korea') {
      suggestions.push('주변 카페 찾기')
      suggestions.push('근처 맛집 검색')
    }

    return suggestions
  }
}

// Export singleton instance
export const locationService = new LocationService()

export default locationService