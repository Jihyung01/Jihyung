import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  Plus, 
  Brain,
  TrendUp,
  Target,
  Lightbulb
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { toast } from 'sonner'

interface TodayItem {
  id: string
  type: 'task' | 'event' | 'note'
  title: string
  time?: string
  completed?: boolean
  priority?: 'high' | 'medium' | 'low'
  category?: string
}

export function TodayScreen() {
  const [todayItems, setTodayItems] = useState<TodayItem[]>([])
  const [focusTime, setFocusTime] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)

  useEffect(() => {
    // Mock data for today's items
    const mockItems: TodayItem[] = [
      {
        id: '1',
        type: 'event',
        title: '팀 미팅',
        time: '09:00',
        category: '회의'
      },
      {
        id: '2',
        type: 'task',
        title: 'AI 모델 리서치 보고서 작성',
        time: '10:30',
        completed: false,
        priority: 'high'
      },
      {
        id: '3',
        type: 'task',
        title: '프로젝트 진행상황 체크',
        time: '14:00',
        completed: true,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'note',
        title: '새로운 아이디어: 자동화 워크플로우',
        time: '16:00',
        category: '아이디어'
      },
      {
        id: '5',
        type: 'task',
        title: '주간 회고 작성',
        time: '17:30',
        completed: false,
        priority: 'low'
      }
    ]
    setTodayItems(mockItems)
    setCompletedTasks(mockItems.filter(item => item.completed).length)
  }, [])

  const toggleTask = (id: string) => {
    setTodayItems(items =>
      items.map(item =>
        item.id === id && item.type === 'task'
          ? { ...item, completed: !item.completed }
          : item
      )
    )
    const item = todayItems.find(item => item.id === id)
    if (item) {
      toast.success(item.completed ? '태스크를 미완료로 변경했습니다.' : '태스크를 완료했습니다!')
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2024-01-01 ${time}`).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const totalTasks = todayItems.filter(item => item.type === 'task').length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            좋은 하루예요! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 테스트 버튼 */}
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('테스트 버튼 클릭됨!')
              alert('버튼이 정상적으로 작동합니다!')
            }}
          >
            테스트 버튼
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            새 항목 추가
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘의 진행률</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <Progress value={progress} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasks}/{totalTasks} 태스크 완료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">집중 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{focusTime}시간</div>
            <p className="text-xs text-muted-foreground">
              목표: 6시간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">생성된 노트</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              어제 대비 +1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인사이트</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              새로운 연결 발견
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                오늘의 일정
              </CardTitle>
              <CardDescription>
                오늘 예정된 태스크와 이벤트를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      item.completed ? 'bg-muted/50' : 'bg-background'
                    } transition-colors`}
                  >
                    {/* Time */}
                    <div className="text-sm font-mono text-muted-foreground w-16">
                      {item.time && formatTime(item.time)}
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {item.type === 'task' ? (
                        <button
                          onClick={() => toggleTask(item.id)}
                          className="text-primary hover:text-primary/80"
                        >
                          {item.completed ? (
                            <CheckCircle className="w-5 h-5" weight="fill" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      ) : item.type === 'event' ? (
                        <Calendar className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Brain className="w-5 h-5 text-purple-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.category && (
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge
                            variant={
                              item.priority === 'high' ? 'destructive' :
                              item.priority === 'medium' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {item.priority === 'high' ? '높음' :
                             item.priority === 'medium' ? '보통' : '낮음'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                새 태스크 추가
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Brain className="w-4 h-4" />
                아이디어 캡처
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="w-4 h-4" />
                집중 시간 시작
              </Button>
            </CardContent>
          </Card>

          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="w-4 h-4" />
                최근 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    생산성 패턴 발견
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    오전 시간대에 가장 집중도가 높습니다
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    연관 노트 발견
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                    'AI 모델링'과 관련된 3개 노트 연결
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}