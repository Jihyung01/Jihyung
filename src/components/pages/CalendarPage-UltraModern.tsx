import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Calendar as CalendarIcon, Plus, Search, Filter, MoreHorizontal, Edit3, Trash2, Clock, Users, MapPin, Video, Sparkles, Grid3X3, List, ChevronLeft, ChevronRight, CalendarDays, Eye, Zap, Target, CheckCircle2, Bell, Save, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import enhancedAPI, { type CalendarEvent, type Task } from '@/lib/enhanced-api.ts';

interface CalendarPageProps {
  onEventCreated?: (event: CalendarEvent) => void;
  onTaskCreated?: (task: Task) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onEventCreated, onTaskCreated }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuickCreateDialog, setShowQuickCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [showTaskIntegration, setShowTaskIntegration] = useState(true);

  // 새 이벤트 폼 상태
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    participants: '',
    category: 'work',
    color: 'blue',
    is_all_day: false,
    reminder_minutes: 15,
    create_as_task: false
  });

  // Quick create 상태
  const [quickEvent, setQuickEvent] = useState({
    title: '',
    time: '09:00'
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Provide default date range (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const fromDate = startOfMonth.toISOString();
      const toDate = endOfMonth.toISOString();
      
      console.log('Loading events from:', fromDate, 'to:', toDate);
      const data = await enhancedAPI.getCalendarEvents(fromDate, toDate);
      setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('일정을 불러올 수 없습니다');
    }
  };

  const loadTasks = async () => {
    try {
      const data = await enhancedAPI.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      if (!newEvent.title.trim()) {
        toast.error('제목을 입력해주세요');
        return;
      }

      let startDateTime, endDateTime;
      
      if (newEvent.is_all_day) {
        startDateTime = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        endDateTime = startDateTime;
      } else {
        if (!newEvent.start_time || !newEvent.end_time) {
          toast.error('시작 시간과 종료 시간을 입력해주세요');
          return;
        }
        
        const baseDate = selectedDate || new Date();
        startDateTime = `${format(baseDate, 'yyyy-MM-dd')}T${newEvent.start_time}:00`;
        endDateTime = `${format(baseDate, 'yyyy-MM-dd')}T${newEvent.end_time}:00`;
      }

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        start_time: startDateTime,
        end_time: endDateTime,
        location: newEvent.location,
        participants: newEvent.participants ? newEvent.participants.split(',').map(p => p.trim()) : [],
        category: newEvent.category,
        color: newEvent.color,
        is_all_day: newEvent.is_all_day,
        reminder_minutes: newEvent.reminder_minutes
      };

      console.log('Creating event with data:', eventData);
      const result = await enhancedAPI.createCalendarEvent(eventData);
      
      // 태스크로도 생성하는 경우
      if (newEvent.create_as_task) {
        const taskData = {
          title: newEvent.title,
          description: newEvent.description,
          due_at: startDateTime,
          priority: 'medium' as const,
          category: newEvent.category,
          status: 'pending' as const
        };
        
        try {
          const taskResult = await enhancedAPI.createTask(taskData);
          onTaskCreated?.(taskResult);
          toast.success('일정과 태스크가 함께 생성되었습니다! 🎯');
        } catch (taskError) {
          console.error('Failed to create task:', taskError);
          toast.success('일정이 생성되었습니다! (태스크 생성 실패) ✨');
        }
      } else {
        toast.success('일정이 성공적으로 생성되었습니다! ✨');
      }

      onEventCreated?.(result);
      
      setNewEvent({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        participants: '',
        category: 'work',
        color: 'blue',
        is_all_day: false,
        reminder_minutes: 15,
        create_as_task: false
      });
      setShowCreateDialog(false);
      await loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('일정 생성에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const createQuickEvent = async () => {
    try {
      if (!quickEvent.title.trim()) {
        toast.error('제목을 입력해주세요');
        return;
      }

      const baseDate = selectedDate || new Date();
      const startDateTime = `${format(baseDate, 'yyyy-MM-dd')}T${quickEvent.time}:00`;
      const endDateTime = `${format(baseDate, 'yyyy-MM-dd')}T${quickEvent.time}:00`;

      const eventData = {
        title: quickEvent.title,
        description: '',
        start_time: startDateTime,
        end_time: endDateTime,
        location: '',
        participants: [],
        category: 'personal',
        color: 'blue',
        is_all_day: false,
        reminder_minutes: 15
      };

      const result = await enhancedAPI.createCalendarEvent(eventData);
      onEventCreated?.(result);
      
      setQuickEvent({ title: '', time: '09:00' });
      setShowQuickCreateDialog(false);
      await loadEvents();
      toast.success('빠른 일정이 생성되었습니다! ⚡');
    } catch (error) {
      console.error('Failed to create quick event:', error);
      toast.error('빠른 일정 생성에 실패했습니다');
    }
  };

  // 날짜 더블클릭 핸들러
  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setQuickEvent({ ...quickEvent, title: '' });
    setShowQuickCreateDialog(true);
  };

  const createEvent = async () => {
    try {
      if (!newEvent.title.trim()) {
        toast.error('이벤트 제목을 입력해주세요');
        return;
      }

      if (!newEvent.start_time) {
        toast.error('시작 시간을 입력해주세요');
        return;
      }

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time || newEvent.start_time,
        location: newEvent.location,
        attendees: newEvent.attendees ? newEvent.attendees.split(',').map(email => email.trim()) : [],
        color: newEvent.color
      };

      const result = await enhancedAPI.createCalendarEvent(eventData);
      onEventCreated?.(result);
      
      setNewEvent({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        attendees: '',
        color: '#3b82f6'
      });
      setShowCreateDialog(false);
      await loadEvents();
      toast.success('새 이벤트가 생성되었습니다! 📅');
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('이벤트 생성에 실패했습니다');
    }
  };

  const updateEvent = async (eventId: number, updates: Partial<CalendarEvent>) => {
    try {
      await enhancedAPI.updateCalendarEvent(eventId, updates);
      await loadEvents();
      setEditingEvent(null);
      toast.success('이벤트가 업데이트되었습니다! ✨');
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('이벤트 업데이트에 실패했습니다');
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      await enhancedAPI.deleteCalendarEvent(eventId);
      await loadEvents();
      setViewingEvent(null);
      toast.success('이벤트가 삭제되었습니다 🗑️');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('이벤트 삭제에 실패했습니다');
    }
  };

  // Filter events
  useEffect(() => {
    let filtered = [...events];

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery]);

  useEffect(() => {
    loadEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const getEventColor = (color?: string) => {
    const colors: { [key: string]: string } = {
      '#3b82f6': 'bg-blue-500',
      '#ef4444': 'bg-red-500',
      '#10b981': 'bg-green-500',
      '#f59e0b': 'bg-yellow-500',
      '#8b5cf6': 'bg-purple-500',
      '#ec4899': 'bg-pink-500',
      '#06b6d4': 'bg-cyan-500',
      '#84cc16': 'bg-lime-500'
    };
    return colors[color || '#3b82f6'] || 'bg-blue-500';
  };

  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="h-10 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded-lg w-48"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div 
              className="h-10 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 rounded-lg w-32"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
            />
          </div>
          
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 35 }).map((_, index) => (
              <motion.div
                key={index}
                className="h-32 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.05 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CalendarIcon className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                일정 관리
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {format(currentDate, 'yyyy년 M월', { locale: ko })} • 총 {events.length}개 이벤트
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 이벤트
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Calendar Navigation and View Controls */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="h-10 w-10 p-0 rounded-xl bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 min-w-[160px] text-center">
                  {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </h2>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="h-10 w-10 p-0 rounded-xl bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="ml-2 px-4 rounded-xl bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  오늘
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="이벤트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 w-64"
                />
              </div>

              <div className="flex bg-white/80 dark:bg-gray-700/80 rounded-xl p-1 border border-white/30 dark:border-gray-600/30">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'month' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <CalendarDays className="h-4 w-4 mr-1" />
                  월
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="h-4 w-4 mr-1" />
                  목록
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            {viewMode === 'month' ? (
              <motion.div 
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <div key={day} className={`text-center text-sm font-medium py-2 ${
                      index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isDayToday = isToday(day);

                    return (
                      <motion.div
                        key={day.toISOString()}
                        className={`
                          min-h-[120px] p-2 rounded-xl border transition-all duration-300 cursor-pointer
                          ${isCurrentMonth 
                            ? 'bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 hover:bg-gray-50 dark:hover:bg-gray-700' 
                            : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200/30 dark:border-gray-700/30'
                          }
                          ${isDayToday ? 'ring-2 ring-blue-500/50 bg-blue-50/80 dark:bg-blue-950/80' : ''}
                        `}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.01 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={`text-sm mb-2 ${
                          isDayToday 
                            ? 'font-bold text-blue-600 dark:text-blue-400' 
                            : isCurrentMonth 
                            ? 'text-gray-800 dark:text-gray-200' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {format(day, 'd')}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <motion.div
                              key={event.id}
                              className={`text-xs p-1 rounded ${getEventColor(event.color)} text-white truncate cursor-pointer`}
                              whileHover={{ scale: 1.05 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingEvent(event);
                              }}
                            >
                              {event.title}
                            </motion.div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayEvents.length - 3} 더보기
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <motion.div 
                      className="text-center py-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotateY: [0, 180, 360]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <CalendarIcon className="h-12 w-12 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {searchQuery ? '검색 결과가 없습니다' : '아직 이벤트가 없습니다'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {searchQuery 
                          ? '다른 검색어를 시도해보세요' 
                          : '첫 번째 이벤트를 생성해보세요! 일정을 체계적으로 관리할 수 있습니다.'
                        }
                      </p>
                      {!searchQuery && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            첫 이벤트 생성하기
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="group"
                      >
                        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${getEventColor(event.color)}`} />
                                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {event.title}
                                </CardTitle>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewingEvent(event)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingEvent(event)}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-3">
                              {event.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {format(parseISO(event.start_time), 'M/d HH:mm', { locale: ko })}
                                  {event.end_time && event.end_time !== event.start_time && (
                                    <>
                                      {' - '}
                                      {format(parseISO(event.end_time), 'HH:mm', { locale: ko })}
                                    </>
                                  )}
                                </div>
                                
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </div>
                                )}
                                
                                {event.attendees && event.attendees.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {event.attendees.length}명
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    새 이벤트
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentDate(new Date())}
                    className="w-full bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    오늘로 이동
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">다가오는 일정</h3>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    다가오는 이벤트가 없습니다
                  </p>
                ) : (
                  upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors cursor-pointer"
                      onClick={() => setViewingEvent(event)}
                    >
                      <div className={`w-3 h-3 rounded-full ${getEventColor(event.color)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(parseISO(event.start_time), 'M/d HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Calendar Stats */}
            <motion.div 
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">통계</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">이번 달</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {events.filter(event => isSameMonth(parseISO(event.start_time), currentDate)).length}개
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">오늘</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {getEventsForDate(new Date()).length}개
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">전체</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {events.length}개
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ultra-Modern Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                새로운 이벤트 생성 📅
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                일정을 추가하고 체계적으로 관리해보세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">이벤트 제목</Label>
                <Input
                  placeholder="이벤트 제목을 입력하세요..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">설명</Label>
                <Textarea
                  placeholder="이벤트에 대한 세부 설명을 입력하세요..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px] bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">시작 시간</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                    className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">종료 시간 (선택)</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                    className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">장소</Label>
                <Input
                  placeholder="장소를 입력하세요..."
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">참석자 (이메일, 쉼표로 구분)</Label>
                <Input
                  placeholder="email1@example.com, email2@example.com"
                  value={newEvent.attendees}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, attendees: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">색상</Label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-lg transition-all duration-300 ${
                        newEvent.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="px-6 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                취소
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={createEvent}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2 rounded-xl shadow-lg transition-all duration-300"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  이벤트 생성
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Event Dialog */}
        <Dialog open={!!viewingEvent} onOpenChange={() => setViewingEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            {viewingEvent && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getEventColor(viewingEvent.color)}`} />
                      <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {viewingEvent.title}
                      </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEvent(viewingEvent);
                          setViewingEvent(null);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        편집
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteEvent(viewingEvent.id!)}
                        className="rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                  {viewingEvent.description && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">설명</h4>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {viewingEvent.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">시작 시간</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {format(parseISO(viewingEvent.start_time), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                    
                    {viewingEvent.end_time && viewingEvent.end_time !== viewingEvent.start_time && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">종료 시간</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {format(parseISO(viewingEvent.end_time), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {viewingEvent.location && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">장소</h4>
                      <p className="text-gray-600 dark:text-gray-400">{viewingEvent.location}</p>
                    </div>
                  )}
                  
                  {viewingEvent.attendees && viewingEvent.attendees.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">참석자</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingEvent.attendees.map((attendee, index) => (
                          <Badge 
                            key={index}
                            variant="secondary" 
                            className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-0 px-3 py-1 rounded-lg"
                          >
                            {attendee}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CalendarPage;
