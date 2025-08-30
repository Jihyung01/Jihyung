import { useState, useEffect } from 'react'
import { Calendar, Clock, Target, Brain, CaretRight } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { getDailyBrief } from '../api/client'
import { toast } from 'sonner'

interface DailyBriefProps {
  className?: string
}

interface TopTask {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_time: string
  best_time: string
}

interface TimeBlock {
  time: string
  task: string
  type: 'focus' | 'break' | 'admin'
}

interface FocusSession {
  session: number
  duration: number
  task: string
  break_after: number
}

interface DailyBriefApiResponse {
  date: string;
  today_tasks: any[];
  upcoming_tasks: any[];
  overdue_tasks: any[];
  time_blocks: Array<{
    time: string;
    activity: string;
    type: string;
  }>;
  focus_mode_suggestion: string;
  stats: {
    total_today: number;
    overdue_count: number;
    upcoming_count: number;
  };
}

interface DailyBriefData {
  top_tasks: TopTask[]
  time_blocks: TimeBlock[]
  focus_sessions: FocusSession[]
  carry_over: string[]
  motivation: string
  stats?: {
    total_today: number;
    overdue_count: number;
    upcoming_count: number;
  }
}

export function DailyBrief({ className }: DailyBriefProps) {
  const [briefData, setBriefData] = useState<DailyBriefData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadDailyBrief()
  }, [])

  const loadDailyBrief = async () => {
    try {
      const apiData: DailyBriefApiResponse = await getDailyBrief()
      
      // Transform API data to component format
      const transformedData: DailyBriefData = {
        top_tasks: apiData.today_tasks.slice(0, 3).map((task, index) => ({
          id: task.id?.toString() || index.toString(),
          title: task.title || 'Untitled Task',
          priority: task.priority || 'medium',
          estimated_time: '30분', // Default estimate
          best_time: '09:00-09:30' // Default time
        })),
        time_blocks: apiData.time_blocks.map(block => ({
          time: block.time,
          task: block.activity,
          type: block.type
        })),
        focus_sessions: [], // Will be populated based on time blocks
        carry_over: apiData.overdue_tasks.map(task => task.title || 'Untitled'),
        motivation: apiData.focus_mode_suggestion || '오늘도 집중해서 하나씩 완료해 나가세요!',
        stats: apiData.stats
      }
      
      setBriefData(transformedData)
    } catch (error) {
      console.error('Failed to load daily brief:', error)
      // Fallback to mock data
      generateMockBrief()
    }
  }

  const generateMockBrief = () => {
    // Mock data for demonstration
    const mockBrief: DailyBriefData = {
      top_tasks: [
        {
          id: '1',
          title: '프로젝트 제안서 작성 완료',
          priority: 'high',
          estimated_time: '90분',
          best_time: '09:00-10:30'
        },
        {
          id: '2',
          title: '팀 미팅 준비 및 아젠다 정리',
          priority: 'medium',
          estimated_time: '45분',
          best_time: '14:00-14:45'
        },
        {
          id: '3',
          title: '고객 피드백 리뷰 및 정리',
          priority: 'medium',
          estimated_time: '60분',
          best_time: '11:00-12:00'
        }
      ],
      time_blocks: [
        { time: '09:00-09:25', task: '프로젝트 제안서 작성', type: 'focus' },
        { time: '09:25-09:30', task: '휴식', type: 'break' },
        { time: '09:30-09:55', task: '프로젝트 제안서 작성', type: 'focus' },
        { time: '09:55-10:10', task: '휴식', type: 'break' },
        { time: '11:00-11:25', task: '고객 피드백 리뷰', type: 'focus' },
        { time: '14:00-14:25', task: '팀 미팅 준비', type: 'focus' }
      ],
      focus_sessions: [
        { session: 1, duration: 25, task: '프로젝트 제안서 작성', break_after: 5 },
        { session: 2, duration: 25, task: '프로젝트 제안서 작성', break_after: 15 },
        { session: 3, duration: 25, task: '고객 피드백 리뷰', break_after: 5 },
        { session: 4, duration: 25, task: '팀 미팅 준비', break_after: 5 }
      ],
      carry_over: [
        '지난주 미완료된 문서 리뷰',
        '이메일 정리 (50개 미처리)'
      ],
      motivation: '오늘도 집중해서 하나씩 완료해 나가세요! 작은 성취가 모여 큰 결과를 만듭니다. ✨'
    }

    setBriefData(mockBrief)
  }

  const regenerateBrief = async () => {
    setIsGenerating(true)
    try {
      const apiData: DailyBriefApiResponse = await getDailyBrief()
      
      // Transform API data to component format
      const transformedData: DailyBriefData = {
        top_tasks: apiData.today_tasks.slice(0, 3).map((task, index) => ({
          id: task.id?.toString() || index.toString(),
          title: task.title || 'Untitled Task',
          priority: task.priority || 'medium',
          estimated_time: '30분',
          best_time: '09:00-09:30'
        })),
        time_blocks: apiData.time_blocks.map(block => ({
          time: block.time,
          task: block.activity,
          type: block.type
        })),
        focus_sessions: [],
        carry_over: apiData.overdue_tasks.map(task => task.title || 'Untitled'),
        motivation: apiData.focus_mode_suggestion || '오늘도 집중해서 하나씩 완료해 나가세요!',
        stats: apiData.stats
      }
      
      setBriefData(transformedData)
      toast.success('데일리 브리프가 재생성되었습니다')
    } catch (error) {
      console.error('Failed to regenerate daily brief:', error)
      toast.error('브리프 재생성에 실패했습니다')
      // Fallback to mock data
      generateMockBrief()
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-green-100 text-green-800'
      case 'break': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!briefData) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                데일리 브리프
              </CardTitle>
              <CardDescription>AI가 생성한 오늘의 집중 계획</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
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
              <Calendar className="h-5 w-5 text-primary" />
              데일리 브리프
            </CardTitle>
            <CardDescription>
              {currentDate.toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateBrief}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            재생성
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Motivation Message */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">{briefData.motivation}</p>
        </div>

        {/* Top Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">오늘의 우선순위</h3>
          </div>
          <div className="space-y-2">
            {briefData.top_tasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.estimated_time}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {task.best_time}
                    </span>
                  </div>
                </div>
                <CaretRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Time Blocks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">시간 블록 계획</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {briefData.time_blocks.map((block, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded border border-border/50">
                <Badge variant="outline" className={`text-xs ${getTypeColor(block.type)}`}>
                  {block.time}
                </Badge>
                <span className="text-sm text-foreground truncate">{block.task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carry Over Tasks */}
        {briefData.carry_over.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium text-sm mb-2">미완료 태스크</h3>
              <div className="space-y-1">
                {briefData.carry_over.map((task, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {task}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Button */}
        <Button className="w-full gap-2">
          <Target className="h-4 w-4" />
          포커스 모드 시작
        </Button>
      </CardContent>
    </Card>
  )
}