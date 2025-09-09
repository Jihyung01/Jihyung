import { useState, useEffect, useCallback, useRef } from 'react'

export interface GestureState {
  isActive: boolean
  startPos: { x: number; y: number }
  currentPos: { x: number; y: number }
  deltaX: number
  deltaY: number
  distance: number
  velocity: number
  direction: 'up' | 'down' | 'left' | 'right' | null
}

export interface GestureHandlers {
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onTap?: (position: { x: number; y: number }) => void
  onLongPress?: (position: { x: number; y: number }) => void
  onPan?: (delta: { x: number; y: number }, position: { x: number; y: number }) => void
}

export const useGestures = (handlers: GestureHandlers) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    velocity: 0,
    direction: null
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTouchTime = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    const startTime = Date.now()
    touchStartTime.current = startTime

    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startPos: { x: touch.clientX, y: touch.clientY },
      currentPos: { x: touch.clientX, y: touch.clientY }
    }))

    // 롱프레스 감지
    timeoutRef.current = setTimeout(() => {
      handlers.onLongPress?.({ x: touch.clientX, y: touch.clientY })
    }, 500)
  }, [handlers])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!gestureState.isActive) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - gestureState.startPos.x
    const deltaY = touch.clientY - gestureState.startPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    setGestureState(prev => ({
      ...prev,
      currentPos: { x: touch.clientX, y: touch.clientY },
      deltaX,
      deltaY,
      distance
    }))

    // 팬 제스처
    handlers.onPan?.({ x: deltaX, y: deltaY }, { x: touch.clientX, y: touch.clientY })

    // 롱프레스 취소 (움직임 감지시)
    if (distance > 10 && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [gestureState, handlers])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gestureState.isActive) return

    const endTime = Date.now()
    const duration = endTime - touchStartTime.current
    const velocity = gestureState.distance / duration

    // 방향 계산
    let direction: 'up' | 'down' | 'left' | 'right' | null = null
    if (Math.abs(gestureState.deltaX) > Math.abs(gestureState.deltaY)) {
      direction = gestureState.deltaX > 0 ? 'right' : 'left'
    } else {
      direction = gestureState.deltaY > 0 ? 'down' : 'up'
    }

    setGestureState(prev => ({
      ...prev,
      velocity,
      direction
    }))

    // 스와이프 감지 (거리와 속도 기준)
    if (gestureState.distance > 50 && velocity > 0.3) {
      handlers.onSwipe?.(direction, velocity)
    }
    // 탭 감지 (짧은 시간, 짧은 거리)
    else if (duration < 200 && gestureState.distance < 10) {
      handlers.onTap?.(gestureState.currentPos)
    }

    // 상태 리셋
    setGestureState(prev => ({
      ...prev,
      isActive: false,
      deltaX: 0,
      deltaY: 0,
      distance: 0,
      velocity: 0,
      direction: null
    }))

    // 롱프레스 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [gestureState, handlers])

  // 핀치 제스처 처리
  const handleTouchStartPinch = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      // 핀치 시작 거리 저장
    }
  }, [])

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }

  const enableGestures = useCallback((element: HTMLElement) => {
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
    gestureHandlers,
    enableGestures
  }
}
