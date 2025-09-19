import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X, Smartphone } from 'lucide-react'
import { notificationService } from '../../services/NotificationService'
import { hapticFeedback } from '../../hooks/useMobileGestures'

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  showOnMount?: boolean
}

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showOnMount = true
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isVisible, setIsVisible] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    const currentPermission = notificationService.getPermissionStatus()
    setPermission(currentPermission)

    // Show permission request if default and showOnMount is true
    if (currentPermission === 'default' && showOnMount) {
      // Delay to allow page to load
      setTimeout(() => setIsVisible(true), 2000)
    }
  }, [showOnMount])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    hapticFeedback.light()

    try {
      const result = await notificationService.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        onPermissionGranted?.()
        hapticFeedback.success()
        setIsVisible(false)
      } else {
        onPermissionDenied?.()
        hapticFeedback.error()
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error)
      hapticFeedback.error()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    hapticFeedback.light()

    // Remember dismissal (show again after 24 hours)
    localStorage.setItem('notification-permission-dismissed', Date.now().toString())
  }

  const handleNotNow = () => {
    setIsVisible(false)
    hapticFeedback.light()

    // Show again in 1 hour
    setTimeout(() => {
      if (notificationService.getPermissionStatus() === 'default') {
        setIsVisible(true)
      }
    }, 60 * 60 * 1000) // 1 hour
  }

  // Don't show if already granted or denied
  if (permission !== 'default') {
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  알림을 받으시겠어요?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  JIHYUNG이 중요한 일정, 태스크, 리마인더를 적시에 알려드릴게요.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">태스크 리마인더</p>
                    <p className="text-xs text-gray-500">마감시간을 놓치지 마세요</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">일정 알림</p>
                    <p className="text-xs text-gray-500">중요한 미팅을 미리 알려드려요</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <BellOff className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">스마트 알림</p>
                    <p className="text-xs text-gray-500">방해하지 않는 선에서만 알려드려요</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      알림 허용
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

              {/* Privacy note */}
              <p className="text-xs text-gray-400 mt-4">
                언제든지 브라우저 설정에서 알림을 끌 수 있습니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for checking notification status
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const updatePermission = () => {
      setPermission(notificationService.getPermissionStatus())
    }

    updatePermission()

    // Listen for permission changes
    const interval = setInterval(updatePermission, 1000)

    return () => clearInterval(interval)
  }, [])

  const requestPermission = async () => {
    const result = await notificationService.requestPermission()
    setPermission(result)
    return result
  }

  return {
    permission,
    requestPermission,
    isSupported: notificationService.isSupported()
  }
}