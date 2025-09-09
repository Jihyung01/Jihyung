import { useState, useEffect, useCallback } from 'react'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  attendees?: string[]
  type: 'event' | 'task' | 'reminder'
  priority: 'low' | 'medium' | 'high'
  completed?: boolean
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
  }
}

export const useRealTimeCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 로컬 스토리지에서 이벤트 로드
  const loadEvents = useCallback(() => {
    try {
      const stored = localStorage.getItem('calendar-events')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Date 객체로 변환
        const eventsWithDates = parsed.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }))
        setEvents(eventsWithDates)
      }
    } catch (error) {
      console.error('Failed to load events:', error)
      setError('Failed to load events')
    }
  }, [])

  // 로컬 스토리지에 이벤트 저장
  const saveEvents = useCallback((newEvents: CalendarEvent[]) => {
    try {
      localStorage.setItem('calendar-events', JSON.stringify(newEvents))
    } catch (error) {
      console.error('Failed to save events:', error)
      setError('Failed to save events')
    }
  }, [])

  // 이벤트 추가
  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    setEvents(prev => {
      const updated = [...prev, newEvent]
      saveEvents(updated)
      return updated
    })
    
    return newEvent
  }, [saveEvents])

  // 이벤트 업데이트
  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => {
      const updated = prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      )
      saveEvents(updated)
      return updated
    })
  }, [saveEvents])

  // 이벤트 삭제
  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const updated = prev.filter(event => event.id !== id)
      saveEvents(updated)
      return updated
    })
  }, [saveEvents])

  // 날짜별 이벤트 가져오기
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    })
  }, [events])

  // 주간 이벤트 가져오기
  const getEventsForWeek = useCallback((startDate: Date) => {
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 7)
    
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate >= startDate && eventDate < endDate
    })
  }, [events])

  // 월간 이벤트 가져오기
  const getEventsForMonth = useCallback((year: number, month: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
  }, [events])

  // 태스크를 이벤트로 변환
  const createEventFromTask = useCallback((task: {
    title: string
    description?: string
    dueDate?: Date
    priority: 'low' | 'medium' | 'high'
  }) => {
    const now = new Date()
    const eventStart = task.dueDate || new Date(now.getTime() + 24 * 60 * 60 * 1000) // 내일
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000) // 1시간 후

    return addEvent({
      title: task.title,
      description: task.description,
      start: eventStart,
      end: eventEnd,
      type: 'task',
      priority: task.priority
    })
  }, [addEvent])

  // 반복 이벤트 생성
  const createRecurringEvent = useCallback((
    baseEvent: Omit<CalendarEvent, 'id'>,
    recurring: NonNullable<CalendarEvent['recurring']>
  ) => {
    const recurringEvents: CalendarEvent[] = []
    const startDate = new Date(baseEvent.start)
    const endDate = recurring.endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1년 후
    
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const eventStart = new Date(currentDate)
      const eventEnd = new Date(eventStart.getTime() + (baseEvent.end.getTime() - baseEvent.start.getTime()))
      
      const recurringEvent: CalendarEvent = {
        ...baseEvent,
        id: `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        start: eventStart,
        end: eventEnd,
        recurring
      }
      
      recurringEvents.push(recurringEvent)
      
      // 다음 날짜 계산
      switch (recurring.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurring.interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurring.interval))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurring.interval)
          break
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + recurring.interval)
          break
      }
    }
    
    setEvents(prev => {
      const updated = [...prev, ...recurringEvents]
      saveEvents(updated)
      return updated
    })
    
    return recurringEvents
  }, [saveEvents])

  // 오늘의 이벤트 요약
  const getTodaysSummary = useCallback(() => {
    const today = new Date()
    const todaysEvents = getEventsForDate(today)
    
    return {
      total: todaysEvents.length,
      tasks: todaysEvents.filter(e => e.type === 'task').length,
      completed: todaysEvents.filter(e => e.completed).length,
      upcoming: todaysEvents.filter(e => new Date(e.start) > new Date()).length,
      highPriority: todaysEvents.filter(e => e.priority === 'high').length
    }
  }, [getEventsForDate])

  // 이번 주 통계
  const getWeeklyStats = useCallback(() => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    const weekEvents = getEventsForWeek(startOfWeek)
    
    return {
      totalEvents: weekEvents.length,
      completedTasks: weekEvents.filter(e => e.type === 'task' && e.completed).length,
      pendingTasks: weekEvents.filter(e => e.type === 'task' && !e.completed).length,
      meetings: weekEvents.filter(e => e.type === 'event').length,
      reminders: weekEvents.filter(e => e.type === 'reminder').length
    }
  }, [getEventsForWeek])

  // 컴포넌트 마운트 시 이벤트 로드
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // 실시간 알림 시스템
  useEffect(() => {
    const checkUpcomingEvents = () => {
      const now = new Date()
      const soon = new Date(now.getTime() + 15 * 60 * 1000) // 15분 후
      
      const upcomingEvents = events.filter(event => {
        const eventStart = new Date(event.start)
        return eventStart > now && eventStart <= soon && !event.completed
      })
      
      upcomingEvents.forEach(event => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Upcoming: ${event.title}`, {
            body: `Starting at ${event.start.toLocaleTimeString()}`,
            icon: '/favicon.ico'
          })
        }
      })
    }
    
    // 1분마다 체크
    const interval = setInterval(checkUpcomingEvents, 60000)
    
    return () => clearInterval(interval)
  }, [events])

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForWeek,
    getEventsForMonth,
    createEventFromTask,
    createRecurringEvent,
    getTodaysSummary,
    getWeeklyStats,
    requestNotificationPermission
  }
}
