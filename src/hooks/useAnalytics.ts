import { useState, useCallback } from 'react'

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: Date
}

export const useAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date()
    }

    setEvents(prev => [...prev, event])
    
    // In a real app, this would send to analytics service
    console.log('Analytics Event:', event)
    
    // Store in localStorage for persistence
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]')
      storedEvents.push(event)
      // Keep only last 1000 events
      if (storedEvents.length > 1000) {
        storedEvents.splice(0, storedEvents.length - 1000)
      }
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents))
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }
  }, [])

  const getEvents = useCallback((filterName?: string, days?: number) => {
    let filteredEvents = events

    if (filterName) {
      filteredEvents = filteredEvents.filter(e => e.name === filterName)
    }

    if (days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filteredEvents = filteredEvents.filter(e => e.timestamp >= cutoffDate)
    }

    return filteredEvents
  }, [events])

  const getEventCounts = useCallback((days: number = 7) => {
    const recentEvents = getEvents(undefined, days)
    const counts: Record<string, number> = {}

    recentEvents.forEach(event => {
      counts[event.name] = (counts[event.name] || 0) + 1
    })

    return counts
  }, [getEvents])

  return {
    trackEvent,
    getEvents,
    getEventCounts,
    totalEvents: events.length
  }
}

export default useAnalytics
