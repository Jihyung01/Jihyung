import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  CheckCircle,
  Clock,
  Target,
  PlayCircle,
  AlertTriangle,
  Calendar,
  Zap,
  Star,
  TrendingUp,
  Timer,
  Users,
  Flag,
  Grid3X3,
  List,
  BarChart3,
  Activity,
  Sparkles,
  Flame,
  Brain,
  Paperclip
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import enhancedAPI, { type Task } from '@/lib/enhanced-api.ts';
import { FileUpload } from '../ui/file-upload';

interface TasksPageProps {
  onTaskCreated?: (task: Task) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onTaskCreated }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 새 태스크 폼 상태
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    energy: 5,
    due_at: '',
    location: '',
    category: 'work',
    add_to_calendar: false,
    attendees: '',
    estimated_duration: 60, // minutes
    files: [] as any[]
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await enhancedAPI.getTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('작업 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      if (!newTask.title.trim()) {
        toast.error('작업 제목을 입력해주세요');
        return;
      }

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        energy: newTask.energy,
        due_at: newTask.due_at || null,
        location: newTask.location,
        category: newTask.category
      };

      const result = await enhancedAPI.createTask(taskData);
      onTaskCreated?.(result);
      
      // 캘린더에도 추가하는 경우
      if (newTask.add_to_calendar && newTask.due_at) {
        try {
          const endDateTime = new Date(newTask.due_at);
          endDateTime.setMinutes(endDateTime.getMinutes() + newTask.estimated_duration);
          
          const eventData = {
            title: `📋 ${newTask.title}`,
            description: `작업: ${newTask.description}\n\n예상 소요시간: ${newTask.estimated_duration}분`,
            start_at: newTask.due_at,
            end_at: endDateTime.toISOString(),
            location: newTask.location,
            attendees: newTask.attendees ? newTask.attendees.split(',').map(a => a.trim()) : [],
            type: 'task',
            priority: newTask.priority,
            user_id: 1,
            task_id: result.id
          };
          
          await enhancedAPI.createCalendarEvent(eventData);
          toast.success('작업이 생성되고 캘린더에 추가되었습니다! 🎯📅');
        } catch (calendarError) {
          console.error('Failed to add to calendar:', calendarError);
          toast.success('작업이 생성되었습니다! (캘린더 추가 실패) 🎯');
        }
      } else {
        toast.success('새 작업이 생성되었습니다! 🎯');
      }
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        energy: 5,
        due_at: '',
        location: '',
        category: 'work',
        add_to_calendar: false,
        attendees: '',
        estimated_duration: 60,
        files: []
      });
      setShowCreateDialog(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('작업 생성에 실패했습니다');
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await enhancedAPI.updateTask(taskId, updates);
      await loadTasks();
      setEditingTask(null);
      toast.success('작업이 업데이트되었습니다! ✨');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('작업 업데이트에 실패했습니다');
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await enhancedAPI.deleteTask(taskId);
      await loadTasks();
      toast.success('작업이 삭제되었습니다 🗑️');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('작업 삭제에 실패했습니다');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      await updateTask(task.id!, { status: newStatus });
      
      if (newStatus === 'completed') {
        toast.success('작업을 완료했습니다! 🎉');
      } else {
        toast.success('작업을 미완료로 변경했습니다');
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Due date filter
    if (dueDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(task => {
        if (!task.due_at) return dueDateFilter === 'no_due';
        const dueDate = new Date(task.due_at);
        
        switch (dueDateFilter) {
          case 'overdue':
            return isPast(dueDate) && !isToday(dueDate);
          case 'today':
            return isToday(dueDate);
          case 'tomorrow':
            return isTomorrow(dueDate);
          case 'this_week':
            return isThisWeek(dueDate);
          case 'no_due':
            return !task.due_at;
          default:
            return true;
        }
      });
    }

    // Show/hide completed
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'priority_desc':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority_asc':
          const priorityOrderAsc = { high: 3, medium: 2, low: 1 };
          return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
        case 'due_asc':
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        case 'due_desc':
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
        case 'created_asc':
          return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
        case 'created_desc':
          return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
        case 'updated_asc':
          return new Date(a.updated_at!).getTime() - new Date(b.updated_at!).getTime();
        case 'updated_desc':
        default:
          return new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime();
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter, dueDateFilter, sortBy, showCompleted]);

  useEffect(() => {
    loadTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Flame className="h-3 w-3" />;
      case 'medium':
        return <Zap className="h-3 w-3" />;
      case 'low':
        return <Activity className="h-3 w-3" />;
      default:
        return <Flag className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'todo':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.due_at && isPast(new Date(t.due_at)) && !isToday(new Date(t.due_at)) && t.status !== 'completed').length
  };

  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="h-10 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 rounded-lg w-48"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div 
              className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-lg w-32"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <motion.div
                key={index}
                className="h-32 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1 }}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                className="h-48 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header with Stats */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Target className="h-6 w-6" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  작업 관리
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  총 {taskStats.total}개 작업 • {taskStats.completed}개 완료 • {taskStats.inProgress}개 진행 중
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
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 작업 생성
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div 
              className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-xl p-4 border border-blue-200/30 dark:border-blue-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">전체 작업</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{taskStats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-xl p-4 border border-green-200/30 dark:border-green-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">완료됨</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{taskStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-xl p-4 border border-yellow-200/30 dark:border-yellow-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">진행 중</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{taskStats.inProgress}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-red-500/10 to-pink-500/10 dark:from-red-500/20 dark:to-pink-500/20 rounded-xl p-4 border border-red-200/30 dark:border-red-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">지연됨</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{taskStats.overdue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">전체 완성도</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="작업 제목이나 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="todo">할 일</SelectItem>
                  <SelectItem value="in_progress">진행 중</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <Flag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 우선순위</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="마감일" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 마감일</SelectItem>
                  <SelectItem value="overdue">지연됨</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="tomorrow">내일</SelectItem>
                  <SelectItem value="this_week">이번 주</SelectItem>
                  <SelectItem value="no_due">마감일 없음</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">최근 수정순</SelectItem>
                  <SelectItem value="updated_asc">오래된 수정순</SelectItem>
                  <SelectItem value="created_desc">최근 생성순</SelectItem>
                  <SelectItem value="created_asc">오래된 생성순</SelectItem>
                  <SelectItem value="priority_desc">높은 우선순위</SelectItem>
                  <SelectItem value="priority_asc">낮은 우선순위</SelectItem>
                  <SelectItem value="due_asc">마감일 빠른순</SelectItem>
                  <SelectItem value="due_desc">마감일 늦은순</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-700/80 rounded-xl px-3 py-2 border border-white/30 dark:border-gray-600/30">
                <Switch
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                  id="show-completed"
                />
                <Label htmlFor="show-completed" className="text-sm cursor-pointer">
                  완료된 작업 표시
                </Label>
              </div>

              <div className="flex bg-white/80 dark:bg-gray-700/80 rounded-xl p-1 border border-white/30 dark:border-gray-600/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Tasks Grid/List */}
        <AnimatePresence mode="wait">
          {filteredTasks.length === 0 ? (
            <motion.div 
              className="text-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6"
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
                <Target className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all'
                  ? '검색 결과가 없습니다' 
                  : '아직 작업이 없습니다'
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all'
                  ? '다른 검색어나 필터를 시도해보세요' 
                  : '첫 번째 작업을 생성해보세요! 목표를 설정하고 체계적으로 관리할 수 있습니다.'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && dueDateFilter === 'all' && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    첫 작업 생성하기
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group"
                >
                  <Card className={`
                    bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 
                    shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden
                    ${viewMode === 'list' ? 'flex' : ''}
                    ${task.status === 'completed' ? 'opacity-75' : ''}
                  `}>
                    <CardHeader className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleComplete(task)}
                            className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                              task.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <CardTitle className={`text-lg font-semibold line-clamp-2 transition-colors ${
                            task.status === 'completed' 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}>
                            {task.title}
                          </CardTitle>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
                              <DropdownMenuItem 
                                onClick={() => setEditingTask(task)}
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteTask(task.id!)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="space-y-4">
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            className={`${getPriorityColor(task.priority)} border-0 text-xs px-2 py-1 rounded-lg flex items-center gap-1`}
                          >
                            {getPriorityIcon(task.priority)}
                            {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(task.status)} border-current text-xs px-2 py-1 rounded-lg`}
                          >
                            {task.status === 'completed' ? '완료' : 
                             task.status === 'in_progress' ? '진행 중' : '할 일'}
                          </Badge>
                          
                          {task.energy && (
                            <Badge 
                              variant="secondary" 
                              className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-300 border-0 text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                              <Brain className="h-3 w-3" />
                              {task.energy}/10
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(task.updated_at!), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </div>
                            
                            {task.due_at && (
                              <div className={`flex items-center gap-1 ${
                                isPast(new Date(task.due_at)) && !isToday(new Date(task.due_at)) && task.status !== 'completed'
                                  ? 'text-red-500' 
                                  : isToday(new Date(task.due_at))
                                  ? 'text-orange-500'
                                  : 'text-gray-500'
                              }`}>
                                <Calendar className="h-3 w-3" />
                                {isToday(new Date(task.due_at)) 
                                  ? '오늘 마감' 
                                  : isTomorrow(new Date(task.due_at))
                                  ? '내일 마감'
                                  : format(new Date(task.due_at), 'M/d', { locale: ko })
                                }
                              </div>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTask(task)}
                            className="h-7 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg px-3"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            편집
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ultra-Modern Create Task Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                새로운 작업 생성 🎯
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                목표를 설정하고 체계적으로 관리해보세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">작업 제목</Label>
                <Input
                  placeholder="작업 제목을 입력하세요..."
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">설명</Label>
                <Textarea
                  placeholder="작업에 대한 세부 설명을 입력하세요..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px] bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">우선순위</Label>
                  <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    에너지 레벨: {newTask.energy}/10
                  </Label>
                  <div className="px-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newTask.energy}
                      onChange={(e) => setNewTask(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">마감일 (선택사항)</Label>
                <Input
                  type="datetime-local"
                  value={newTask.due_at}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_at: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                />
              </div>

              {/* 고급 기능들 */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-white/20 dark:border-gray-600/20">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  고급 설정
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리</Label>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">업무</SelectItem>
                        <SelectItem value="personal">개인</SelectItem>
                        <SelectItem value="study">학습</SelectItem>
                        <SelectItem value="health">건강</SelectItem>
                        <SelectItem value="meeting">회의</SelectItem>
                        <SelectItem value="project">프로젝트</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">예상 소요시간 (분)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
                      className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">장소</Label>
                  <Input
                    placeholder="회의실, 카페, 온라인 등..."
                    value={newTask.location}
                    onChange={(e) => setNewTask(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">참석자 (이메일, 쉼표로 구분)</Label>
                  <Input
                    placeholder="user1@example.com, user2@example.com"
                    value={newTask.attendees}
                    onChange={(e) => setNewTask(prev => ({ ...prev, attendees: e.target.value }))}
                    className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-white/30 dark:border-gray-600/30">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">📅 캘린더에 추가</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">마감일이 있을 때 캘린더 일정으로도 생성</p>
                  </div>
                  <Switch
                    checked={newTask.add_to_calendar}
                    onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, add_to_calendar: checked }))}
                    disabled={!newTask.due_at}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    파일 첨부
                  </Label>
                  <FileUpload
                    onFilesChange={(files) => setNewTask(prev => ({ ...prev, files }))}
                    maxFiles={3}
                    maxSize={5}
                    className="w-full"
                  />
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
                  onClick={createTask}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-2 rounded-xl shadow-lg transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  작업 생성
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TasksPage;
