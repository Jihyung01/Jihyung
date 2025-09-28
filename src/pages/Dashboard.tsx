import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartBar,
  CheckSquare,
  Note,
  Calendar as CalendarIcon,
  Tray,
  Target,
  TrendUp,
  Clock,
  Star,
  Lightning,
  Brain,
  Activity
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'

interface DashboardStats {
  totalNotes: number
  totalTasks: number
  completedTasks: number
  todayEvents: number
  inboxItems: number
  completionRate: number
  productivityScore: number
  streakDays: number
}

interface ActivityItem {
  id: string
  type: 'note' | 'task' | 'event'
  title: string
  timestamp: Date
  completed?: boolean
}

interface WeeklyGoal {
  id: string
  title: string
  target: number
  current: number
  type: 'tasks' | 'notes' | 'hours'
}

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    totalTasks: 0,
    completedTasks: 0,
    todayEvents: 0,
    inboxItems: 0,
    completionRate: 0,
    productivityScore: 0,
    streakDays: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch notes data
        const notesResponse = await fetch('/api/notes')
        const notesData = notesResponse.ok ? await notesResponse.json() : []

        // Fetch tasks data
        const tasksResponse = await fetch('/api/tasks')
        const tasksData = tasksResponse.ok ? await tasksResponse.json() : []

        // Fetch events data
        const eventsResponse = await fetch('/api/events')
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : []

        // Calculate stats from real data
        const totalNotes = notesData.length || 0
        const totalTasks = tasksData.length || 0
        const completedTasks = tasksData.filter((task: any) => task.completed).length || 0
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // Filter today's events
        const today = new Date()
        const todayEvents = eventsData.filter((event: any) => {
          const eventDate = new Date(event.date || event.created_at)
          return eventDate.toDateString() === today.toDateString()
        }).length || 0

        // Calculate productivity score based on completion rate and activity
        const activityScore = Math.min(100, (totalNotes + totalTasks + todayEvents) * 5)
        const productivityScore = Math.round((completionRate * 0.6) + (activityScore * 0.4))

        const calculatedStats: DashboardStats = {
          totalNotes,
          totalTasks,
          completedTasks,
          todayEvents,
          inboxItems: 0, // Will be implemented later
          completionRate,
          productivityScore,
          streakDays: 5 // Will be calculated based on daily activity
        }
        setStats(calculatedStats)

        // Build recent activity from all data sources
        const recentActivity: ActivityItem[] = []

        // Add recent notes
        notesData.slice(0, 5).forEach((note: any) => {
          recentActivity.push({
            id: note.id,
            type: 'note',
            title: note.title || '제목 없는 노트',
            timestamp: new Date(note.created_at || note.updated_at || Date.now())
          })
        })

        // Add recent tasks
        tasksData.slice(0, 5).forEach((task: any) => {
          recentActivity.push({
            id: task.id,
            type: 'task',
            title: task.title || task.name || '제목 없는 태스크',
            timestamp: new Date(task.created_at || task.updated_at || Date.now()),
            completed: task.completed || false
          })
        })

        // Add recent events
        eventsData.slice(0, 5).forEach((event: any) => {
          recentActivity.push({
            id: event.id,
            type: 'event',
            title: event.title || event.name || '제목 없는 일정',
            timestamp: new Date(event.date || event.created_at || Date.now())
          })
        })

        // Sort by timestamp and take latest 5
        const sortedActivity = recentActivity
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5)

        setRecentActivity(sortedActivity)

        // Calculate weekly goals based on current progress
        const weeklyGoals: WeeklyGoal[] = [
          {
            id: '1',
            title: '주간 태스크 완료',
            target: 20,
            current: completedTasks,
            type: 'tasks'
          },
          {
            id: '2',
            title: '새 노트 작성',
            target: 10,
            current: Math.min(totalNotes, 10),
            type: 'notes'
          },
          {
            id: '3',
            title: '집중 작업 시간',
            target: 40,
            current: Math.min(28, Math.round(productivityScore * 0.4)),
            type: 'hours'
          }
        ]
        setWeeklyGoals(weeklyGoals)

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)

        // Fallback to mock data if API calls fail
        const fallbackStats: DashboardStats = {
          totalNotes: 0,
          totalTasks: 0,
          completedTasks: 0,
          todayEvents: 0,
          inboxItems: 0,
          completionRate: 0,
          productivityScore: 0,
          streakDays: 0
        }
        setStats(fallbackStats)
        setRecentActivity([])
        setWeeklyGoals([])
      }
    }

    fetchDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return <Note className="w-4 h-4 text-blue-500" />
      case 'task': return <CheckSquare className="w-4 h-4 text-green-500" />
      case 'event': return <CalendarIcon className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) {
      return `${minutes}분 전`
    } else {
      return `${hours}시간 전`
    }
  }

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'tasks': return <CheckSquare className="w-4 h-4" />
      case 'notes': return <Note className="w-4 h-4" />
      case 'hours': return <Clock className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getGoalTypeUnit = (type: string) => {
    switch (type) {
      case 'tasks': return '개'
      case 'notes': return '개'
      case 'hours': return '시간'
      default: return ''
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ChartBar className="w-8 h-8" />
            대시보드
          </h1>
          <p className="text-muted-foreground mt-1">
            오늘의 생산성 현황을 확인해보세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Lightning className="w-4 h-4 mr-1" />
            {stats.streakDays}일 연속
          </Badge>
          <Button variant="outline" size="sm">
            보고서 내보내기
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/notes')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 노트</p>
                <p className="text-3xl font-bold">{stats.totalNotes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendUp className="inline w-3 h-3 mr-1" />
                  지난주 대비 +3
                </p>
              </div>
              <Note className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/tasks')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">완료율</p>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedTasks}/{stats.totalTasks} 태스크
                </p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/calendar')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">오늘 일정</p>
                <p className="text-3xl font-bold">{stats.todayEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  다음 일정: 2시간 후
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/inbox')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">받은함</p>
                <p className="text-3xl font-bold">{stats.inboxItems}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  처리 필요
                </p>
              </div>
              <Tray className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Score & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              생산성 점수
            </CardTitle>
            <CardDescription>
              오늘의 전반적인 생산성 평가
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold">{stats.productivityScore}</span>
              <Badge 
                className={
                  stats.productivityScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  stats.productivityScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }
              >
                {stats.productivityScore >= 80 ? '우수' :
                 stats.productivityScore >= 60 ? '양호' : '개선필요'}
              </Badge>
            </div>
            <Progress value={stats.productivityScore} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium">태스크</p>
                <p className="text-muted-foreground">{stats.completionRate}%</p>
              </div>
              <div className="text-center">
                <p className="font-medium">활동량</p>
                <p className="text-muted-foreground">높음</p>
              </div>
              <div className="text-center">
                <p className="font-medium">연속성</p>
                <p className="text-muted-foreground">{stats.streakDays}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              주간 목표
            </CardTitle>
            <CardDescription>
              이번 주 달성 현황
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyGoals.map(goal => {
              const progress = Math.round((goal.current / goal.target) * 100)
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGoalTypeIcon(goal.type)}
                      <span className="font-medium">{goal.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {goal.current}/{goal.target}{getGoalTypeUnit(goal.type)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progress >= 100 ? '목표 달성!' : `${100 - progress}% 남음`}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            최근 활동
          </CardTitle>
          <CardDescription>
            지난 24시간 동안의 활동 내역
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {activity.completed !== undefined && (
                    <Badge 
                      variant={activity.completed ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {activity.completed ? '완료' : '진행중'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>
            자주 사용하는 기능들에 빠르게 접근하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Note className="w-6 h-6" />
              새 노트
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CheckSquare className="w-6 h-6" />
              새 태스크
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CalendarIcon className="w-6 h-6" />
              새 일정
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Tray className="w-6 h-6" />
              받은함 확인
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              즐겨찾기 {Math.floor(stats.totalNotes * 0.3)}개
            </span>
            <span className="flex items-center gap-1">
              <Lightning className="w-4 h-4" />
              연속 달성 {stats.streakDays}일
            </span>
            <span className="flex items-center gap-1">
              <TrendUp className="w-4 h-4" />
              이번 주 생산성 +15%
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              AI 추천 활용률 67%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
