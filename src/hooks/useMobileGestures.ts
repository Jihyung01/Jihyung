import { useEffect, useRef, useState, useCallback } from 'react'

// Haptic feedback interface
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    // iOS haptic feedback
    if ('hapticFeedback' in window) {
      ;(window as any).hapticFeedback.impactOccurred('light')
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
    if ('hapticFeedback' in window) {
      ;(window as any).hapticFeedback.impactOccurred('medium')
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    if ('hapticFeedback' in window) {
      ;(window as any).hapticFeedback.impactOccurred('heavy')
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
    if ('hapticFeedback' in window) {
      ;(window as any).hapticFeedback.notificationOccurred('success')
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50])
    }
    if ('hapticFeedback' in window) {
      ;(window as any).hapticFeedback.notificationOccurred('error')
    }
  }
}

interface SwipeGesture {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  preventDefaultTouchmove?: boolean
}

export const useSwipeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefaultTouchmove = false
}: SwipeGesture) => {
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmove) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      }

      const deltaX = touchEnd.x - touchStartRef.current.x
      const deltaY = touchEnd.y - touchStartRef.current.y

      // Determine if it's a swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.()
            hapticFeedback.light()
          } else {
            onSwipeLeft?.()
            hapticFeedback.light()
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.()
            hapticFeedback.light()
          } else {
            onSwipeUp?.()
            hapticFeedback.light()
          }
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmove })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventDefaultTouchmove])

  return elementRef
}

// Pull to refresh hook
interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  resistance?: number
  isEnabled?: boolean
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  isEnabled = true
}: PullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const elementRef = useRef<HTMLElement>(null)
  const touchStartRef = useRef<number | null>(null)
  const lastScrollTopRef = useRef<number>(0)

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    hapticFeedback.medium()

    try {
      await onRefresh()
      hapticFeedback.success()
    } catch (error) {
      hapticFeedback.error()
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh, isRefreshing])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !isEnabled) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if we're at the top of the scroll
      if (element.scrollTop === 0) {
        touchStartRef.current = e.touches[0].clientY
        lastScrollTopRef.current = element.scrollTop
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || element.scrollTop > 0) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartRef.current

      if (deltaY > 0) {
        // Pulling down
        const distance = Math.min(deltaY / resistance, threshold * 1.5)
        setPullDistance(distance)

        if (distance > threshold * 0.3) {
          hapticFeedback.light()
        }

        // Prevent default scrolling when pulling
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (pullDistance > threshold && !isRefreshing) {
        triggerRefresh()
      } else {
        setPullDistance(0)
      }
      touchStartRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, threshold, resistance, isEnabled, triggerRefresh, isRefreshing])

  return {
    ref: elementRef,
    isRefreshing,
    pullDistance,
    triggerRefresh
  }
}