import { useState, useEffect, useCallback, useRef } from 'react'

interface GestureState {
  isActive: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  distance: number
  angle: number
  velocity: number
}

interface GestureOptions {
  enableSwipe?: boolean
  enablePinch?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  swipeThreshold?: number
  pinchThreshold?: number
  rotateThreshold?: number
}

interface GestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinchIn?: (scale: number) => void
  onPinchOut?: (scale: number) => void
  onRotate?: (angle: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  onLongPress?: (x: number, y: number) => void
}

export const useGestures = (
  options: GestureOptions = {},
  callbacks: GestureCallbacks = {}
) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    angle: 0,
    velocity: 0
  })

  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const gestureRef = useRef<HTMLElement>(null)
  const tapTimeRef = useRef<number>(0)
  const tapCountRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    enableSwipe = true,
    enablePinch = true,
    enableRotate = true,
    enablePan = true,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    rotateThreshold = 5
  } = options

  const calculateDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }, [])

  const calculateAngle = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const currentTime = Date.now()
    
    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY
    }))

    // 롱 프레스 감지
    longPressTimerRef.current = setTimeout(() => {
      callbacks.onLongPress?.(touch.clientX, touch.clientY)
    }, 500)

    // 더블 탭 감지
    if (currentTime - tapTimeRef.current < 300) {
      tapCountRef.current += 1
      if (tapCountRef.current === 2) {
        callbacks.onDoubleTap?.(touch.clientX, touch.clientY)
        tapCountRef.current = 0
      }
    } else {
      tapCountRef.current = 1
    }
    tapTimeRef.current = currentTime
  }, [callbacks])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    setGestureState(prev => {
      const deltaX = touch.clientX - prev.startX
      const deltaY = touch.clientY - prev.startY
      const distance = calculateDistance(prev.startX, prev.startY, touch.clientX, touch.clientY)
      const angle = calculateAngle(prev.startX, prev.startY, touch.clientX, touch.clientY)
      const velocity = distance / (Date.now() - tapTimeRef.current)

      // 핀치 제스처 (멀티터치)
      if (enablePinch && e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = calculateDistance(
          touch1.clientX, touch1.clientY,
          touch2.clientX, touch2.clientY
        )
        
        if (prev.distance > 0) {
          const scaleChange = currentDistance / prev.distance
          setScale(prevScale => {
            const newScale = prevScale * scaleChange
            if (scaleChange > 1 + pinchThreshold) {
              callbacks.onPinchOut?.(newScale)
            } else if (scaleChange < 1 - pinchThreshold) {
              callbacks.onPinchIn?.(newScale)
            }
            return newScale
          })
        }

        return {
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY,
          deltaX,
          deltaY,
          distance: currentDistance,
          angle,
          velocity
        }
      }

      // 패닝
      if (enablePan) {
        callbacks.onPan?.(deltaX, deltaY)
      }

      return {
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY,
        distance,
        angle,
        velocity
      }
    })
  }, [callbacks, calculateDistance, calculateAngle, enablePinch, enablePan, pinchThreshold])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    setGestureState(prev => {
      // 스와이프 감지
      if (enableSwipe && prev.distance > swipeThreshold) {
        const angle = prev.angle
        if (angle > -45 && angle < 45) {
          callbacks.onSwipeRight?.()
        } else if (angle > 45 && angle < 135) {
          callbacks.onSwipeDown?.()
        } else if (angle > 135 || angle < -135) {
          callbacks.onSwipeLeft?.()
        } else if (angle > -135 && angle < -45) {
          callbacks.onSwipeUp?.()
        }
      }

      // 단일 탭 (더블 탭이 아닌 경우)
      if (prev.distance < 10 && tapCountRef.current === 1) {
        setTimeout(() => {
          if (tapCountRef.current === 1) {
            callbacks.onTap?.(prev.currentX, prev.currentY)
          }
        }, 300)
      }

      return {
        ...prev,
        isActive: false
      }
    })
  }, [callbacks, enableSwipe, swipeThreshold])

  const bind = useCallback(() => {
    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      style: { touchAction: 'none' }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    const element = gestureRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    gestureState,
    scale,
    rotation,
    bind,
    ref: gestureRef
  }
}
