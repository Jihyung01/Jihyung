export interface Habit {
  id: string
  name: string
  description?: string
  category: 'health' | 'productivity' | 'personal' | 'learning' | 'social' | 'mindfulness'
  frequency: 'daily' | 'weekly' | 'monthly'
  targetValue: number
  unit: string
  color: string
  icon: string
  isActive: boolean
  createdAt: Date
  targetDays?: number[] // For weekly habits: [1,2,3,4,5] = weekdays
  reminderTime?: string
  priority: 'low' | 'medium' | 'high'
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string // YYYY-MM-DD format
  value: number
  notes?: string
  mood?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good'
  difficulty?: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard'
  timestamp: number
}

export interface HabitStreak {
  habitId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate?: string
}

export interface HabitInsight {
  habitId: string
  type: 'success_pattern' | 'failure_pattern' | 'optimal_time' | 'mood_correlation' | 'difficulty_trend'
  title: string
  description: string
  recommendation?: string
  confidence: number
  data?: any
}

export interface PersonalizedRecommendation {
  id: string
  type: 'new_habit' | 'habit_adjustment' | 'timing_optimization' | 'goal_modification'
  title: string
  description: string
  habit?: Partial<Habit>
  priority: number
  reasoning: string
  expectedImprovement: string
  createdAt: Date
}

class HabitTrackingService {
  private habits: Map<string, Habit> = new Map()
  private entries: Map<string, HabitEntry[]> = new Map()
  private streaks: Map<string, HabitStreak> = new Map()
  private insights: HabitInsight[] = []
  private recommendations: PersonalizedRecommendation[] = []

  constructor() {
    this.loadData()
  }

