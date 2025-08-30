import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import enhancedAPI, { type Task } from '@/lib/enhanced-api.ts';

interface TasksPageProps {
  onTaskCreated?: (task: Task) => void;
}

const ListSkeleton = ({ count = 3, type = 'task' }: { count?: number; type?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
            <div className="w-20 h-6 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const TasksPage: React.FC<TasksPageProps> = ({ onTaskCreated }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_desc');
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
      toast.error('작업 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...tasks];

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
      filtered = filtered.filter(task => {
        if (!task.due_at) return dueDateFilter === 'no_date';
        const dueDate = new Date(task.due_at);
        
        switch (dueDateFilter) {
          case 'overdue':
            return isPast(dueDate) && task.status !== 'completed';
          case 'today':
            return isToday(dueDate);
          case 'tomorrow':
            return isTomorrow(dueDate);
          case 'this_week':
            return isThisWeek(dueDate);
          case 'no_date':
            return false;
          default:
            return true;
        }
      });
    }

    // 완료된 작업 표시/숨김
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated_desc':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter, dueDateFilter, showCompleted, sortBy]);    const createTask = async () => {
    try {
      if (!newTask.title.trim()) {
        toast.error('작업 제목을 입력해주세요');
        return;
      }

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        energy_level: newTask.energy.toString(),
        due_at: newTask.due_at || undefined,
        status: 'pending' as const
      };

      const createdTask = await enhancedAPI.createTask(taskData);
      setTasks(prev => [createdTask, ...prev]);
      
      // 부모 컴포넌트에 알림
      onTaskCreated?.(createdTask);

      // 폼 리셋
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        energy: 5,
        due_at: ''
      });
      setShowCreateDialog(false);
      
      toast.success('작업이 생성되었습니다');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('작업 생성에 실패했습니다');
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      console.log(`Updating task ${task.id} status from ${task.status} to ${newStatus}`);
      
      const updateData = { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      };
      
      const updatedTask = await enhancedAPI.updateTask(task.id, updateData);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success(`작업이 ${newStatus === 'completed' ? '완료' : '미완료'}로 변경되었습니다`);
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('작업 상태 변경에 실패했습니다');
    }
  };

  const startTask = async (task: Task) => {
    try {
      const updatedTask = await enhancedAPI.updateTask(task.id, { 
        status: 'in_progress'
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success('작업을 시작했습니다');
    } catch (error) {
      console.error('Failed to start task:', error);
      toast.error('작업 시작에 실패했습니다');
    }
  };

  const pauseTask = async (task: Task) => {
    try {
      const updatedTask = await enhancedAPI.updateTask(task.id, { 
        status: 'pending'
      });
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success('작업을 일시정지했습니다');
    } catch (error) {
      console.error('Failed to pause task:', error);
      toast.error('작업 일시정지에 실패했습니다');
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await enhancedAPI.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('작업이 삭제되었습니다');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('작업 삭제에 실패했습니다');
    }
  };

  const saveEditingTask = async () => {
    if (!editingTask) return;
    
    try {
      const updatedTask = await enhancedAPI.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_at: editingTask.due_at
      });
      
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      setEditingTask(null);
      toast.success('작업이 수정되었습니다');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('작업 수정에 실패했습니다');
    }
  };

  // 유틸리티 함수들
  const getTaskStatusIcon = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskStatusColor = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'pending':
        return 'border-gray-200 bg-white';
      default:
        return 'border-gray-200 bg-white';
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
      default: return 'default';
    }
  };  const getDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return '오늘';
    if (isTomorrow(d)) return '내일';
    if (isPast(d)) return '지연됨';
    return format(d, 'MM/dd', { locale: ko });
  };

  // 통계 계산
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
                <Plus className="h-4 w-4" />
                새 작업
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>새 작업 만들기</DialogTitle>
                <DialogDescription>
                  새로운 작업을 추가하고 일정을 관리하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="작업 제목"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="작업 설명 (선택사항)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
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
      </div>

      {/* 통계 카드들 */}
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
              <AlertTriangle className="w-4 h-4 text-red-600" />
              지연됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* 진행률 표시 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">완료율</span>
            <span className="text-sm text-muted-foreground">{completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="작업 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  완료된 작업 {showCompleted ? '숨기기' : '보기'}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="pending">대기 중</SelectItem>
                  <SelectItem value="in_progress">진행 중</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
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
                  <SelectItem value="due_date">마감일 순</SelectItem>
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
                {tasks.length === 0
                  ? '아직 작업이 없습니다. 새 작업을 만들어보세요!'
                  : '필터 조건에 맞는 작업이 없습니다.'
                }
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 작업 만들기
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={getTaskStatusColor(task)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskStatus(task)}
                    className="h-8 w-8 p-0"
                  >
                    {getTaskStatusIcon(task)}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.due_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getDateLabel(task.due_at)}
                        </div>
                      )}
                      <span>
                        {(() => {
                          try {
                            return formatDistanceToNow(new Date(task.updated_at), { addSuffix: true, locale: ko });
                          } catch (error) {
                            return '방금 전';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {task.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startTask(task)}
                        className="h-8 w-8 p-0"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => pauseTask(task)}
                        className="h-8 w-8 p-0"
                      >
                        <Pause className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-3 h-3" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>작업 수정</DialogTitle>
            <DialogDescription>
              작업 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <Input
                placeholder="작업 제목"
                value={editingTask.title}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  title: e.target.value
                })}
              />
              <Textarea
                placeholder="작업 설명"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  description: e.target.value
                })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">우선순위</label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value) => setEditingTask({
                      ...editingTask,
                      priority: value as any
                    })}
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
                  <label className="text-sm font-medium mb-2 block">마감일</label>
                  <Input
                    type="datetime-local"
                    value={editingTask.due_at || ''}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      due_at: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={saveEditingTask}>
                  저장
                </Button>
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
