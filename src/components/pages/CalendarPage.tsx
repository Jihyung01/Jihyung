
import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, CaretLeft, CaretRight, Plus, List, SquaresFour, Clock } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { getCalendarEvents, updateTask, listTasks } from '../../api/client'
import { toast } from 'sonner'

// Import FullCalendar components
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'

// Import FullCalendar CSS
import '@fullcalendar/daygrid/index.css'
import '@fullcalendar/timegrid/index.css'
import '@fullcalendar/list/index.css'

interface CalendarPageProps {
  className?: string
}

export function CalendarPage({ className }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month')
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendarData()
  }, [currentDate])

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      // Calculate date range for current view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const [calendarData, tasksData] = await Promise.all([
        getCalendarEvents(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        ),
        listTasks(
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        )
      ])

      // Convert tasks to calendar events
      const taskEvents = tasksData.map((task: any) => ({
        id: `task-${task.id}`,
        title: task.title,
        start: task.due_date || task.created_at,
        allDay: true,
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getPriorityColor(task.priority),
        extendedProps: {
          type: 'task',
          taskId: task.id,
          priority: task.priority,
          status: task.status,
          description: task.description
        }
      }))

      // Combine calendar events and task events
      const allEvents = [
        ...calendarData.events || [],
        ...taskEvents
      ]

      setEvents(allEvents)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
      toast.error('캘린더 데이터 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#3b82f6'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const handleEventDrop = async (info: any) => {
    const { event } = info
    const { type, taskId } = event.extendedProps

    if (type === 'task' && taskId) {
      try {
        await updateTask(taskId, {
          due_date: event.start.toISOString()
        })
        toast.success('태스크 날짜가 업데이트되었습니다')
      } catch (error) {
        console.error('Failed to update task:', error)
        toast.error('태스크 업데이트에 실패했습니다')
        // Revert the change
        info.revert()
      }
    }
  }

  const handleDateClick = (info: any) => {
    console.log('Date clicked:', info.dateStr)
    // Could open a modal to create new event/task
  }

  const handleEventClick = (info: any) => {
    const { event } = info
    const { type, taskId, description } = event.extendedProps

    if (type === 'task') {
      console.log('Task clicked:', taskId)
      // Could open task details modal
    }
  }

  const getViewTitle = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long'
    }
    
    if (currentView === 'week') {
      return `${currentDate.toLocaleDateString('ko-KR', options)} 주`
    } else if (currentView === 'day') {
      return currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }
    
    return currentDate.toLocaleDateString('ko-KR', options)
  }

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)
    
    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }
    
    if (currentView === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (currentView === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    
    setCurrentDate(newDate)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">{getViewTitle()}</CardTitle>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                >
                  <CaretLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('today')}
                >
                  오늘
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                >
                  <CaretRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggles */}
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={currentView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('month')}
                  className="rounded-r-none"
                >
                  <SquaresFour className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('week')}
                  className="rounded-none border-x-0"
                >
                  주
                </Button>
                <Button
                  variant={currentView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('day')}
                  className="rounded-none border-x-0"
                >
                  일
                </Button>
                <Button
                  variant={currentView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                새 일정
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={
                currentView === 'month' ? 'dayGridMonth' :
                currentView === 'week' ? 'timeGridWeek' :
                currentView === 'day' ? 'timeGridDay' :
                'listWeek'
              }
              events={events}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              headerToolbar={false} // We're using custom header
              height="auto"
              locale="ko"
              buttonText={{
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                list: '목록'
              }}
              eventDisplay="block"
              dayHeaderFormat={{ weekday: 'short' }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Today's Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              오늘의 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.filter(event => {
              const eventDate = new Date(event.start).toDateString()
              const today = new Date().toDateString()
              return eventDate === today
            }).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                오늘 예정된 일정이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {events
                  .filter(event => {
                    const eventDate = new Date(event.start).toDateString()
                    const today = new Date().toDateString()
                    return eventDate === today
                  })
                  .map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.backgroundColor || '#3b82f6' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.extendedProps?.type === 'task' && (
                          <Badge variant="outline" className="text-xs mt-1">
                            태스크 • {event.extendedProps.priority}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.allDay ? '종일' : new Date(event.start).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SquaresFour className="h-5 w-5 text-primary" />
              이번 주 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">총 일정</span>
                <span className="font-medium">{events.length}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">완료된 태스크</span>
                <span className="font-medium text-green-600">
                  {events.filter(e => e.extendedProps?.status === 'completed').length}개
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">높은 우선순위</span>
                <span className="font-medium text-red-600">
                  {events.filter(e => e.extendedProps?.priority === 'high').length}개
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">이번 주 집중도</span>
                <Badge variant="secondary">양호</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}