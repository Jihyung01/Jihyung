import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Clock, Flag, Plus, Calendar, User, Target, SortAscending } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { listTasks, createTask, updateTask, deleteTask } from '../../lib/api'
import { toast } from 'sonner'

interface TasksPageProps {
  className?: string
}

interface Task {
  id: number
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  assignee?: string
  note_id?: number
  recurring_rule?: string
  created_at: string
  updated_at: string
}

export function TasksPage({ className }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at' | 'title'>('due_date')
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const data = await listTasks()
      setTasks(data || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('태스크 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('태스크 제목을 입력해주세요')
      return
    }

    try {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        due_date: newTaskDueDate || undefined,
        priority: newTaskPriority,
        assignee: newTaskAssignee.trim() || undefined,
        status: 'pending' as const
      }

      const createdTask = await createTask(taskData)
      setTasks(currentTasks => [createdTask, ...currentTasks])
      
      // Reset form
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskDueDate('')
      setNewTaskPriority('medium')
      setNewTaskAssignee('')
      setIsCreating(false)
      
      toast.success('태스크가 생성되었습니다')
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('태스크 생성에 실패했습니다')
    }
  }

  const handleUpdateTask = async (task: Task) => {
    try {
      const updatedTask = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee
      })
      
      setTasks(currentTasks => 
        currentTasks.map(t => t.id === task.id ? updatedTask : t)
      )
      
      setEditingTask(null)
      toast.success('태스크가 업데이트되었습니다')
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('태스크 업데이트에 실패했습니다')
    }
  }

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    
    try {
      const updatedTask = await updateTask(task.id, { status: newStatus })
      setTasks(currentTasks => 
        currentTasks.map(t => t.id === task.id ? updatedTask : t)
      )
      
      toast.success(newStatus === 'completed' ? '태스크를 완료했습니다' : '태스크를 미완료로 변경했습니다')
    } catch (error) {
      console.error('Failed to toggle task status:', error)
      toast.error('태스크 상태 변경에 실패했습니다')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('정말로 이 태스크를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteTask(taskId)
      setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId))
      toast.success('태스크가 삭제되었습니다')
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('태스크 삭제에 실패했습니다')
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const statusMatch = filter === 'all' || task.status === filter
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter
      return statusMatch && priorityMatch
    })
  }

  const getSortedTasks = () => {
    return [...getFilteredTasks()].sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'low': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flag className="h-3 w-3" weight="fill" />
      case 'medium': return <Flag className="h-3 w-3" weight="bold" />
      case 'low': return <Flag className="h-3 w-3" weight="light" />
      default: return <Flag className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'pending': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return '지연됨'
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '내일'
    if (diffDays < 7) return `${diffDays}일 후`
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false
    const dueDate = new Date(dueDateString)
    const now = new Date()
    return dueDate < now
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => t.status !== 'completed' && isOverdue(t.due_date)).length

    return { total, completed, pending, inProgress, overdue }
  }

  const stats = getTaskStats()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                태스크 관리
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                총 {stats.total}개 • 완료 {stats.completed}개 • 진행중 {stats.inProgress}개
                {stats.overdue > 0 && <span className="text-red-600"> • 지연 {stats.overdue}개</span>}
              </p>
            </div>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 태스크
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>새 태스크 생성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="태스크 제목"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="태스크 설명 (선택사항)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">마감일</label>
                      <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">우선순위</label>
                      <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
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
                  </div>
                  <Input
                    placeholder="담당자 (선택사항)"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                      취소
                    </Button>
                    <Button onClick={handleCreateTask} className="flex-1">
                      생성
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">대기중</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Circle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('in_progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">진행중</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">지연</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <Flag className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 우선순위</SelectItem>
                <SelectItem value="high">높음</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">마감일순</SelectItem>
                <SelectItem value="priority">우선순위순</SelectItem>
                <SelectItem value="created_at">생성일순</SelectItem>
                <SelectItem value="title">제목순</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => { setFilter('all'); setPriorityFilter('all'); }}>
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </CardContent>
          </Card>
        ) : getSortedTasks().length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filter === 'all' ? '태스크가 없습니다' : '해당하는 태스크가 없습니다'}
              </h3>
              <p className="text-muted-foreground mb-4">
                새로운 태스크를 생성하거나 필터를 조정해보세요
              </p>
              <Button onClick={() => setIsCreating(true)}>
                새 태스크 생성
              </Button>
            </CardContent>
          </Card>
        ) : (
          getSortedTasks().map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => handleToggleTaskStatus(task)}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                    ) : (
                      <Circle className={`h-5 w-5 ${getStatusColor(task.status)}`} />
                    )}
                  </Button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-medium text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`gap-1 ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary">
                          {task.status === 'pending' ? '대기중' : 
                           task.status === 'in_progress' ? '진행중' : '완료'}
                        </Badge>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-muted-foreground mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-600' : ''}`}>
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                      
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {task.assignee}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(task.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      편집
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>태스크 편집</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="태스크 제목"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
              <Textarea
                placeholder="태스크 설명"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                className="min-h-[100px] resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">마감일</label>
                  <Input
                    type="date"
                    value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">우선순위</label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value: any) => setEditingTask({...editingTask, priority: value})}
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">상태</label>
                  <Select 
                    value={editingTask.status} 
                    onValueChange={(value: any) => setEditingTask({...editingTask, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기중</SelectItem>
                      <SelectItem value="in_progress">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">담당자</label>
                  <Input
                    placeholder="담당자"
                    value={editingTask.assignee || ''}
                    onChange={(e) => setEditingTask({...editingTask, assignee: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingTask(null)} className="flex-1">
                  취소
                </Button>
                <Button onClick={() => handleUpdateTask(editingTask)} className="flex-1">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}