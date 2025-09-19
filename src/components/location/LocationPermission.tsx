import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Navigation, Clock, Target } from 'lucide-react'
import { locationService, LocationPermissionState } from '../../services/LocationService'
import { hapticFeedback } from '../../hooks/useMobileGestures'

interface LocationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  showOnMount?: boolean
}

export const LocationPermission: React.FC<LocationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showOnMount = true
}) => {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    granted: false,
    denied: false,
    prompt: true
  })
  const [isVisible, setIsVisible] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    const currentState = locationService.getPermissionState()
    setPermissionState(currentState)

    // Show permission request if needed
    if (currentState.prompt && showOnMount && !currentState.denied) {
      // Check if we should show based on last request time
      const now = Date.now()
      const dayInMs = 24 * 60 * 60 * 1000

      if (!currentState.lastRequested ||
          (now - currentState.lastRequested) > dayInMs) {
        setTimeout(() => setIsVisible(true), 3000) // Show after 3 seconds
      }
    }
  }, [showOnMount])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    hapticFeedback.light()

    try {
      const result = await locationService.requestPermission()
      setPermissionState(result)

      if (result.granted) {
        onPermissionGranted?.()
        hapticFeedback.success()
        setIsVisible(false)
      } else if (result.denied) {
        onPermissionDenied?.()
        hapticFeedback.error()
      }
    } catch (error) {
      console.error('위치 권한 요청 실패:', error)
      hapticFeedback.error()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    hapticFeedback.light()
  }

  const handleNotNow = () => {
    setIsVisible(false)
    hapticFeedback.light()

    // Mark as dismissed but allow showing again later
    const dismissedState = {
      ...permissionState,
      lastRequested: Date.now(),
      userChoice: 'dismissed' as const
    }
    setPermissionState(dismissedState)
  }

  // Don't show if already granted or permanently denied
  if (permissionState.granted ||
      (permissionState.denied && permissionState.userChoice === 'denied')) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleNotNow}
          />

          {/* Permission Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-sm mx-auto"
          >
            {/* Header */}
            <div className="relative p-6 text-center">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  위치 접근을 허용하시겠어요?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  JIHYUNG이 위치 기반 서비스를 제공하여 더 유용한 기능을 사용할 수 있습니다.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">위치 기반 리마인더</p>
                    <p className="text-xs text-gray-500">특정 장소에 도착하면 알림</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">출퇴근 시간 계산</p>
                    <p className="text-xs text-gray-500">일정에 이동시간 자동 추가</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">주변 정보 제공</p>
                    <p className="text-xs text-gray-500">현재 위치 기반 추천</p>
                  </div>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  위치 정보는 안전하게 보호되며, 서버에 저장되지 않습니다
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      위치 접근 허용
                    </>
                  )}
                </button>

                <button
                  onClick={handleNotNow}
                  className="w-full text-gray-500 font-medium py-2 px-4 hover:text-gray-700 transition-colors"
                >
                  나중에
                </button>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-400 mt-4">
                브라우저 설정에서 언제든지 변경할 수 있습니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for using location services
export const useLocation = () => {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>({
    granted: false,
    denied: false,
    prompt: true
  })

  const [currentLocation, setCurrentLocation] = useState(locationService.getCachedLocation())

  useEffect(() => {
    const updateState = () => {
      setPermissionState(locationService.getPermissionState())
      setCurrentLocation(locationService.getCachedLocation())
    }

    updateState()

    // Update location periodically if permission granted
    const interval = setInterval(() => {
      if (locationService.getPermissionState().granted) {
        locationService.getCurrentLocation().then(updateState).catch(console.error)
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const requestPermission = async () => {
    const result = await locationService.requestPermission()
    setPermissionState(result)
    if (result.granted) {
      setCurrentLocation(locationService.getCachedLocation())
    }
    return result
  }

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation()
      setCurrentLocation(location)
      return location
    } catch (error) {
      console.error('위치 가져오기 실패:', error)
      return null
    }
  }

  return {
    permissionState,
    currentLocation,
    requestPermission,
    getCurrentLocation,
    isSupported: locationService.isSupported(),
    calculateDistance: locationService.calculateDistance.bind(locationService),
    isNearLocation: locationService.isNearLocation.bind(locationService)
  }
}