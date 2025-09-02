import { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Plus, Edit } from '@phosphor-icons/react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { DateSelectArg, EventDropArg, EventResizeDoneArg } from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { getCalendarEvents, createTask, updateTask, exportCalendar } from '../../lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  start: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  extendedProps: {
    type: string
    taskId: number
    priority: string
    status: string
    description: string
  }
  rrule?: string
}

interface TaskForm {
  title: string
  description: string
  due_date: string
  priority: string
  recurring_rule: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarView, setCalendarView] = useState('dayGridMonth')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  
  const calendarRef = useRef<FullCalendar>(null)
  
  // Form state
  const [form, setForm] = useState<TaskForm>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    recurring_rule: ''
  })

  // Load calendar events
  const loadEvents = async () => {
    try {
      setLoading(true)
      const calendarApi = calendarRef.current?.getApi()
      const view = calendarApi?.view
      
      let startDate = ''
      let endDate = ''
      
      if (view) {
        startDate = view.activeStart.toISOString().split('T')[0]
        endDate = view.activeEnd.toISOString().split('T')[0]
      }
      
      const data = await getCalendarEvents(startDate, endDate)
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
      toast.error('일정 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Handle date selection for creating new tasks
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.startStr)
    setForm(prev => ({
      ...prev,
      due_date: selectInfo.startStr
    }))
    setIsCreateOpen(true)
  }

  // Handle event drag (task due date change)
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const event = dropInfo.event
    const taskId = event.extendedProps.taskId
    
    if (!taskId) return

    try {
      await updateTask(taskId, {
        due_date: event.startStr
      })
      
      toast.success('일정이 변경되었습니다')
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('일정 변경에 실패했습니다')
      dropInfo.revert()
    }
  }

  // Handle event resize (task duration change)
  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    const event = resizeInfo.event
    const taskId = event.extendedProps.taskId
    
    if (!taskId) return

    try {
      await updateTask(taskId, {
        due_date: event.startStr
      })
      
      toast.success('일정이 변경되었습니다')
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('일정 변경에 실패했습니다')
      resizeInfo.revert()
    }
  }

  // Handle event click for editing
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: event.extendedProps,
      rrule: event.rrule
    }
    
    setEditingEvent(calendarEvent)
    setForm({
      title: event.title,
      description: event.extendedProps.description || '',
      due_date: event.startStr,
      priority: event.extendedProps.priority || 'medium',
      recurring_rule: event.rrule || ''
    })
    setIsCreateOpen(true)
  }

  // Create new task or calendar event
  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }

    try {
      if (editingEvent) {
        // Update existing task
        const taskData = {
          title: form.title.trim(),
          description: form.description.trim(),
          due_date: form.due_date,
          priority: form.priority,
          recurring_rule: form.recurring_rule || undefined
        }
        await updateTask(editingEvent.extendedProps.taskId, taskData)
        toast.success('일정이 수정되었습니다')
      } else {
        // Create new calendar event directly
        const eventData = {
          title: form.title.trim(),
          description: form.description.trim(),
          start_at: form.due_date,
          end_at: new Date(new Date(form.due_date).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
          location: '',
          attendees: []
        }
        
        // Import the enhanced API
        const { enhancedAPI } = await import('../../lib/enhanced-api')
        await enhancedAPI.createCalendarEvent(eventData)
        toast.success('캘린더 이벤트가 생성되었습니다')
      }
      
      setIsCreateOpen(false)
      setEditingEvent(null)
      resetForm()
      loadEvents() // Reload events
    } catch (error) {
      console.error('Failed to save calendar event:', error)
      toast.error('일정 저장에 실패했습니다')
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      recurring_rule: ''
    })
  }

  // Handle calendar view change
  const handleViewChange = (view: string) => {
    setCalendarView(view)
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.changeView(view)
  }

  // Navigate calendar
  const handlePrevious = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.prev()
  }

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.next()
  }

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.today()
  }

  // Export calendar as ICS
  const handleExportCalendar = async () => {
    try {
      const blob = await exportCalendar()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'calendar.ics'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('캘린더가 내보내기되었습니다')
    } catch (error) {
      console.error('Failed to export calendar:', error)
      toast.error('캘린더 내보내기에 실패했습니다')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" weight="bold" />
              <h1 className="text-2xl font-bold text-foreground">캘린더</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportCalendar}>
                <Download className="h-4 w-4 mr-2" />
                iCal 내보내기
              </Button>
              
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) {
                  setEditingEvent(null)
                  resetForm()
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    일정 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? '일정 수정' : '새 일정 생성'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">제목</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="일정 제목을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">설명</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="일정에 대한 설명을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="due_date">날짜</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={form.due_date}
                          onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="priority">우선순위</Label>
                        <Select 
                          value={form.priority} 
                          onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">낮음</SelectItem>
                            <SelectItem value="medium">보통</SelectItem>
                            <SelectItem value="high">높음</SelectItem>
                            <SelectItem value="urgent">긴급</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="recurring_rule">반복 규칙 (RRULE)</Label>
                      <Input
                        id="recurring_rule"
                        value={form.recurring_rule}
                        onChange={(e) => setForm(prev => ({ ...prev, recurring_rule: e.target.value }))}
                        placeholder="예: FREQ=WEEKLY;BYDAY=MO,WE,FR"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        매주: FREQ=WEEKLY, 매일: FREQ=DAILY, 매월: FREQ=MONTHLY
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateTask}>
                        {editingEvent ? '수정' : '생성'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateOpen(false)
                          setEditingEvent(null)
                          resetForm()
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Calendar Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  오늘
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('dayGridMonth')}
                >
                  월
                </Button>
                <Button
                  variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('timeGridWeek')}
                >
                  주
                </Button>
                <Button
                  variant={calendarView === 'timeGridDay' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('timeGridDay')}
                >
                  일
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
              initialView="dayGridMonth"
              headerToolbar={false} // We handle navigation manually
              events={events}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="auto"
              locale="ko"
              firstDay={1} // Monday
              eventTextColor="#ffffff"
              eventDisplay="block"
              displayEventTime={false}
              allDaySlot={true}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              expandRows={true}
              dayHeaderFormat={{ weekday: 'short' }}
              eventDidMount={(info) => {
                // Add tooltip or custom styling
                info.el.title = info.event.extendedProps.description || info.event.title
              }}
              datesSet={() => {
                // Reload events when the view changes
                loadEvents()
              }}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">우선순위 범례</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                <span className="text-sm">낮음</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-sm">보통</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-sm">높음</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-sm">긴급</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>날짜를 클릭하여 새 일정을 만들거나, 기존 일정을 드래그하여 날짜를 변경할 수 있습니다.</p>
        </div>
      </main>
    </div>
  )
}