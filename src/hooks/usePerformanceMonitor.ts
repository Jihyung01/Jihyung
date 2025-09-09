import { useState, useEffect } from 'react'

export interface PerformanceMetrics {
  frameRate: number
  memoryUsage: number
  renderTime: number
  componentCount: number
  updateFrequency: number
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 60,
    memoryUsage: 45.6,
    renderTime: 16.7,
    componentCount: 156,
    updateFrequency: 30
  })

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [alerts, setAlerts] = useState<string[]>([])

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // 실시간 성능 지표 시뮬레이션
      setMetrics(prev => ({
        frameRate: Math.max(30, prev.frameRate + (Math.random() - 0.5) * 5),
        memoryUsage: Math.max(20, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 2)),
        renderTime: Math.max(8, prev.renderTime + (Math.random() - 0.5) * 3),
        componentCount: prev.componentCount + Math.floor((Math.random() - 0.5) * 10),
        updateFrequency: Math.max(15, prev.updateFrequency + (Math.random() - 0.5) * 5)
      }))

      // 성능 알림 체크
      if (metrics.frameRate < 40) {
        setAlerts(prev => [...prev, 'Low frame rate detected'])
      }
      if (metrics.memoryUsage > 80) {
        setAlerts(prev => [...prev, 'High memory usage warning'])
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring, metrics.frameRate, metrics.memoryUsage])

  const startMonitoring = () => setIsMonitoring(true)
  const stopMonitoring = () => setIsMonitoring(false)
  const clearAlerts = () => setAlerts([])

  const optimizePerformance = () => {
    setMetrics(prev => ({
      ...prev,
      frameRate: Math.min(60, prev.frameRate + 10),
      memoryUsage: Math.max(20, prev.memoryUsage - 15),
      renderTime: Math.max(8, prev.renderTime - 3)
    }))
    setAlerts([])
  }

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts,
    optimizePerformance
  }
}