  // Habit Management
  createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isActive: true
    }

    this.habits.set(newHabit.id, newHabit)
    this.entries.set(newHabit.id, [])
    this.streaks.set(newHabit.id, {
      habitId: newHabit.id,
      currentStreak: 0,
      longestStreak: 0
    })

    this.saveData()
    this.generateInsights()
    return newHabit
  }

  updateHabit(habitId: string, updates: Partial<Habit>): Habit | null {
    const habit = this.habits.get(habitId)
    if (!habit) return null

    const updatedHabit = { ...habit, ...updates }
    this.habits.set(habitId, updatedHabit)
    this.saveData()
    return updatedHabit
  }

  deleteHabit(habitId: string): boolean {
    const deleted = this.habits.delete(habitId)
    if (deleted) {
      this.entries.delete(habitId)
      this.streaks.delete(habitId)
      this.saveData()
    }
    return deleted
  }

  getHabits(): Habit[] {
    return Array.from(this.habits.values()).filter(h => h.isActive)
  }

  getHabit(habitId: string): Habit | undefined {
    return this.habits.get(habitId)
  }

  // Entry Management
  recordHabitEntry(entry: Omit<HabitEntry, 'id' | 'timestamp'>): HabitEntry {
    const newEntry: HabitEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    const habitEntries = this.entries.get(entry.habitId) || []

    // Remove existing entry for the same date
    const filteredEntries = habitEntries.filter(e => e.date !== entry.date)
    filteredEntries.push(newEntry)

    this.entries.set(entry.habitId, filteredEntries)
    this.updateStreak(entry.habitId)
    this.saveData()
    this.generateInsights()

    return newEntry
  }

  getHabitEntries(habitId: string, days: number = 30): HabitEntry[] {
    const entries = this.entries.get(habitId) || []
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return entries
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Streak Calculation
  private updateStreak(habitId: string): void {
    const habit = this.habits.get(habitId)
    const entries = this.entries.get(habitId) || []

    if (!habit) return

    const streak = this.streaks.get(habitId) || {
      habitId,
      currentStreak: 0,
      longestStreak: 0
    }

    // Sort entries by date
    const sortedEntries = entries.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let currentStreak = 0
    let checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)

    // Calculate current streak
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)

      if (entryDate.getTime() === checkDate.getTime()) {
        if (this.isHabitCompleted(habit, entry)) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      } else if (entryDate.getTime() < checkDate.getTime()) {
        break
      }
    }

    streak.currentStreak = currentStreak
    streak.longestStreak = Math.max(streak.longestStreak, currentStreak)
    streak.lastCompletedDate = sortedEntries.length > 0 ? sortedEntries[0].date : undefined

    this.streaks.set(habitId, streak)
  }

  private isHabitCompleted(habit: Habit, entry: HabitEntry): boolean {
    return entry.value >= habit.targetValue
  }

  getHabitStreak(habitId: string): HabitStreak | undefined {
    return this.streaks.get(habitId)
  }

  // Analytics & Insights
  generateInsights(): void {
    this.insights = []

    for (const [habitId, habit] of this.habits) {
      const entries = this.entries.get(habitId) || []
      if (entries.length < 7) continue // Need at least a week of data

      // Success pattern analysis
      this.analyzeSuccessPatterns(habit, entries)

      // Mood correlation
      this.analyzeMoodCorrelation(habit, entries)

      // Optimal timing
      this.analyzeOptimalTiming(habit, entries)

      // Difficulty trends
      this.analyzeDifficultyTrends(habit, entries)
    }

    this.generatePersonalizedRecommendations()
  }

  private analyzeSuccessPatterns(habit: Habit, entries: HabitEntry[]): void {
    const completedEntries = entries.filter(e => e.value >= habit.targetValue)
    const successRate = completedEntries.length / entries.length

    if (successRate > 0.8) {
      this.insights.push({
        habitId: habit.id,
        type: 'success_pattern',
        title: `${habit.name} 성공률 높음`,
        description: `${(successRate * 100).toFixed(0)}% 성공률을 보이고 있습니다.`,
        recommendation: '현재 패턴을 유지하고 새로운 도전을 고려해보세요.',
        confidence: 0.9
      })
    } else if (successRate < 0.4) {
      this.insights.push({
        habitId: habit.id,
        type: 'failure_pattern',
        title: `${habit.name} 개선 필요`,
        description: `${(successRate * 100).toFixed(0)}% 성공률로 목표 달성이 어려워 보입니다.`,
        recommendation: '목표를 더 작은 단계로 나누거나 빈도를 조정해보세요.',
        confidence: 0.8
      })
    }
  }

  private analyzeMoodCorrelation(habit: Habit, entries: HabitEntry[]): void {
    const moodEntries = entries.filter(e => e.mood)
    if (moodEntries.length < 5) return

    const moodScores = {
      'very_bad': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'very_good': 5
    }

    const avgMoodWhenCompleted = moodEntries
      .filter(e => e.value >= habit.targetValue)
      .reduce((sum, e) => sum + moodScores[e.mood!], 0) / moodEntries.filter(e => e.value >= habit.targetValue).length

    const avgMoodWhenFailed = moodEntries
      .filter(e => e.value < habit.targetValue)
      .reduce((sum, e) => sum + moodScores[e.mood!], 0) / moodEntries.filter(e => e.value < habit.targetValue).length

    if (avgMoodWhenCompleted - avgMoodWhenFailed > 0.5) {
      this.insights.push({
        habitId: habit.id,
        type: 'mood_correlation',
        title: '기분과 습관 성공률 연관성',
        description: '좋은 기분일 때 습관 달성률이 높습니다.',
        recommendation: '기분이 좋지 않은 날에는 목표를 낮춰서라도 꾸준히 실행해보세요.',
        confidence: 0.7
      })
    }
  }

  private analyzeOptimalTiming(habit: Habit, entries: HabitEntry[]): void {
    // This would analyze timestamp data to find optimal times
    // For now, providing a general recommendation
    const recentEntries = entries.slice(0, 14)
    const morningEntries = recentEntries.filter(e => {
      const hour = new Date(e.timestamp).getHours()
      return hour >= 6 && hour <= 10
    })

    if (morningEntries.length / recentEntries.length > 0.6) {
      this.insights.push({
        habitId: habit.id,
        type: 'optimal_time',
        title: '아침 시간이 최적',
        description: '아침 시간에 가장 높은 성공률을 보입니다.',
        recommendation: '아침 루틴에 이 습관을 포함시켜보세요.',
        confidence: 0.6
      })
    }
  }

  private analyzeDifficultyTrends(habit: Habit, entries: HabitEntry[]): void {
    const difficultyEntries = entries.filter(e => e.difficulty).slice(0, 14)
    if (difficultyEntries.length < 7) return

    const difficultyScores = {
      'very_easy': 1, 'easy': 2, 'medium': 3, 'hard': 4, 'very_hard': 5
    }

    const recentAvgDifficulty = difficultyEntries.slice(0, 7)
      .reduce((sum, e) => sum + difficultyScores[e.difficulty!], 0) / 7

    const olderAvgDifficulty = difficultyEntries.slice(7)
      .reduce((sum, e) => sum + difficultyScores[e.difficulty!], 0) / (difficultyEntries.length - 7)

    if (recentAvgDifficulty < olderAvgDifficulty - 0.5) {
      this.insights.push({
        habitId: habit.id,
        type: 'difficulty_trend',
        title: '난이도 감소 추세',
        description: '시간이 지날수록 더 쉬워지고 있습니다.',
        recommendation: '목표를 높이거나 새로운 도전을 추가해보세요.',
        confidence: 0.8
      })
    }
  }

  generatePersonalizedRecommendations(): void {
    this.recommendations = []

    // Analyze overall habit completion rates
    const habitStats = Array.from(this.habits.values()).map(habit => {
      const entries = this.entries.get(habit.id) || []
      const recentEntries = entries.slice(0, 14)
      const completionRate = recentEntries.length > 0
        ? recentEntries.filter(e => e.value >= habit.targetValue).length / recentEntries.length
        : 0

      return { habit, completionRate, entries: recentEntries }
    })

    // Recommend new habits based on successful categories
    const successfulCategories = habitStats
      .filter(stat => stat.completionRate > 0.7)
      .map(stat => stat.habit.category)

    const categoryHabits = {
      'health': [
        { name: '물 마시기', targetValue: 8, unit: '잔', description: '하루 8잔의 물 마시기' },
        { name: '운동하기', targetValue: 30, unit: '분', description: '매일 30분 운동하기' },
        { name: '충분한 수면', targetValue: 7, unit: '시간', description: '하루 7시간 이상 수면' }
      ],
      'productivity': [
        { name: '독서하기', targetValue: 30, unit: '분', description: '매일 30분 독서하기' },
        { name: '일기 쓰기', targetValue: 1, unit: '편', description: '매일 일기 쓰기' },
        { name: '계획 세우기', targetValue: 1, unit: '번', description: '다음 날 계획 세우기' }
      ]
    }

    // Add new habit recommendations
    successfulCategories.forEach(category => {
      const existingHabits = habitStats.filter(stat => stat.habit.category === category)
      const availableHabits = categoryHabits[category] || []

      availableHabits.forEach(habitTemplate => {
        const exists = existingHabits.some(stat =>
          stat.habit.name.toLowerCase().includes(habitTemplate.name.toLowerCase())
        )

        if (!exists) {
          this.recommendations.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'new_habit',
            title: `새 습관 추천: ${habitTemplate.name}`,
            description: habitTemplate.description,
            habit: {
              name: habitTemplate.name,
              category: category,
              targetValue: habitTemplate.targetValue,
              unit: habitTemplate.unit,
              frequency: 'daily' as const,
              priority: 'medium' as const,
              color: '#3b82f6',
              icon: '⭐'
            },
            priority: 3,
            reasoning: `${category} 카테고리에서 높은 성공률을 보이고 있습니다.`,
            expectedImprovement: '전반적인 건강과 생산성 향상',
            createdAt: new Date()
          })
        }
      })
    })

    // Recommend adjustments for struggling habits
    habitStats.filter(stat => stat.completionRate < 0.4).forEach(stat => {
      this.recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'habit_adjustment',
        title: `${stat.habit.name} 목표 조정`,
        description: `현재 목표가 너무 높을 수 있습니다. 더 작은 목표로 시작해보세요.`,
        priority: 4,
        reasoning: `최근 성공률이 ${(stat.completionRate * 100).toFixed(0)}%로 낮습니다.`,
        expectedImprovement: '꾸준한 실행을 통한 습관 정착',
        createdAt: new Date()
      })
    })
  }

  getInsights(habitId?: string): HabitInsight[] {
    return habitId
      ? this.insights.filter(insight => insight.habitId === habitId)
      : this.insights
  }

  getRecommendations(): PersonalizedRecommendation[] {
    return this.recommendations.sort((a, b) => b.priority - a.priority)
  }

  acceptRecommendation(recommendationId: string): boolean {
    const recommendation = this.recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return false

    if (recommendation.type === 'new_habit' && recommendation.habit) {
      this.createHabit(recommendation.habit as Omit<Habit, 'id' | 'createdAt'>)
    }

    // Remove accepted recommendation
    this.recommendations = this.recommendations.filter(r => r.id !== recommendationId)
    this.saveData()
    return true
  }

  dismissRecommendation(recommendationId: string): boolean {
    this.recommendations = this.recommendations.filter(r => r.id !== recommendationId)
    this.saveData()
    return true
  }

  // Analytics Methods
  getHabitAnalytics(habitId: string, days: number = 30) {
    const entries = this.getHabitEntries(habitId, days)
    const habit = this.habits.get(habitId)

    if (!habit) return null

    const completedDays = entries.filter(e => e.value >= habit.targetValue).length
    const completionRate = entries.length > 0 ? completedDays / entries.length : 0

    const streak = this.getHabitStreak(habitId)

    return {
      completionRate,
      completedDays,
      totalDays: entries.length,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      averageValue: entries.length > 0
        ? entries.reduce((sum, e) => sum + e.value, 0) / entries.length
        : 0,
      entries
    }
  }

  getDashboardData() {
    const habits = this.getHabits()
    const today = new Date().toISOString().split('T')[0]

    const todayEntries = habits.map(habit => {
      const entries = this.entries.get(habit.id) || []
      const todayEntry = entries.find(e => e.date === today)
      return {
        habit,
        entry: todayEntry,
        completed: todayEntry ? todayEntry.value >= habit.targetValue : false
      }
    })

    const totalHabits = habits.length
    const completedToday = todayEntries.filter(t => t.completed).length
    const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0

    return {
      totalHabits,
      completedToday,
      completionRate,
      todayEntries,
      insights: this.getInsights(),
      recommendations: this.getRecommendations().slice(0, 3)
    }
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        habits: Array.from(this.habits.entries()),
        entries: Array.from(this.entries.entries()),
        streaks: Array.from(this.streaks.entries()),
        insights: this.insights,
        recommendations: this.recommendations
      }
      localStorage.setItem('jihyung-habit-tracking', JSON.stringify(data))
    } catch (error) {
      console.error('습관 데이터 저장 실패:', error)
    }
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('jihyung-habit-tracking')
      if (!saved) return

      const data = JSON.parse(saved)

      this.habits = new Map(data.habits || [])
      this.entries = new Map(data.entries || [])
      this.streaks = new Map(data.streaks || [])
      this.insights = data.insights || []
      this.recommendations = data.recommendations || []

      // Convert date strings back to Date objects
      this.habits.forEach(habit => {
        habit.createdAt = new Date(habit.createdAt)
      })

      this.recommendations.forEach(rec => {
        rec.createdAt = new Date(rec.createdAt)
      })

    } catch (error) {
      console.error('습관 데이터 로드 실패:', error)
    }
  }

  // Export data for external analysis
  exportData() {
    return {
      habits: Array.from(this.habits.values()),
      entries: Array.from(this.entries.entries()).flatMap(([habitId, entries]) =>
        entries.map(entry => ({ ...entry, habitId }))
      ),
      insights: this.insights,
      recommendations: this.recommendations
    }
  }
}

// Export singleton instance
export const habitTrackingService = new HabitTrackingService()

export default habitTrackingService