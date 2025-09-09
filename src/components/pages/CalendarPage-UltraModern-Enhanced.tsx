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
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  MapPin, 
  Video, 
  Sparkles, 
  Grid3X3, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Eye, 
  Zap, 
  Target, 
  CheckCircle2, 
  Bell, 
  Save, 
  X 
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  parseISO, 
  addDays 
} from 'date-fns';
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
      const data = await enhancedAPI.getCalendarEvents();
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
          due_date: startDateTime,
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

  // 달력 렌더링 로직
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.start_time);
          return isSameDay(eventDate, cloneDay);
        });
        
        const dayTasks = tasks.filter(task => {
          return task.due_date && isSameDay(new Date(task.due_date), cloneDay);
        });

        days.push(
          <motion.div
            key={day.toString()}
            className={`
              min-h-[120px] p-2 border border-white/20 dark:border-gray-700/30 cursor-pointer
              transition-all duration-300 hover:bg-white/60 dark:hover:bg-gray-800/60
              ${!isSameMonth(day, monthStart) ? 'opacity-50' : ''}
              ${isSameDay(day, new Date()) ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30' : 'bg-white/40 dark:bg-gray-800/40'}
            `}
            onDoubleClick={() => handleDateDoubleClick(cloneDay)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`
                text-sm font-medium
                ${!isSameMonth(day, monthStart) ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}
                ${isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
              `}>
                {format(day, 'd')}
              </span>
              {(dayEvents.length > 0 || dayTasks.length > 0) && (
                <div className="flex items-center gap-1">
                  {dayEvents.length > 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  {dayTasks.length > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 2).map((event, index) => (
                <motion.div
                  key={event.id}
                  className="text-xs p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded truncate"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingEvent(event);
                  }}
                >
                  {event.title}
                </motion.div>
              ))}
              {dayTasks.slice(0, showTaskIntegration ? 1 : 0).map((task, index) => (
                <motion.div
                  key={task.id}
                  className="text-xs p-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded truncate"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (dayEvents.length + index) * 0.05 }}
                >
                  📋 {task.title}
                </motion.div>
              ))}
              {(dayEvents.length + (showTaskIntegration ? dayTasks.length : 0)) > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  +{(dayEvents.length + (showTaskIntegration ? dayTasks.length : 0)) - 3} more
                </div>
              )}
            </div>
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  useEffect(() => {
    loadEvents();
    loadTasks();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div 
            className="h-20 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-2xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div 
            className="h-96 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
          />
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
              className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CalendarIcon className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                스마트 캘린더
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {format(currentDate, 'yyyy년 MMMM', { locale: ko })} • 총 {events.length}개 일정
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 일정
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Calendar Navigation & Controls */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 min-w-[200px] text-center">
                  {format(currentDate, 'yyyy년 MMMM', { locale: ko })}
                </h2>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="ml-4 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                >
                  오늘
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="일정 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="task-integration"
                  checked={showTaskIntegration}
                  onCheckedChange={setShowTaskIntegration}
                />
                <Label htmlFor="task-integration" className="text-sm text-gray-600 dark:text-gray-400">
                  태스크 표시
                </Label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div 
                key={day} 
                className={`p-4 text-center font-semibold text-gray-700 dark:text-gray-300 ${
                  index === 0 ? 'text-red-600 dark:text-red-400' : 
                  index === 6 ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="divide-y divide-white/20 dark:divide-gray-700/30">
            {renderCalendarDays()}
          </div>
        </motion.div>

        {/* Quick Create Dialog */}
        <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                빠른 일정 추가
              </DialogTitle>
              <DialogDescription>
                {selectedDate && format(selectedDate, 'M월 d일', { locale: ko })} 빠른 일정을 추가하세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-title">제목</Label>
                <Input
                  id="quick-title"
                  placeholder="일정 제목"
                  value={quickEvent.title}
                  onChange={(e) => setQuickEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-700/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quick-time">시간</Label>
                <Input
                  id="quick-time"
                  type="time"
                  value={quickEvent.time}
                  onChange={(e) => setQuickEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-700/80"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-white/20 dark:border-gray-700/30">
              <Button variant="outline" onClick={() => setShowQuickCreateDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={createQuickEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarIcon className="h-5 w-5" />
                새 일정 만들기
              </DialogTitle>
              <DialogDescription>
                새로운 일정을 생성하고 필요시 태스크로도 추가할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="일정 제목을 입력하세요"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-700/80"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="일정에 대한 자세한 설명을 입력하세요"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-700/80 min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="all-day"
                  checked={newEvent.is_all_day}
                  onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, is_all_day: checked }))}
                />
                <Label htmlFor="all-day">종일 일정</Label>
              </div>
              
              {!newEvent.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">시작 시간 *</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                      className="bg-white/80 dark:bg-gray-700/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">종료 시간 *</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                      className="bg-white/80 dark:bg-gray-700/80"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="create-task"
                  checked={newEvent.create_as_task}
                  onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, create_as_task: checked }))}
                />
                <Label htmlFor="create-task" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  태스크로도 생성하기
                </Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-white/20 dark:border-gray-700/30">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={createEvent}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                일정 만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CalendarPage;
