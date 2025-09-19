import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, TrendingUp, Brain, Calendar, Clock, BarChart3 } from 'lucide-react'
import { habitTrackingService, Habit, HabitEntry, HabitInsight, PersonalizedRecommendation } from '../../services/HabitTrackingService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'

interface HabitTrackerProps {
  className?: string
}

export function HabitTracker({ className }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayEntries, setTodayEntries] = useState<Map<string, HabitEntry>>(new Map())
  const [insights, setInsights] = useState<HabitInsight[]>([])
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const habitsData = habitTrackingService.getHabits()
    setHabits(habitsData)

    const dashData = habitTrackingService.getDashboardData()
    setDashboardData(dashData)

    setInsights(habitTrackingService.getInsights())
    setRecommendations(habitTrackingService.getRecommendations())

    // Load today's entries
    const today = new Date().toISOString().split('T')[0]
    const todayMap = new Map<string, HabitEntry>()

    habitsData.forEach(habit => {
      const entries = habitTrackingService.getHabitEntries(habit.id, 1)
      const todayEntry = entries.find(e => e.date === today)
      if (todayEntry) {
        todayMap.set(habit.id, todayEntry)
      }
    })

    setTodayEntries(todayMap)
  }

  const recordHabitEntry = (habitId: string, value: number, mood?: string, difficulty?: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0]

    const entry = habitTrackingService.recordHabitEntry({
      habitId,
      date: today,
      value,
      mood: mood as any,
      difficulty: difficulty as any,
      notes
    })

    setTodayEntries(prev => new Map(prev.set(habitId, entry)))
    loadData() // Refresh to get updated insights

    const habit = habits.find(h => h.id === habitId)
    if (habit && value >= habit.targetValue) {
      toast.success(`${habit.name} 완료! 🎉`, {
        description: '훌륭합니다! 꾸준히 실행하고 있어요.'
      })
    }
  }

  const acceptRecommendation = (recommendationId: string) => {
    const success = habitTrackingService.acceptRecommendation(recommendationId)
    if (success) {
      toast.success('추천 습관이 추가되었습니다!')
      loadData()
    }
  }

  const dismissRecommendation = (recommendationId: string) => {
    habitTrackingService.dismissRecommendation(recommendationId)
    loadData()
  }

  const getCompletionPercentage = (habit: Habit) => {
    const todayEntry = todayEntries.get(habit.id)
    if (!todayEntry) return 0
    return Math.min(100, (todayEntry.value / habit.targetValue) * 100)
  }

  const getStreakInfo = (habitId: string) => {
    const streak = habitTrackingService.getHabitStreak(habitId)
    return streak || { currentStreak: 0, longestStreak: 0 }
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">습관 트래커</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI 기반 개인화된 습관 관리 시스템
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새 습관
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 습관 만들기</DialogTitle>
              <DialogDescription>
                새로운 습관을 만들어 건강한 루틴을 시작해보세요.
              </DialogDescription>
            </DialogHeader>
            <HabitCreateForm
              onSubmit={(habit) => {
                habitTrackingService.createHabit(habit)
                setShowCreateDialog(false)
                loadData()
                toast.success('새 습관이 생성되었습니다!')
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            오늘의 진행률
          </CardTitle>
          <CardDescription>
            {dashboardData.completedToday}/{dashboardData.totalHabits} 습관 완료
            ({(dashboardData.completionRate * 100).toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={dashboardData.completionRate * 100} className="h-2" />

            <div className="grid gap-3">
              {habits.map(habit => {
                const todayEntry = todayEntries.get(habit.id)
                const completed = todayEntry ? todayEntry.value >= habit.targetValue : false
                const percentage = getCompletionPercentage(habit)
                const streakInfo = getStreakInfo(habit.id)

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      completed
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: habit.color + '20', color: habit.color }}
                        >
                          {habit.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{habit.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            목표: {habit.targetValue} {habit.unit}
                            {streakInfo.currentStreak > 0 && (
                              <span className="ml-2 text-orange-600 dark:text-orange-400">
                                🔥 {streakInfo.currentStreak}일 연속
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={completed ? 'default' : 'secondary'}>
                          {percentage.toFixed(0)}%
                        </Badge>
                        <QuickEntryButton
                          habit={habit}
                          currentValue={todayEntry?.value || 0}
                          onSubmit={(value, mood, difficulty, notes) =>
                            recordHabitEntry(habit.id, value, mood, difficulty, notes)
                          }
                        />
                      </div>
                    </div>

                    {percentage > 0 && (
                      <div className="mt-3">
                        <Progress value={percentage} className="h-1" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI 인사이트
            </CardTitle>
            <CardDescription>
              당신의 습관 패턴을 분석한 맞춤 조언
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight, index) => {
                const habit = habits.find(h => h.id === insight.habitId)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-900 dark:text-purple-100">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          {insight.description}
                        </p>
                        {insight.recommendation && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 italic">
                            💡 {insight.recommendation}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(insight.confidence * 100).toFixed(0)}% 신뢰도
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              맞춤 추천
            </CardTitle>
            <CardDescription>
              AI가 분석한 당신을 위한 개인화 추천
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {rec.title}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {rec.description}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        추천 이유: {rec.reasoning}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        기대 효과: {rec.expectedImprovement}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRecommendation(rec.id)}
                        className="text-xs"
                      >
                        수락
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissRecommendation(rec.id)}
                        className="text-xs"
                      >
                        무시
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Analytics Dialog */}
      <Dialog open={!!selectedHabit} onOpenChange={() => setSelectedHabit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {selectedHabit?.name} 분석
            </DialogTitle>
          </DialogHeader>
          {selectedHabit && (
            <HabitAnalytics
              habit={selectedHabit}
              onClose={() => setSelectedHabit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Quick Entry Button Component
function QuickEntryButton({
  habit,
  currentValue,
  onSubmit
}: {
  habit: Habit
  currentValue: number
  onSubmit: (value: number, mood?: string, difficulty?: string, notes?: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [mood, setMood] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    onSubmit(value, mood, difficulty, notes)
    setIsOpen(false)
  }

  const quickActions = [
    { label: '+1', action: () => setValue(prev => prev + 1) },
    { label: '완료', action: () => setValue(habit.targetValue) },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          기록
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit.name} 기록하기</DialogTitle>
          <DialogDescription>
            오늘의 {habit.name} 실행 정도를 기록해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              실행량 ({habit.unit})
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                min="0"
                max={habit.targetValue * 2}
              />
              <div className="flex gap-1">
                {quickActions.map(action => (
                  <Button
                    key={action.label}
                    size="sm"
                    variant="outline"
                    onClick={action.action}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
            <Progress
              value={Math.min(100, (value / habit.targetValue) * 100)}
              className="mt-2 h-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">기분</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">선택하지 않음</option>
              <option value="very_bad">😞 매우 나쁨</option>
              <option value="bad">😔 나쁨</option>
              <option value="neutral">😐 보통</option>
              <option value="good">😊 좋음</option>
              <option value="very_good">😄 매우 좋음</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">난이도</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">선택하지 않음</option>
              <option value="very_easy">⭐ 매우 쉬움</option>
              <option value="easy">⭐⭐ 쉬움</option>
              <option value="medium">⭐⭐⭐ 보통</option>
              <option value="hard">⭐⭐⭐⭐ 어려움</option>
              <option value="very_hard">⭐⭐⭐⭐⭐ 매우 어려움</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="오늘의 경험을 간단히 적어보세요..."
              className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              기록하기
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Habit Create Form Component
function HabitCreateForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Habit['category']>('productivity')
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily')
  const [targetValue, setTargetValue] = useState(1)
  const [unit, setUnit] = useState('번')
  const [color, setColor] = useState('#3b82f6')
  const [icon, setIcon] = useState('⭐')
  const [priority, setPriority] = useState<Habit['priority']>('medium')

  const categories = [
    { value: 'health', label: '건강', icon: '💪' },
    { value: 'productivity', label: '생산성', icon: '📈' },
    { value: 'personal', label: '개인 발전', icon: '🌱' },
    { value: 'learning', label: '학습', icon: '📚' },
    { value: 'social', label: '사회적', icon: '👥' },
    { value: 'mindfulness', label: '마음챙김', icon: '🧘' }
  ]

  const handleSubmit = () => {
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      category,
      frequency,
      targetValue,
      unit,
      color,
      icon,
      priority,
      isActive: true
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">습관 이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 물 마시기, 운동하기"
          className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div>
        <label className="text-sm font-medium">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 습관에 대한 간단한 설명..."
          className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Habit['category'])}
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">빈도</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Habit['frequency'])}
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">목표 수치</label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            min="1"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="text-sm font-medium">단위</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="번, 분, 잔 등"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">아이콘</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎯"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="text-sm font-medium">색상</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full mt-1 h-10 border rounded-md dark:border-gray-700"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSubmit} className="flex-1" disabled={!name.trim()}>
          습관 만들기
        </Button>
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  )
}

// Habit Analytics Component
function HabitAnalytics({
  habit,
  onClose
}: {
  habit: Habit
  onClose: () => void
}) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [insights, setInsights] = useState<HabitInsight[]>([])

  useEffect(() => {
    const data = habitTrackingService.getHabitAnalytics(habit.id, 30)
    setAnalytics(data)
    setInsights(habitTrackingService.getInsights(habit.id))
  }, [habit.id])

  if (!analytics) {
    return <div className="p-4">로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {(analytics.completionRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">완료율</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.currentStreak}일
            </div>
            <div className="text-sm text-gray-600">현재 연속</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">최근 30일 통계</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>완료한 날:</span>
              <span>{analytics.completedDays}/{analytics.totalDays}일</span>
            </div>
            <div className="flex justify-between">
              <span>최고 연속 기록:</span>
              <span>{analytics.longestStreak}일</span>
            </div>
            <div className="flex justify-between">
              <span>평균 실행량:</span>
              <span>{analytics.averageValue.toFixed(1)} {habit.unit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {insights.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">AI 분석</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="text-sm p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                  <div className="font-medium">{insight.title}</div>
                  <div className="text-gray-600 dark:text-gray-400">{insight.description}</div>
                  {insight.recommendation && (
                    <div className="text-blue-600 dark:text-blue-400 mt-1">
                      💡 {insight.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={onClose} className="w-full">
        닫기
      </Button>
    </div>
  )
}

export default HabitTracker