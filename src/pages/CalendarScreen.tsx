import { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  Plus,
  MagnifyingGlass,
  Funnel,
  Clock,
  MapPin,
  Users,
  CaretLeft,
  CaretRight,
  DotsThree,
  Bell,
  Repeat,
  VideoCamera,
  Phone
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import { TimeBlocking } from '../components/Calendar/TimeBlocking'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: 'meeting' | 'task' | 'appointment' | 'reminder' | 'personal'
  location?: string
  attendees?: string[]
  isRecurring?: boolean
  isAllDay?: boolean
  color: string
  priority: 'high' | 'medium' | 'low'
  reminders?: number[] // minutes before event
  meetingLink?: string
  status: 'confirmed' | 'tentative' | 'cancelled'
}

export function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    // Mock calendar events
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: '팀 스프린트 미팅',
        description: '스프린트 리뷰 및 다음 스프린트 계획',
        startTime: new Date(2024, 0, 15, 10, 0), // 1월 15일 10시
        endTime: new Date(2024, 0, 15, 11, 30), // 1월 15일 11시 30분
        type: 'meeting',
        location: '회의실 A',
        attendees: ['김개발', '이디자인', '박기획', '최테스트'],
        color: '#3b82f6',
        priority: 'high',
        reminders: [15, 5], // 15분, 5분 전 알림
        meetingLink: 'https://meet.google.com/xyz-abc-def',
        status: 'confirmed'
      },
      {
        id: '2',
        title: 'FastAPI 백엔드 구현',
        description: 'API 엔드포인트 개발 및 테스트',
        startTime: new Date(2024, 0, 16, 9, 0),
        endTime: new Date(2024, 0, 16, 17, 0),
        type: 'task',
        color: '#10b981',
        priority: 'high',
        reminders: [30],
        status: 'confirmed'
      },
      {
        id: '3',
        title: '치과 예약',
        description: '정기 검진',
        startTime: new Date(2024, 0, 17, 14, 0),
        endTime: new Date(2024, 0, 17, 15, 0),
        type: 'appointment',
        location: '강남 치과',
        color: '#f59e0b',
        priority: 'medium',
        reminders: [60, 15],
        status: 'confirmed'
      },
      {
        id: '4',
        title: '프로젝트 발표',
        description: '분기별 프로젝트 성과 발표',
        startTime: new Date(2024, 0, 18, 15, 0),
        endTime: new Date(2024, 0, 18, 16, 30),
        type: 'meeting',
        location: '대회의실',
        attendees: ['임원진', '팀장들'],
        color: '#8b5cf6',
        priority: 'high',
        reminders: [30, 10],
        status: 'confirmed'
      },
      {
        id: '5',
        title: '개인 운동',
        description: '헬스장 운동',
        startTime: new Date(2024, 0, 19, 18, 0),
        endTime: new Date(2024, 0, 19, 19, 30),
        type: 'personal',
        location: '피트니스 센터',
        color: '#ef4444',
        priority: 'low',
        isRecurring: true,
        status: 'confirmed'
      },
      {
        id: '6',
        title: '클라이언트 미팅',
        description: '신규 프로젝트 요구사항 논의',
        startTime: new Date(2024, 0, 22, 10, 0),
        endTime: new Date(2024, 0, 22, 12, 0),
        type: 'meeting',
        location: '클라이언트 사무실',
        attendees: ['김대표', '이팀장'],
        color: '#06b6d4',
        priority: 'high',
        reminders: [60, 30, 10],
        meetingLink: 'https://zoom.us/j/123456789',
        status: 'confirmed'
      },
      {
        id: '7',
        title: '코드 리뷰',
        description: '주간 코드 리뷰 세션',
        startTime: new Date(2024, 0, 23, 16, 0),
        endTime: new Date(2024, 0, 23, 17, 0),
        type: 'meeting',
        attendees: ['개발팀'],
        color: '#84cc16',
        priority: 'medium',
        isRecurring: true,
        reminders: [15],
        status: 'confirmed'
      },
      {
        id: '8',
        title: '생일 기념일',
        description: '어머니 생신',
        startTime: new Date(2024, 0, 25, 0, 0),
        endTime: new Date(2024, 0, 25, 23, 59),
        type: 'reminder',
        isAllDay: true,
        color: '#f97316',
        priority: 'high',
        reminders: [1440, 60], // 1일 전, 1시간 전
        status: 'confirmed'
      }
    ]
    setEvents(mockEvents)
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || event.type === filterType
    
    return matchesSearch && matchesType
  })

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      if (event.isAllDay) {
        return event.startTime.toDateString() === date.toDateString()
      }
      return event.startTime.toDateString() === date.toDateString()
    })
  }

  const getTodayEvents = () => {
    const today = new Date()
    return filteredEvents
      .filter(event => event.startTime.toDateString() === today.toDateString())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return filteredEvents
      .filter(event => event.startTime >= today && event.startTime <= nextWeek)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />
      case 'task': return <Clock className="w-4 h-4" />
      case 'appointment': return <MapPin className="w-4 h-4" />
      case 'reminder': return <Bell className="w-4 h-4" />
      case 'personal': return <CalendarIcon className="w-4 h-4" />
      default: return <CalendarIcon className="w-4 h-4" />
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const deleteEvent = (id: string) => {
    setEvents(events => events.filter(event => event.id !== id))
    toast.success('이벤트가 삭제되었습니다!')
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Previous month's trailing days
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`prev-${i}`} className="h-32 bg-muted/20 border border-border/50"></div>
      )
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      
      days.push(
        <div 
          key={day} 
          className={`h-32 border border-border/50 p-2 overflow-hidden hover:bg-muted/50 cursor-pointer ${
            isToday ? 'bg-primary/10 border-primary/30' : ''
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className="text-xs p-1 rounded truncate"
                style={{ backgroundColor: event.color + '20', color: event.color }}
              >
                {event.isAllDay ? event.title : `${formatTime(event.startTime)} ${event.title}`}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} 더 보기
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  const renderAgendaView = () => {
    const upcomingEvents = getUpcomingEvents()
    
    return (
      <div className="space-y-4">
        {upcomingEvents.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs" style={{ backgroundColor: event.color + '20', color: event.color }}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(event.type)}
                          {event.type}
                        </span>
                      </Badge>
                      {event.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">높음</Badge>
                      )}
                      {event.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="w-3 h-3 mr-1" />
                          반복
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    
                    {event.description && (
                      <p className="text-muted-foreground text-sm mb-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.isAllDay ? '종일' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                      </span>
                      <span>{formatDate(event.startTime)}</span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      {event.attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees.length}명
                        </span>
                      )}
                    </div>
                    
                    {event.meetingLink && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <VideoCamera className="w-4 h-4" />
                          화상회의 참여
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Phone className="w-4 h-4" />
                          전화 참여
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <DotsThree className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>편집</DropdownMenuItem>
                    <DropdownMenuItem>복제</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteEvent(event.id)}
                      className="text-red-600"
                    >
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="w-8 h-8" />
            캘린더
          </h1>
          <p className="text-muted-foreground mt-1">
            오늘 {getTodayEvents().length}개의 일정이 있습니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border rounded-md">
            {(['month', 'week', 'day', 'agenda'] as const).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {mode === 'month' ? '월' :
                 mode === 'week' ? '주' :
                 mode === 'day' ? '일' : '일정'}
              </Button>
            ))}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 일정
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 일정 추가</DialogTitle>
                <DialogDescription>
                  새로운 일정을 생성해보세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="일정 제목을 입력하세요..." />
                <textarea 
                  className="w-full h-24 p-3 border rounded-md resize-none"
                  placeholder="일정 설명 (선택사항)"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="datetime-local" />
                  <Input type="datetime-local" />
                </div>
                <Input placeholder="장소 (선택사항)" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    생성
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="일정에서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Funnel className="w-4 h-4" />
              {filterType === 'all' ? '전체' : filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>전체</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('meeting')}>회의</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('task')}>태스크</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('appointment')}>약속</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('reminder')}>알림</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('personal')}>개인</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          오늘
        </Button>
      </div>

      {/* Calendar Navigation (Month view only) */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <CaretLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <CaretRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="p-4 text-center font-semibold border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {renderCalendarGrid()}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'agenda' && renderAgendaView()}

      {/* Today's Events Sidebar */}
      {viewMode !== 'agenda' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              오늘의 일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getTodayEvents().length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                오늘 예정된 일정이 없습니다
              </p>
            ) : (
              getTodayEvents().map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.isAllDay ? '종일' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                    </p>
                  </div>
                  {event.meetingLink && (
                    <Button variant="ghost" size="sm">
                      <VideoCamera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Time Blocking */}
      {viewMode === 'day' && (
        <TimeBlocking />
      )}

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>총 {filteredEvents.length}개 일정</span>
            <span>회의 {filteredEvents.filter(e => e.type === 'meeting').length}개</span>
            <span>태스크 {filteredEvents.filter(e => e.type === 'task').length}개</span>
            <span>개인 일정 {filteredEvents.filter(e => e.type === 'personal').length}개</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
