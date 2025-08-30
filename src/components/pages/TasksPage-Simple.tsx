import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Trash2,
  Edit3,
  Search,
  Filter
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import * as api from '../../api/client';
import { toast } from 'sonner';

interface Task {
  id: number;
  title: string;
  content?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // 새 태스크 폼 상태
  const [newTask, setNewTask] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  });

  // 태스크 로드
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await api.listTasks();
      setTasks(data || []);
      toast.success('태스크를 불러왔습니다.');
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('태스크를 불러오는데 실패했습니다.');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    try {
      const taskData = {
        title: newTask.title,
        content: newTask.content,
        priority: newTask.priority,
        due_date: newTask.due_date || undefined
      };
      
      const createdTask = await api.createTask(taskData);
      setTasks(prev => [...prev, createdTask]);
      setNewTask({
        title: '',
        content: '',
        priority: 'medium',
        due_date: ''
      });
      setIsDialogOpen(false);
      toast.success('태스크가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('태스크 생성에 실패했습니다.');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      const updatedTask = await api.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast.success('태스크 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('태스크 업데이트에 실패했습니다.');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('정말로 이 태스크를 삭제하시겠습니까?')) return;
    
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('태스크가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('태스크 삭제에 실패했습니다.');
    }
  };

  // 필터링된 태스크
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.content && task.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '완료됨';
      case 'in_progress': return '진행중';
      case 'pending': return '대기중';
      default: return status;
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  // 통계 계산
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">작업 관리</h1>
          <p className="text-muted-foreground">
            아이디어와 작업을 체계적으로 정리하고 관리하세요
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 작업
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 작업 만들기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">제목 *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="작업 제목을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">설명</label>
                <Textarea
                  value={newTask.content}
                  onChange={(e) => setNewTask(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="작업에 대한 자세한 설명을 입력하세요"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">우선순위</label>
                  <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="mt-1">
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
                  <label className="text-sm font-medium">마감일 (선택사항)</label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createTask}>
                  작업 만들기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 작업</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료됨</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% 완료율
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="작업 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="in_progress">진행중</SelectItem>
            <SelectItem value="completed">완료됨</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="우선순위 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 우선순위</SelectItem>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">보통</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 작업 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">작업을 불러오는 중...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">등록된 작업이 없습니다</p>
              <p className="text-muted-foreground mb-4">
                첫 번째 작업을 만들어 시작해보세요!
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                새 작업 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge variant={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
                    </div>
                    {task.content && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.content}
                      </p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        마감: {new Date(task.due_date).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        진행
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
