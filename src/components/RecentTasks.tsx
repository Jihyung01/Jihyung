import { CheckCircle, Circle, Clock, Flag, Calendar, User } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface Task {
  id: number | string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  due_date?: string
  assignee?: string
}

interface RecentTasksProps {
  tasks: Task[]
  className?: string
}

export function RecentTasks({ tasks, className }: RecentTasksProps) {
  const pendingTasks = tasks.filter(task => task.status === 'pending').slice(0, 8)
  const completedCount = tasks.filter(task => task.status === 'completed').length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200'
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'medium': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'low': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Flag className="h-3 w-3" weight="fill" />
      case 'high': return <Flag className="h-3 w-3" weight="bold" />
      case 'medium': return <Flag className="h-3 w-3" />
      case 'low': return <Flag className="h-3 w-3" weight="light" />
      default: return <Flag className="h-3 w-3" />
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

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    
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

  if (pendingTasks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-primary" />
            진행중 태스크
          </CardTitle>
          <CardDescription>완료할 태스크들이 여기 표시됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">모든 태스크 완료!</h3>
            <p className="text-muted-foreground mb-4">
              새로운 태스크를 추가하거나 노트에서 자동 추출해보세요
            </p>
            {completedCount > 0 && (
              <Badge variant="secondary" className="mb-4">
                {completedCount}개 완료됨
              </Badge>
            )}
            <Button variant="outline" size="sm">
              새 태스크 추가
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-primary" />
              진행중 태스크
            </CardTitle>
            <CardDescription>
              {pendingTasks.length}개 진행중 • {completedCount}개 완료
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            전체 보기
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="mt-1">
                <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 ${getPriorityColor(task.priority)}`}
                    >
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatCreatedDate(task.created_at)}
                  </div>
                  
                  {task.due_date && (
                    <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? 'text-red-600' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.due_date)}
                    </div>
                  )}
                  
                  {task.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.filter(task => task.status === 'pending').length > 8 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
              {tasks.filter(task => task.status === 'pending').length - 8}개 더 보기
            </Button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" className="w-full text-sm">
            새 태스크 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}