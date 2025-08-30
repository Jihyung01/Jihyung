import { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Plus,
  MagnifyingGlass,
  Funnel,
  Calendar,
  Flag,
  Clock,
  User,
  DotsThree,
  Circle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Lightning
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

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: Date
  category: string
  assignee?: string
  tags: string[]
  createdAt: Date
  completedAt?: Date
  estimatedTime?: number // minutes
  actualTime?: number // minutes
  subtasks?: Task[]
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('dueDate')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    // Mock tasks data
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'FastAPI 백엔드 API 구현',
        description: 'User authentication, CRUD operations for notes and tasks 구현',
        completed: false,
        priority: 'high',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2일 후
        category: '개발',
        assignee: '김개발',
        tags: ['백엔드', 'FastAPI', 'Python'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
        estimatedTime: 480, // 8시간
        subtasks: [
          {
            id: '1-1',
            title: 'User 모델 설계',
            completed: true,
            priority: 'medium',
            category: '개발',
            tags: ['데이터베이스'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20)
          },
          {
            id: '1-2',
            title: 'JWT 인증 구현',
            completed: false,
            priority: 'high',
            category: '개발',
            tags: ['보안', 'JWT'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18)
          }
        ]
      },
      {
        id: '2',
        title: '프론트엔드 컴포넌트 리팩토링',
        description: 'React 컴포넌트들을 TypeScript로 마이그레이션하고 성능 최적화',
        completed: false,
        priority: 'medium',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5일 후
        category: '개발',
        assignee: '이프론트',
        tags: ['프론트엔드', 'React', 'TypeScript'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2일 전
        estimatedTime: 360 // 6시간
      },
      {
        id: '3',
        title: '프로젝트 발표 자료 준비',
        description: '스프린트 리뷰를 위한 데모 및 프레젠테이션 자료 작성',
        completed: true,
        priority: 'high',
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
        category: '업무',
        assignee: '박기획',
        tags: ['발표', '스프린트'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3일 전
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12시간 전
        estimatedTime: 120,
        actualTime: 150
      },
      {
        id: '4',
        title: 'UI/UX 디자인 시스템 업데이트',
        description: 'Figma 컴포넌트 라이브러리 업데이트 및 새로운 컬러 팔레트 적용',
        completed: false,
        priority: 'low',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7일 후
        category: '디자인',
        assignee: '최디자인',
        tags: ['디자인시스템', 'Figma', 'UI'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4일 전
        estimatedTime: 240 // 4시간
      },
      {
        id: '5',
        title: '코드 리뷰 및 문서화',
        description: '신규 기능에 대한 코드 리뷰 수행 및 README 업데이트',
        completed: false,
        priority: 'medium',
        category: '개발',
        tags: ['코드리뷰', '문서화'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6시간 전
        estimatedTime: 90
      },
      {
        id: '6',
        title: '개인 블로그 포스팅',
        description: 'React 19 새 기능에 대한 기술 블로그 글 작성',
        completed: false,
        priority: 'low',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2주 후
        category: '개인',
        tags: ['블로그', 'React', '기술글'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2일 전
        estimatedTime: 180
      }
    ]
    setTasks(mockTasks)
  }, [])

  const categories = ['all', ...Array.from(new Set(tasks.map(task => task.category)))]
  
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed)
    
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.getTime() - b.dueDate.getTime()
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const toggleTask = (id: string) => {
    setTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { 
          ...task, 
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined
        } : task
      )
    )
    const task = tasks.find(t => t.id === id)
    if (task) {
      toast.success(task.completed ? '태스크가 미완료로 변경되었습니다!' : '태스크가 완료되었습니다!')
    }
  }

  const deleteTask = (id: string) => {
    setTasks(tasks => tasks.filter(task => task.id !== id))
    toast.success('태스크가 삭제되었습니다!')
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ArrowUp className="w-4 h-4 text-red-500" />
      case 'medium': return <Minus className="w-4 h-4 text-yellow-500" />
      case 'low': return <ArrowDown className="w-4 h-4 text-green-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isOverdue = (task: Task) => {
    return task.dueDate && !task.completed && task.dueDate < new Date()
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일'
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
    }
    return `${mins}분`
  }

  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
  const overdueCount = tasks.filter(isOverdue).length
  const todayDueCount = tasks.filter(t => 
    t.dueDate && 
    !t.completed && 
    t.dueDate.toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CheckSquare className="w-8 h-8" />
            태스크
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredTasks.filter(t => !t.completed).length}개의 미완료 태스크
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
          >
            {viewMode === 'list' ? '칸반' : '목록'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 태스크
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 태스크 추가</DialogTitle>
                <DialogDescription>
                  새로운 태스크를 생성해보세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="태스크 제목을 입력하세요..." />
                <textarea 
                  className="w-full h-24 p-3 border rounded-md resize-none"
                  placeholder="태스크 설명 (선택사항)"
                />
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">완료율</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">오늘 마감</p>
                <p className="text-2xl font-bold">{todayDueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lightning className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">지연된 태스크</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">총 태스크</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="태스크에서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              {filterStatus === 'all' ? '전체' : 
               filterStatus === 'completed' ? '완료' : '미완료'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>전체</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('pending')}>미완료</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('completed')}>완료</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Flag className="w-4 h-4" />
              우선순위
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterPriority('all')}>전체</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('high')}>높음</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('medium')}>보통</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPriority('low')}>낮음</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Funnel className="w-4 h-4" />
              카테고리
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map(category => (
              <DropdownMenuItem
                key={category}
                onClick={() => setFilterCategory(category)}
              >
                {category === 'all' ? '전체' : category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              정렬
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('dueDate')}>마감일순</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('priority')}>우선순위순</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('created')}>생성일순</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('title')}>제목순</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">태스크가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 태스크를 생성해보세요!
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                태스크 생성하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => (
            <Card key={task.id} className={`transition-all hover:shadow-md ${
              task.completed ? 'opacity-60' : ''
            } ${isOverdue(task) ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-primary hover:text-primary/80 mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5" weight="fill" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(task.priority)}
                          {task.priority === 'high' ? '높음' :
                           task.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>

                      {task.dueDate && (
                        <Badge 
                          variant={isOverdue(task) ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(task.dueDate)}
                        </Badge>
                      )}

                      {task.assignee && (
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          {task.assignee}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className={`font-semibold text-lg mb-2 ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-muted-foreground text-sm mb-3">
                        {task.description}
                      </p>
                    )}

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="border-l-2 border-muted pl-4 mb-3">
                        <p className="text-xs text-muted-foreground mb-2">하위 태스크</p>
                        <div className="space-y-1">
                          {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2 text-sm">
                              <button
                                onClick={() => toggleTask(subtask.id)}
                                className="text-primary hover:text-primary/80"
                              >
                                {subtask.completed ? (
                                  <CheckCircle className="w-4 h-4" weight="fill" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.createdAt.toLocaleDateString('ko-KR')}
                      </span>
                      {task.estimatedTime && (
                        <span>예상 {formatDuration(task.estimatedTime)}</span>
                      )}
                      {task.actualTime && (
                        <span>실제 {formatDuration(task.actualTime)}</span>
                      )}
                      {task.completedAt && (
                        <span>완료: {task.completedAt.toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600"
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {sortedTasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>표시된 태스크 {filteredTasks.length}개</span>
              <span>완료된 태스크 {filteredTasks.filter(t => t.completed).length}개</span>
              <span>높은 우선순위 {filteredTasks.filter(t => t.priority === 'high').length}개</span>
              <span>예상 작업시간 {formatDuration(filteredTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0))}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
