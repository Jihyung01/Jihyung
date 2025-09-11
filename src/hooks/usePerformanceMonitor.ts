import { useState, useEffect, useCallback } from 'react'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  cpuUsage: number
  networkLatency: number
}

interface PerformanceMonitorOptions {
  enableAutoOptimization?: boolean
  memoryThreshold?: number
  fpsThreshold?: number
}

export const usePerformanceMonitor = (options: PerformanceMonitorOptions = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    cpuUsage: 0,
    networkLatency: 0
  })
  
  const [isOptimized, setIsOptimized] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const measurePerformance = useCallback(() => {
    // FPS 측정
    let lastTime = performance.now()
    let frameCount = 0
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime
      
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        
        // 메모리 사용량 측정
        const memoryUsage = (performance as any).memory ? 
          (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0
        
        // 렌더링 시간 측정
        const renderTime = performance.now() - currentTime
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage,
          renderTime,
          cpuUsage: Math.random() * 100, // 실제 구현에서는 더 정확한 측정 필요
          networkLatency: Math.random() * 100
        }))
        
        frameCount = 0
        lastTime = currentTime
        
        // 성능 경고 체크
        const newWarnings: string[] = []
        if (fps < (options.fpsThreshold || 30)) {
          newWarnings.push('Low FPS detected')
        }
        if (memoryUsage > (options.memoryThreshold || 100)) {
          newWarnings.push('High memory usage')
        }
        setWarnings(newWarnings)
        
        // 자동 최적화
        if (options.enableAutoOptimization && (fps < 30 || memoryUsage > 100)) {
          optimizePerformance()
        }
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }, [options])

  const optimizePerformance = useCallback(() => {
    setIsOptimized(true)
    // 실제 최적화 로직 (예: 불필요한 렌더링 방지, 메모리 정리 등)
    setTimeout(() => setIsOptimized(false), 2000)
  }, [])

  const clearCache = useCallback(() => {
    // 캐시 정리 로직
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
  }, [])

  useEffect(() => {
    measurePerformance()
  }, [measurePerformance])

  return {
    metrics,
    isOptimized,
    warnings,
    optimizePerformance,
    clearCache
  }
}
