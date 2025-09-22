export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: unknown
  actions?: { action: string; title: string; icon?: string }[]
  timestamp?: number
}

export interface ScheduledNotification extends NotificationOptions {
  id: string
  scheduledTime: Date
  type: 'task' | 'event' | 'reminder' | 'habit'
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
}

class NotificationService {
  private permission: NotificationPermission = 'default'
  private registration: ServiceWorkerRegistration | null = null
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map()

  constructor() {
    this.initializeService()
    this.loadScheduledNotifications()
  }

  private async initializeService() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    // Get current permission
    this.permission = Notification.permission

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log('✅ 푸시 알림 서비스 워커 준비 완료')
      } catch (error) {
        console.error('❌ 서비스 워커 등록 실패:', error)
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === 'granted') {
      return 'granted'
    }

    try {
      this.permission = await Notification.requestPermission()

      if (this.permission === 'granted') {
        // Show welcome notification
        this.showNotification({
          title: '알림이 활성화되었습니다! 🎉',
          body: 'JIHYUNG이 중요한 일정과 태스크를 알려드릴게요.',
          icon: '/icon-192.png',
          tag: 'welcome'
        })
      }

      return this.permission
    } catch (error) {
      console.error('알림 권한 요청 실패:', error)
      return 'denied'
    }
  }

  // Show immediate notification
  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('알림 권한이 없습니다.')
      return
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      ...options
    }

    try {
      if (this.registration) {
        // Use service worker for persistent notifications
        await this.registration.showNotification(defaultOptions.title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          badge: defaultOptions.badge,
          tag: defaultOptions.tag,
          requireInteraction: defaultOptions.requireInteraction,
          silent: defaultOptions.silent,
          data: defaultOptions.data,
          // actions: defaultOptions.actions, // Commented out as not supported in standard Notification API
          timestamp: defaultOptions.timestamp
        })
      } else {
        // Fallback to regular notification
        new Notification(defaultOptions.title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          tag: defaultOptions.tag,
          requireInteraction: defaultOptions.requireInteraction,
          silent: defaultOptions.silent,
          data: defaultOptions.data
        })
      }
    } catch (error) {
      console.error('알림 표시 실패:', error)
    }
  }

  // Schedule notification
  scheduleNotification(notification: ScheduledNotification): void {
    // Store in memory and localStorage
    this.scheduledNotifications.set(notification.id, notification)
    this.saveScheduledNotifications()

    // Calculate delay
    const delay = notification.scheduledTime.getTime() - Date.now()

    if (delay > 0) {
      setTimeout(() => {
        this.triggerScheduledNotification(notification.id)
      }, delay)
    }
  }

  // Cancel scheduled notification
  cancelScheduledNotification(id: string): void {
    this.scheduledNotifications.delete(id)
    this.saveScheduledNotifications()
  }

  // Trigger scheduled notification
  private async triggerScheduledNotification(id: string): Promise<void> {
    const notification = this.scheduledNotifications.get(id)
    if (!notification) return

    await this.showNotification({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      tag: notification.tag,
      data: { ...(notification.data || {}), id }
    })

    // Handle recurring notifications
    if (notification.isRecurring && notification.recurringPattern) {
      const nextTime = this.calculateNextRecurrence(notification.scheduledTime, notification.recurringPattern)

      const nextNotification: ScheduledNotification = {
        ...notification,
        id: `${id}-${Date.now()}`,
        scheduledTime: nextTime
      }

      this.scheduleNotification(nextNotification)
    }

    // Remove non-recurring notifications
    if (!notification.isRecurring) {
      this.cancelScheduledNotification(id)
    }
  }

  // Calculate next recurrence time
  private calculateNextRecurrence(baseTime: Date, pattern: string): Date {
    const next = new Date(baseTime)

    switch (pattern) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }

    return next
  }

  // Predefined notification templates
  scheduleTaskReminder(taskId: string, title: string, dueDate: Date, reminderMinutes: number = 30): void {
    const reminderTime = new Date(dueDate.getTime() - reminderMinutes * 60 * 1000)

    if (reminderTime > new Date()) {
      this.scheduleNotification({
        id: `task-${taskId}`,
        title: '📋 태스크 알림',
        body: `"${title}"의 마감시간이 ${reminderMinutes}분 남았습니다.`,
        icon: '/icon-192.png',
        type: 'task',
        scheduledTime: reminderTime,
        data: { taskId, type: 'task-reminder' },
        actions: [
          { action: 'complete', title: '완료', icon: '/icon-192.png' },
          { action: 'postpone', title: '1시간 연기', icon: '/icon-192.png' }
        ]
      })
    }
  }

  scheduleEventReminder(eventId: string, title: string, startDate: Date, reminderMinutes: number = 15): void {
    const reminderTime = new Date(startDate.getTime() - reminderMinutes * 60 * 1000)

    if (reminderTime > new Date()) {
      this.scheduleNotification({
        id: `event-${eventId}`,
        title: '📅 일정 알림',
        body: `"${title}"이(가) ${reminderMinutes}분 후에 시작됩니다.`,
        icon: '/icon-192.png',
        type: 'event',
        scheduledTime: reminderTime,
        data: { eventId, type: 'event-reminder' },
        actions: [
          { action: 'view', title: '확인', icon: '/icon-192.png' },
          { action: 'snooze', title: '5분 후 알림', icon: '/icon-192.png' }
        ]
      })
    }
  }

  scheduleDailyHabitReminder(habitId: string, habitName: string, reminderTime: string): void {
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    this.scheduleNotification({
      id: `habit-${habitId}`,
      title: '🎯 습관 알림',
      body: `"${habitName}" 시간이에요! 오늘도 목표를 달성해보세요.`,
      icon: '/icon-192.png',
      type: 'habit',
      scheduledTime,
      isRecurring: true,
      recurringPattern: 'daily',
      data: { habitId, type: 'habit-reminder' }
    })
  }

  // Save/load scheduled notifications to/from localStorage
  private saveScheduledNotifications(): void {
    const data = Array.from(this.scheduledNotifications.entries()).map(([notificationId, notification]) => ({
      id: notificationId,
      ...notification,
      scheduledTime: notification.scheduledTime.toISOString()
    }))

    localStorage.setItem('jihyung-scheduled-notifications', JSON.stringify(data))
  }

  private loadScheduledNotifications(): void {
    try {
      const saved = localStorage.getItem('jihyung-scheduled-notifications')
      if (!saved) return

      const data = JSON.parse(saved)
      const now = new Date()

      data.forEach((item: any) => {
        const scheduledTime = new Date(item.scheduledTime)

        // Only load future notifications
        if (scheduledTime > now) {
          const notification: ScheduledNotification = {
            ...item,
            scheduledTime
          }

          this.scheduledNotifications.set(item.id, notification)

          // Reschedule
          const delay = scheduledTime.getTime() - now.getTime()
          setTimeout(() => {
            this.triggerScheduledNotification(item.id)
          }, delay)
        }
      })
    } catch (error) {
      console.error('알림 로드 실패:', error)
    }
  }

  // Get permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window
  }

  // Get all scheduled notifications
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values())
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export types
export type { NotificationService }
export default notificationService