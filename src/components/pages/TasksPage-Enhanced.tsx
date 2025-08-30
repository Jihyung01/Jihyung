import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ListSkeleton } from '../ui/skeleton';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Zap,
  Target,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  Star,
  PlayCircle,
  PauseCircle
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { enhancedAPI, type Task } from '../../lib/enhanced-api';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  const [dueDateFilter, setDueDateFilter] = useState<string>('all'); // today, tomorrow, this_week, overdue
  const [sortBy, setSortBy] = useState<string>('updated_desc'); // created_asc, created_desc, priority, due_date
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 새 태스크 폼 상태
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    energy: 5,
    due_at: ''
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await enhancedAPI.getTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        due_at: newTask.due_at || undefined
      };
      const createdTask = await enhancedAPI.createTask(taskData);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        energy: 5,
        due_at: ''
      });
      setShowCreateDialog(false);
      await loadTasks();
      
      // Notify parent component
      if (onTaskCreated) {
        onTaskCreated(createdTask);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await enhancedAPI.updateTask(taskId, updates);
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await enhancedAPI.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
    });
  };

  const startTask = async (task: Task) => {
    await updateTask(task.id, { status: 'in_progress' });
  };

  const pauseTask = async (task: Task) => {
    await updateTask(task.id, { status: 'pending' });
  };

  // 고급 필터링 로직
  useEffect(() => {
    let filtered = tasks;

    // 완료된 태스크 표시 여부
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // 우선순위 필터
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // 마감일 필터
    if (dueDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      filtered = filtered.filter(task => {
        if (!task.due_at) return dueDateFilter === 'no_date';
        
        const dueDate = new Date(task.due_at);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        switch (dueDateFilter) {
          case 'today':
            return dueDateOnly.getTime() === today.getTime();
          case 'tomorrow':
            return dueDateOnly.getTime() === tomorrow.getTime();
          case 'this_week':
            return dueDateOnly >= today && dueDateOnly <= weekEnd;
          case 'overdue':
            return dueDateOnly < today && task.status !== 'completed';
          case 'no_date':
            return !task.due_at;
          default:
            return true;
        }
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated_desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'due_date':
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter, dueDateFilter, sortBy, showCompleted]);

  useEffect(() => {
    loadTasks();
  }, []);

  const getTaskStatusIcon = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTaskStatusColor = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-card border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return '오늘';
    if (isTomorrow(date)) return '내일';
    if (isPast(date)) return '지남';
    return format(date, 'M월 d일');
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.due_at && isPast(new Date(t.due_at)) && t.status !== 'completed').length
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
        </div>
        <ListSkeleton count={5} type="task" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">작업 관리</h1>
          <p className="text-muted-foreground">
            할 일을 체계적으로 관리하고 생산성을 높여보세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 작업
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 작업 만들기</DialogTitle>
              <DialogDescription>
                새로운 작업을 추가하여 목표를 달성해보세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">제목 *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="작업 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">설명</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="작업에 대한 자세한 설명..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">우선순위</label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">에너지 레벨</label>
                  <Select value={newTask.energy.toString()} onValueChange={(value) => setNewTask({ ...newTask, energy: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                        <SelectItem key={level} value={level.toString()}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">마감일 (선택사항)</label>
                <Input
                  type="datetime-local"
                  value={newTask.due_at}
                  onChange={(e) => setNewTask({ ...newTask, due_at: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createTask} disabled={!newTask.title.trim()}>
                  작업 만들기
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  취소
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              전체 작업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              완료됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-600" />
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              대기 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              완료율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</div>
            <Progress value={completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 고급 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 검색 바 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="작업 검색... (제목, 설명 검색 가능)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 필터 컨트롤 */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="pending">대기 중</SelectItem>
                  <SelectItem value="in_progress">진행 중</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="마감일" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 기간</SelectItem>
                  <SelectItem value="overdue">지연됨</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="tomorrow">내일</SelectItem>
                  <SelectItem value="this_week">이번 주</SelectItem>
                  <SelectItem value="no_date">마감일 없음</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">최근 업데이트</SelectItem>
                  <SelectItem value="created_desc">최근 생성</SelectItem>
                  <SelectItem value="created_asc">오래된 순</SelectItem>
                  <SelectItem value="priority">우선순위</SelectItem>
                  <SelectItem value="due_date">마감일</SelectItem>
                  <SelectItem value="title">제목순</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                완료된 항목 {showCompleted ? '숨기기' : '표시'}
              </Button>
            </div>

            {/* 필터 상태 표시 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>총 {filteredTasks.length}개 작업</span>
              {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setDueDateFilter('all')
                    setSortBy('updated_desc')
                  }}
                  className="h-6 px-2 text-xs"
                >
                  필터 초기화
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 우선순위</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 작업 목록 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">작업이 없습니다</h3>
                <p className="mb-4">
                  {tasks.length === 0 
                    ? "첫 번째 작업을 만들어 시작해보세요!" 
                    : "검색 조건에 맞는 작업이 없습니다."
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  새 작업 만들기
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={getTaskStatusColor(task)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => toggleTaskStatus(task)}
                  >
                    {getTaskStatusIcon(task)}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        {task.energy}/10
                      </div>
                      
                      {task.due_at && (
                        <div className={`flex items-center gap-1 text-sm ${
                          isPast(new Date(task.due_at)) && task.status !== 'completed' 
                            ? 'text-red-600' 
                            : 'text-muted-foreground'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {getDateLabel(task.due_at)}
                        </div>
                      )}
                      
                      <Badge variant="outline">
                        {task.status === 'pending' ? '대기' : 
                         task.status === 'in_progress' ? '진행중' :
                         task.status === 'completed' ? '완료' : '취소'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {task.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startTask(task)}
                        className="gap-1"
                      >
                        <PlayCircle className="w-3 h-3" />
                        시작
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pauseTask(task)}
                        className="gap-1"
                      >
                        <PauseCircle className="w-3 h-3" />
                        일시정지
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 태스크 편집 다이얼로그 */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>태스크 수정</DialogTitle>
            <DialogDescription>
              태스크 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">제목</label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({
                    ...editingTask,
                    title: e.target.value
                  })}
                  placeholder="태스크 제목"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">설명</label>
                <Textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({
                    ...editingTask,
                    description: e.target.value
                  })}
                  placeholder="태스크 설명"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">우선순위</label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setEditingTask({
                        ...editingTask,
                        priority: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">상태</label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => 
                      setEditingTask({
                        ...editingTask,
                        status: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기</SelectItem>
                      <SelectItem value="in_progress">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">마감일</label>
                <Input
                  type="datetime-local"
                  value={editingTask.due_at ? new Date(editingTask.due_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingTask({
                    ...editingTask,
                    due_at: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                >
                  취소
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await enhancedAPI.updateTask(editingTask.id, editingTask);
                      await loadTasks();
                      setEditingTask(null);
                    } catch (error) {
                      console.error('Failed to update task:', error);
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
