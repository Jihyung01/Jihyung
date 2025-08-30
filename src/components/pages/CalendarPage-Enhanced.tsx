import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import enhancedAPI, { type CalendarEvent } from '@/lib/enhanced-api.ts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  addHours,
  startOfDay
} from 'date-fns';
import { ko } from 'date-fns/locale';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // 새 이벤트 폼 상태
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    attendees: [] as string[],
    attendeeInput: ''
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(startOfWeek(currentDate)), "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(endOfMonth(endOfWeek(currentDate)), "yyyy-MM-dd'T'HH:mm:ss");
      
      // Load both calendar events and tasks
      const [calendarData, tasksData] = await Promise.all([
        enhancedAPI.getCalendarEvents(startDate, endDate),
        enhancedAPI.getTasks()
      ]);
      
      // Convert tasks with due dates to calendar events
      const taskEvents = tasksData
        .filter(task => task.due_at && task.status !== 'completed')
        .map(task => ({
          id: `task-${task.id}`,
          title: `📋 ${task.title}`,
          description: task.description || '',
          start_at: task.due_at!,
          end_at: task.due_at!,
          location: undefined,
          attendees: [],
          created_at: task.created_at,
          updated_at: task.updated_at,
          user_id: task.user_id,
          type: 'task' as const,
          task_id: task.id,
          priority: task.priority
        }));
      
      const allEvents = [...calendarData, ...taskEvents];
      setEvents(allEvents);
      setFilteredEvents(allEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        start_at: newEvent.start_at,
        end_at: newEvent.end_at,
        location: newEvent.location || undefined,
        attendees: newEvent.attendees.length > 0 ? newEvent.attendees : undefined
      };
      await enhancedAPI.createCalendarEvent(eventData);
      setNewEvent({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        location: '',
        attendees: [],
        attendeeInput: ''
      });
      setShowCreateDialog(false);
      await loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const updateEvent = async (eventId: number, updates: Partial<CalendarEvent>) => {
    try {
      await enhancedAPI.updateCalendarEvent(eventId, updates);
      await loadEvents();
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      await enhancedAPI.deleteCalendarEvent(eventId);
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const addAttendee = () => {
    const attendee = newEvent.attendeeInput.trim();
    if (attendee && !newEvent.attendees.includes(attendee)) {
      setNewEvent({
        ...newEvent,
        attendees: [...newEvent.attendees, attendee],
        attendeeInput: ''
      });
    }
  };

  const removeAttendee = (attendeeToRemove: string) => {
    setNewEvent({
      ...newEvent,
      attendees: newEvent.attendees.filter(attendee => attendee !== attendeeToRemove)
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const defaultStart = format(addHours(startOfDay(date), 9), "yyyy-MM-dd'T'HH:mm");
    const defaultEnd = format(addHours(startOfDay(date), 10), "yyyy-MM-dd'T'HH:mm");
    setNewEvent({
      ...newEvent,
      start_at: defaultStart,
      end_at: defaultEnd
    });
    setShowCreateDialog(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.start_at);
        return isSameDay(eventDate, date);
      } catch (error) {
        console.error('Error parsing date for event:', event, error);
        return false;
      }
    });
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getTodayEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.start_at);
        return isToday(eventDate);
      } catch (error) {
        console.error('Error parsing date for event:', event, error);
        return false;
      }
    }).sort((a, b) => {
      try {
        const dateA = new Date(a.start_at).getTime();
        const dateB = new Date(b.start_at).getTime();
        return dateA - dateB;
      } catch (error) {
        return 0;
      }
    });
  };

  const getUpcomingEvents = () => {
    if (!events || !Array.isArray(events)) return [];
    const today = new Date();
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.start_at);
        return eventDate > today;
      } catch (error) {
        console.error('Error parsing date for event:', event, error);
        return false;
      }
    }).sort((a, b) => {
      try {
        const dateA = new Date(a.start_at).getTime();
        const dateB = new Date(b.start_at).getTime();
        return dateA - dateB;
      } catch (error) {
        return 0;
      }
    }).slice(0, 5);
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캘린더</h1>
          <p className="text-muted-foreground">
            일정을 체계적으로 관리하고 시간을 효율적으로 활용하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 일정
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 일정 만들기</DialogTitle>
              <DialogDescription>
                새로운 일정을 추가하여 시간을 체계적으로 관리하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">제목 *</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="일정 제목..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">설명</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="일정에 대한 상세 설명..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">시작 시간 *</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_at}
                    onChange={(e) => setNewEvent({ ...newEvent, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">종료 시간 *</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_at}
                    onChange={(e) => setNewEvent({ ...newEvent, end_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">장소</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="회의실, 주소, 온라인 링크 등..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">참석자</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newEvent.attendeeInput}
                      onChange={(e) => setNewEvent({ ...newEvent, attendeeInput: e.target.value })}
                      placeholder="참석자 이메일 또는 이름..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    />
                    <Button type="button" variant="outline" onClick={addAttendee}>
                      추가
                    </Button>
                  </div>
                  {newEvent.attendees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newEvent.attendees.map((attendee) => (
                        <Badge key={attendee} variant="secondary" className="gap-1">
                          {attendee}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeAttendee(attendee)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={createEvent} 
                  disabled={!newEvent.title.trim() || !newEvent.start_at || !newEvent.end_at}
                >
                  <Save className="w-4 h-4 mr-2" />
                  일정 저장
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  취소
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>      {/* 통계 및 오늘 일정 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* 캘린더 네비게이션 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {format(currentDate, 'yyyy년 M월')}
                  </h2>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      <CalendarIcon className="w-4 h-4" />
                      오늘
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary">
                  {events.length}개 일정
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <div key={day} className={`p-2 text-center text-sm font-medium ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-24 p-2 border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                        ${isTodayDate ? 'bg-primary/10 border-primary' : 'border-border'}
                        hover:bg-accent/50
                      `}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDate ? 'text-primary' : 
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-primary/20 text-primary rounded truncate cursor-pointer hover:bg-primary/30"
                            title={event.title}
                            onClick={() => setEditingEvent(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 오늘 일정 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                오늘 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTodayEvents().length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <CalendarIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">오늘 일정이 없습니다</p>
                  </div>
                ) : (
                  getTodayEvents().map((event) => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50"
                      onClick={() => setEditingEvent(event)}
                    >
                      <div className="font-medium text-sm mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          try {
                            const startTime = format(parseISO(event.start_at), 'HH:mm');
                            const endTime = format(parseISO(event.end_at), 'HH:mm');
                            return `${startTime} - ${endTime}`;
                          } catch (error) {
                            return '시간 정보 없음';
                          }
                        })()}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 다가오는 일정 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                다가오는 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingEvents().length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">예정된 일정이 없습니다</p>
                  </div>
                ) : (
                  getUpcomingEvents().map((event) => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50"
                      onClick={() => setEditingEvent(event)}
                    >
                      <div className="font-medium text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {(() => {
                          try {
                            return format(parseISO(event.start_at), 'M월 d일 (E)');
                          } catch (error) {
                            return '날짜 정보 없음';
                          }
                        })()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          try {
                            return format(parseISO(event.start_at), 'HH:mm');
                          } catch (error) {
                            return '시간 정보 없음';
                          }
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 통계 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">이번 달 통계</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>전체 일정</span>
                  <span className="font-medium">{events.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span>오늘 일정</span>
                  <span className="font-medium">{getTodayEvents().length}개</span>
                </div>
                <div className="flex justify-between">
                  <span>이번 주</span>
                  <span className="font-medium">
                    {(() => {
                      try {
                        if (!events || !Array.isArray(events)) return 0;
                        const weekStart = startOfWeek(new Date());
                        const weekEnd = endOfWeek(new Date());
                        return events.filter(event => {
                          try {
                            const eventDate = parseISO(event.start_at);
                            return eventDate >= weekStart && eventDate <= weekEnd;
                          } catch (error) {
                            return false;
                          }
                        }).length;
                      } catch (error) {
                        return 0;
                      }
                    })()}개
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 이벤트 편집 다이얼로그 */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>일정 수정</DialogTitle>
            <DialogDescription>
              일정 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">제목</label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    title: e.target.value
                  })}
                  placeholder="일정 제목"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">설명</label>
                <Textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    description: e.target.value
                  })}
                  placeholder="일정 설명"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">시작 시간</label>
                  <Input
                    type="datetime-local"
                    value={(() => {
                      try {
                        const dateStr = editingEvent.start_at;
                        return new Date(dateStr).toISOString().slice(0, 16);
                      } catch (error) {
                        return '';
                      }
                    })()}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      start_at: new Date(e.target.value).toISOString()
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">종료 시간</label>
                  <Input
                    type="datetime-local"
                    value={(() => {
                      try {
                        const dateStr = editingEvent.end_at;
                        return new Date(dateStr).toISOString().slice(0, 16);
                      } catch (error) {
                        return '';
                      }
                    })()}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      end_at: new Date(e.target.value).toISOString()
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">장소</label>
                <Input
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({
                    ...editingEvent,
                    location: e.target.value
                  })}
                  placeholder="장소"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                >
                  취소
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (editingEvent.type === 'task') {
                        // 태스크는 수정 불가
                        return;
                      }
                      const eventId = typeof editingEvent.id === 'string' ? 
                        parseInt(editingEvent.id.replace('task-', '')) : 
                        editingEvent.id;
                      await enhancedAPI.updateCalendarEvent(eventId, editingEvent);
                      await loadEvents();
                      setEditingEvent(null);
                    } catch (error) {
                      console.error('Failed to update event:', error);
                    }
                  }}
                >
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};