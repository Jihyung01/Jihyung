export interface EmotionData {
  id: string
  timestamp: number
  date: string
  source: 'note' | 'task' | 'manual' | 'voice' | 'habit' | 'calendar'
  sourceId?: string
  content: string
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
    disgust: number
    trust: number
    anticipation: number
  }
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number // -1 to 1
  intensity: number // 0 to 1
  confidence: number // 0 to 1
  context?: {
    location?: string
    weather?: string
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    workDay: boolean
    tags?: string[]
  }
}

export interface ProductivityMetrics {
  tasksCompleted: number
  notesCreated: number
  eventsAttended: number
  focusTime: number // minutes
  breakTime: number // minutes
  qualityScore: number // 0 to 10
  efficiencyScore: number // 0 to 10
}

export interface EmotionProductivityCorrelation {
  date: string
  emotion: EmotionData
  productivity: ProductivityMetrics
  correlation: {
    tasksVsEmotion: number
    qualityVsEmotion: number
    focusVsEmotion: number
    overallCorrelation: number
  }
}

export interface EmotionInsight {
  id: string
  type: 'pattern' | 'trigger' | 'recommendation' | 'alert' | 'trend'
  title: string
  description: string
  insight: string
  recommendation?: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  data?: any
  createdAt: Date
}

export interface MoodForecast {
  date: string
  predictedMood: number // -1 to 1
  confidence: number
  factors: string[]
  recommendations: string[]
}

class EmotionAnalyticsService {
  private emotionData: EmotionData[] = []
  private productivityData: Map<string, ProductivityMetrics> = new Map()
  private insights: EmotionInsight[] = []
  private correlations: EmotionProductivityCorrelation[] = []

  // Emotion lexicon for Korean text analysis
  private emotionLexicon = {
    joy: ['기쁘', '행복', '즐거', '신나', '좋', '훌륭', '완벽', '성공', '달성', '만족', '웃음', '사랑'],
    sadness: ['슬프', '우울', '실망', '좌절', '포기', '힘들', '지쳐', '눈물', '비관', '절망'],
    anger: ['화', '짜증', '분노', '격분', '열받', '귀찮', '싫', '미워', '원망', '불만'],
    fear: ['무서', '두려', '걱정', '불안', '공포', '긴장', '스트레스', '압박', '부담'],
    surprise: ['놀라', '깜짝', '의외', '예상외', '갑자기', '순간'],
    disgust: ['역겨', '싫어', '불쾌', '구역', '지겨'],
    trust: ['믿', '신뢰', '확신', '안전', '든든', '의지'],
    anticipation: ['기대', '설레', '궁금', '바라', '희망', '꿈꾸', '계획']
  }

  private sentimentLexicon = {
    positive: ['좋', '훌륭', '완벽', '성공', '달성', '만족', '기쁘', '행복', '즐거', '신나', '사랑', '최고', '멋지', '대단'],
    negative: ['나쁘', '싫', '힘들', '어려', '실패', '실망', '좌절', '화', '짜증', '우울', '슬프', '무서', '두려', '걱정']
  }

  constructor() {
    this.loadData()
  }

  // Text Analysis
  analyzeText(text: string, source: EmotionData['source'], sourceId?: string): EmotionData {
    const emotions = this.extractEmotions(text)
    const sentiment = this.analyzeSentiment(text)
    const intensity = this.calculateIntensity(text, emotions)
    const confidence = this.calculateConfidence(text, emotions, sentiment)

    const emotionData: EmotionData = {
      id: `emotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      source,
      sourceId,
      content: text,
      emotions,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.score,
      intensity,
      confidence,
      context: this.getContext()
    }

    this.emotionData.push(emotionData)
    this.saveData()
    this.generateInsights()

    return emotionData
  }

  private extractEmotions(text: string): EmotionData['emotions'] {
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0
    }

    const normalizedText = text.toLowerCase()

    Object.entries(this.emotionLexicon).forEach(([emotion, keywords]) => {
      let count = 0
      keywords.forEach(keyword => {
        const matches = (normalizedText.match(new RegExp(keyword, 'g')) || []).length
        count += matches
      })

      // Normalize score (0 to 1)
      emotions[emotion as keyof typeof emotions] = Math.min(count / keywords.length, 1)
    })

    // Apply some normalization to prevent all zeros
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0)
    if (total === 0) {
      // Default neutral state
      emotions.trust = 0.3
      emotions.anticipation = 0.2
    } else {
      // Normalize to ensure they sum to reasonable values
      const multiplier = 1 / total
      Object.keys(emotions).forEach(key => {
        emotions[key as keyof typeof emotions] *= multiplier
      })
    }

    return emotions
  }

  private analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
    const normalizedText = text.toLowerCase()
    let positiveScore = 0
    let negativeScore = 0

    this.sentimentLexicon.positive.forEach(word => {
      const matches = (normalizedText.match(new RegExp(word, 'g')) || []).length
      positiveScore += matches
    })

    this.sentimentLexicon.negative.forEach(word => {
      const matches = (normalizedText.match(new RegExp(word, 'g')) || []).length
      negativeScore += matches
    })

    const totalWords = text.split(' ').length
    const normalizedPositive = positiveScore / totalWords
    const normalizedNegative = negativeScore / totalWords

    const score = normalizedPositive - normalizedNegative
    const sentiment = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'

    return {
      sentiment,
      score: Math.max(-1, Math.min(1, score * 5)) // Scale to -1 to 1
    }
  }

  private calculateIntensity(text: string, emotions: EmotionData['emotions']): number {
    // Calculate based on emotion strength and text characteristics
    const maxEmotion = Math.max(...Object.values(emotions))
    const exclamationMarks = (text.match(/!/g) || []).length
    const questionMarks = (text.match(/\?/g) || []).length
    const capsWords = (text.match(/[A-Z]{2,}/g) || []).length

    const textIntensity = Math.min(1, (exclamationMarks + questionMarks + capsWords) / 10)

    return Math.min(1, (maxEmotion + textIntensity) / 2)
  }

  private calculateConfidence(text: string, emotions: EmotionData['emotions'], sentiment: any): number {
    // Base confidence on text length and emotion clarity
    const wordCount = text.split(' ').length
    const lengthFactor = Math.min(1, wordCount / 10) // Higher confidence with more words

    const emotionClarity = Math.max(...Object.values(emotions))
    const sentimentClarity = Math.abs(sentiment.score)

    return Math.min(1, (lengthFactor + emotionClarity + sentimentClarity) / 3)
  }

  private getContext(): EmotionData['context'] {
    const now = new Date()
    const hour = now.getHours()

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    if (hour >= 5 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening'
    else timeOfDay = 'night'

    const workDay = now.getDay() >= 1 && now.getDay() <= 5

    return {
      timeOfDay,
      workDay
    }
  }

  // Productivity Tracking
  recordProductivityMetrics(date: string, metrics: ProductivityMetrics): void {
    this.productivityData.set(date, metrics)
    this.saveData()
    this.analyzeCorrelations()
  }

  private analyzeCorrelations(): void {
    this.correlations = []

    // Get recent data for correlation analysis
    const recent30Days = Array.from(this.productivityData.entries())
      .filter(([date]) => {
        const diffTime = Date.now() - new Date(date).getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        return diffDays <= 30
      })

    recent30Days.forEach(([date, productivity]) => {
      const dayEmotions = this.emotionData.filter(e => e.date === date)

      if (dayEmotions.length > 0) {
        // Calculate average emotion for the day
        const avgEmotion = this.calculateDayAverageEmotion(dayEmotions)

        const correlation: EmotionProductivityCorrelation = {
          date,
          emotion: avgEmotion,
          productivity,
          correlation: this.calculateCorrelation(avgEmotion, productivity)
        }

        this.correlations.push(correlation)
      }
    })

    this.generateInsights()
  }

  private calculateDayAverageEmotion(emotions: EmotionData[]): EmotionData {
    const avgEmotions = {
      joy: 0, sadness: 0, anger: 0, fear: 0,
      surprise: 0, disgust: 0, trust: 0, anticipation: 0
    }

    let avgSentimentScore = 0
    let avgIntensity = 0

    emotions.forEach(emotion => {
      Object.keys(avgEmotions).forEach(key => {
        avgEmotions[key as keyof typeof avgEmotions] += emotion.emotions[key as keyof typeof avgEmotions]
      })
      avgSentimentScore += emotion.sentimentScore
      avgIntensity += emotion.intensity
    })

    const count = emotions.length
    Object.keys(avgEmotions).forEach(key => {
      avgEmotions[key as keyof typeof avgEmotions] /= count
    })
    avgSentimentScore /= count
    avgIntensity /= count

    return {
      id: `avg-${emotions[0].date}`,
      timestamp: emotions[0].timestamp,
      date: emotions[0].date,
      source: 'manual',
      content: `Day average from ${count} entries`,
      emotions: avgEmotions,
      sentiment: avgSentimentScore > 0.1 ? 'positive' : avgSentimentScore < -0.1 ? 'negative' : 'neutral',
      sentimentScore: avgSentimentScore,
      intensity: avgIntensity,
      confidence: emotions.reduce((sum, e) => sum + e.confidence, 0) / count
    }
  }

  private calculateCorrelation(emotion: EmotionData, productivity: ProductivityMetrics): any {
    // Simple correlation calculations
    const emotionScore = emotion.sentimentScore
    const joyLevel = emotion.emotions.joy
    const stressLevel = emotion.emotions.fear + emotion.emotions.anger

    return {
      tasksVsEmotion: this.correlateValues(productivity.tasksCompleted / 10, emotionScore),
      qualityVsEmotion: this.correlateValues(productivity.qualityScore / 10, emotionScore),
      focusVsEmotion: this.correlateValues(productivity.focusTime / 480, 1 - stressLevel), // Assuming 8-hour workday
      overallCorrelation: this.correlateValues(
        (productivity.efficiencyScore + productivity.qualityScore) / 20,
        emotionScore
      )
    }
  }

  private correlateValues(x: number, y: number): number {
    // Simple correlation between two normalized values
    return (x + y) / 2 - Math.abs(x - y) / 2
  }

  // Insights Generation
  generateInsights(): void {
    this.insights = []

    this.analyzeEmotionPatterns()
    this.identifyTriggers()
    this.generateRecommendations()
    this.detectAnomalies()
    this.analyzeTrends()

    this.saveData()
  }

  private analyzeEmotionPatterns(): void {
    const recentEmotions = this.getRecentEmotions(14) // Last 2 weeks

    if (recentEmotions.length < 7) return

    // Time-based patterns
    const morningEmotions = recentEmotions.filter(e => e.context?.timeOfDay === 'morning')
    const eveningEmotions = recentEmotions.filter(e => e.context?.timeOfDay === 'evening')

    if (morningEmotions.length > 3 && eveningEmotions.length > 3) {
      const morningAvg = this.calculateAverageEmotion(morningEmotions)
      const eveningAvg = this.calculateAverageEmotion(eveningEmotions)

      if (morningAvg.sentimentScore - eveningAvg.sentimentScore > 0.3) {
        this.insights.push({
          id: `pattern-morning-${Date.now()}`,
          type: 'pattern',
          title: '아침형 긍정 패턴',
          description: '아침 시간에 더 긍정적인 감정을 보입니다.',
          insight: `아침 감정점수: ${morningAvg.sentimentScore.toFixed(2)}, 저녁 감정점수: ${eveningAvg.sentimentScore.toFixed(2)}`,
          recommendation: '중요한 일들을 아침 시간에 계획해보세요.',
          confidence: 0.8,
          priority: 'medium',
          createdAt: new Date()
        })
      }
    }

    // Work day vs weekend patterns
    const workDayEmotions = recentEmotions.filter(e => e.context?.workDay)
    const weekendEmotions = recentEmotions.filter(e => !e.context?.workDay)

    if (workDayEmotions.length > 3 && weekendEmotions.length > 2) {
      const workAvg = this.calculateAverageEmotion(workDayEmotions)
      const weekendAvg = this.calculateAverageEmotion(weekendEmotions)

      if (weekendAvg.sentimentScore - workAvg.sentimentScore > 0.4) {
        this.insights.push({
          id: `pattern-workstress-${Date.now()}`,
          type: 'pattern',
          title: '업무 스트레스 패턴',
          description: '평일에 스트레스 수준이 높습니다.',
          insight: `평일 감정점수: ${workAvg.sentimentScore.toFixed(2)}, 주말 감정점수: ${weekendAvg.sentimentScore.toFixed(2)}`,
          recommendation: '평일 스트레스 관리 방법을 찾아보세요. 짧은 휴식이나 명상을 시도해보세요.',
          confidence: 0.9,
          priority: 'high',
          createdAt: new Date()
        })
      }
    }
  }

  private identifyTriggers(): void {
    const recentEmotions = this.getRecentEmotions(30)
    const negativeEmotions = recentEmotions.filter(e => e.sentimentScore < -0.3)

    if (negativeEmotions.length > 5) {
      // Analyze common sources of negative emotions
      const sources = negativeEmotions.reduce((acc, emotion) => {
        acc[emotion.source] = (acc[emotion.source] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topSource = Object.entries(sources).sort(([,a], [,b]) => b - a)[0]

      if (topSource && topSource[1] > 2) {
        this.insights.push({
          id: `trigger-${topSource[0]}-${Date.now()}`,
          type: 'trigger',
          title: `${topSource[0]} 관련 스트레스`,
          description: `${topSource[0]} 활동 시 부정적 감정이 자주 발생합니다.`,
          insight: `최근 ${negativeEmotions.length}개의 부정적 감정 중 ${topSource[1]}개가 ${topSource[0]}와 관련됩니다.`,
          recommendation: `${topSource[0]} 활동 전후로 스트레스 관리 방법을 적용해보세요.`,
          confidence: 0.7,
          priority: 'high',
          createdAt: new Date()
        })
      }
    }
  }

  private generateRecommendations(): void {
    const correlations = this.correlations.slice(-14) // Last 2 weeks

    if (correlations.length > 7) {
      const avgCorrelation = correlations.reduce((sum, c) => sum + c.correlation.overallCorrelation, 0) / correlations.length

      if (avgCorrelation < 0.3) {
        this.insights.push({
          id: `rec-emotion-productivity-${Date.now()}`,
          type: 'recommendation',
          title: '감정-생산성 연관성 개선',
          description: '감정 상태와 생산성 간의 연관성이 낮습니다.',
          insight: `평균 상관관계: ${avgCorrelation.toFixed(2)}`,
          recommendation: '감정 관리 기법을 학습하여 생산성을 향상시켜보세요. 명상, 운동, 또는 취미 활동을 시도해보세요.',
          confidence: 0.6,
          priority: 'medium',
          createdAt: new Date()
        })
      }

      // High stress correlation with low productivity
      const highStressDays = correlations.filter(c =>
        c.emotion.emotions.fear + c.emotion.emotions.anger > 0.6 &&
        c.productivity.efficiencyScore < 5
      )

      if (highStressDays.length > 3) {
        this.insights.push({
          id: `rec-stress-management-${Date.now()}`,
          type: 'recommendation',
          title: '스트레스 관리 필요',
          description: '스트레스가 높은 날에 생산성이 크게 저하됩니다.',
          insight: `최근 ${highStressDays.length}일간 고스트레스-저생산성 패턴을 보입니다.`,
          recommendation: '스트레스 해소법을 찾아 실행해보세요: 깊은 호흡, 짧은 산책, 음악 감상 등',
          confidence: 0.8,
          priority: 'high',
          createdAt: new Date()
        })
      }
    }
  }

  private detectAnomalies(): void {
    const recentEmotions = this.getRecentEmotions(7)

    if (recentEmotions.length > 5) {
      const avgSentiment = recentEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / recentEmotions.length
      const avgIntensity = recentEmotions.reduce((sum, e) => sum + e.intensity, 0) / recentEmotions.length

      // Sudden mood drop
      const lastDayEmotions = recentEmotions.filter(e => {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000
        return e.timestamp > dayAgo
      })

      if (lastDayEmotions.length > 0) {
        const lastDayAvg = lastDayEmotions.reduce((sum, e) => sum + e.sentimentScore, 0) / lastDayEmotions.length

        if (avgSentiment > 0.2 && lastDayAvg < -0.3) {
          this.insights.push({
            id: `alert-mood-drop-${Date.now()}`,
            type: 'alert',
            title: '갑작스러운 기분 변화',
            description: '최근 기분이 급격히 나빠졌습니다.',
            insight: `평균 감정점수: ${avgSentiment.toFixed(2)}, 어제 감정점수: ${lastDayAvg.toFixed(2)}`,
            recommendation: '자신을 돌보는 시간을 갖고, 필요시 주변 사람들과 대화해보세요.',
            confidence: 0.7,
            priority: 'urgent',
            createdAt: new Date()
          })
        }
      }

      // Consistent high intensity
      if (avgIntensity > 0.8) {
        this.insights.push({
          id: `alert-high-intensity-${Date.now()}`,
          type: 'alert',
          title: '지속적인 고강도 감정',
          description: '최근 감정의 강도가 지속적으로 높습니다.',
          insight: `평균 감정 강도: ${avgIntensity.toFixed(2)}`,
          recommendation: '감정 조절을 위한 휴식과 진정 활동이 필요할 수 있습니다.',
          confidence: 0.6,
          priority: 'medium',
          createdAt: new Date()
        })
      }
    }
  }

  private analyzeTrends(): void {
    const monthlyData = this.getRecentEmotions(30)

    if (monthlyData.length > 20) {
      // Divide into weeks and analyze trend
      const weeks = [
        monthlyData.filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000),
        monthlyData.filter(e =>
          e.timestamp > Date.now() - 14 * 24 * 60 * 60 * 1000 &&
          e.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000
        ),
        monthlyData.filter(e =>
          e.timestamp > Date.now() - 21 * 24 * 60 * 60 * 1000 &&
          e.timestamp <= Date.now() - 14 * 24 * 60 * 60 * 1000
        ),
        monthlyData.filter(e =>
          e.timestamp > Date.now() - 28 * 24 * 60 * 60 * 1000 &&
          e.timestamp <= Date.now() - 21 * 24 * 60 * 60 * 1000
        )
      ]

      const weeklyAverages = weeks.map(week => {
        if (week.length === 0) return 0
        return week.reduce((sum, e) => sum + e.sentimentScore, 0) / week.length
      }).filter(avg => avg !== 0)

      if (weeklyAverages.length > 2) {
        const trend = weeklyAverages[0] - weeklyAverages[weeklyAverages.length - 1]

        if (trend > 0.3) {
          this.insights.push({
            id: `trend-improving-${Date.now()}`,
            type: 'trend',
            title: '감정 상태 개선 추세',
            description: '최근 몇 주간 감정 상태가 개선되고 있습니다.',
            insight: `주간 평균 변화: +${trend.toFixed(2)}`,
            recommendation: '현재의 긍정적인 변화를 유지하는 방법을 찾아보세요.',
            confidence: 0.7,
            priority: 'low',
            createdAt: new Date()
          })
        } else if (trend < -0.3) {
          this.insights.push({
            id: `trend-declining-${Date.now()}`,
            type: 'trend',
            title: '감정 상태 하향 추세',
            description: '최근 몇 주간 감정 상태가 하향세입니다.',
            insight: `주간 평균 변화: ${trend.toFixed(2)}`,
            recommendation: '스트레스 요인을 파악하고 자기 관리에 더 신경써보세요.',
            confidence: 0.8,
            priority: 'high',
            createdAt: new Date()
          })
        }
      }
    }
  }

  // Helper Methods
  private getRecentEmotions(days: number): EmotionData[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return this.emotionData.filter(e => e.timestamp > cutoff)
  }

  private calculateAverageEmotion(emotions: EmotionData[]): EmotionData {
    if (emotions.length === 0) throw new Error('No emotions to average')

    const avgEmotions = {
      joy: 0, sadness: 0, anger: 0, fear: 0,
      surprise: 0, disgust: 0, trust: 0, anticipation: 0
    }

    let avgSentimentScore = 0
    let avgIntensity = 0

    emotions.forEach(emotion => {
      Object.keys(avgEmotions).forEach(key => {
        avgEmotions[key as keyof typeof avgEmotions] += emotion.emotions[key as keyof typeof avgEmotions]
      })
      avgSentimentScore += emotion.sentimentScore
      avgIntensity += emotion.intensity
    })

    const count = emotions.length
    Object.keys(avgEmotions).forEach(key => {
      avgEmotions[key as keyof typeof avgEmotions] /= count
    })
    avgSentimentScore /= count
    avgIntensity /= count

    return {
      id: 'average',
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      source: 'manual',
      content: `Average of ${count} emotions`,
      emotions: avgEmotions,
      sentiment: avgSentimentScore > 0.1 ? 'positive' : avgSentimentScore < -0.1 ? 'negative' : 'neutral',
      sentimentScore: avgSentimentScore,
      intensity: avgIntensity,
      confidence: emotions.reduce((sum, e) => sum + e.confidence, 0) / count
    }
  }

  // Public API
  getEmotionData(days: number = 30): EmotionData[] {
    return this.getRecentEmotions(days)
  }

  getInsights(): EmotionInsight[] {
    return this.insights.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  getCorrelations(days: number = 30): EmotionProductivityCorrelation[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return this.correlations.filter(c => new Date(c.date).getTime() > cutoff)
  }

  getDashboardData() {
    const recentEmotions = this.getRecentEmotions(7)
    const todayEmotions = this.getRecentEmotions(1)

    return {
      currentMood: todayEmotions.length > 0 ? this.calculateAverageEmotion(todayEmotions) : null,
      weeklyTrend: recentEmotions.length > 0 ? this.calculateAverageEmotion(recentEmotions) : null,
      insights: this.getInsights().slice(0, 5),
      correlations: this.getCorrelations(14),
      emotionDistribution: this.calculateEmotionDistribution(recentEmotions),
      productivityCorrelation: this.calculateOverallCorrelation()
    }
  }

  private calculateEmotionDistribution(emotions: EmotionData[]) {
    if (emotions.length === 0) return null

    const distribution = {
      joy: 0, sadness: 0, anger: 0, fear: 0,
      surprise: 0, disgust: 0, trust: 0, anticipation: 0
    }

    emotions.forEach(emotion => {
      Object.keys(distribution).forEach(key => {
        distribution[key as keyof typeof distribution] += emotion.emotions[key as keyof typeof distribution]
      })
    })

    Object.keys(distribution).forEach(key => {
      distribution[key as keyof typeof distribution] /= emotions.length
    })

    return distribution
  }

  private calculateOverallCorrelation(): number {
    if (this.correlations.length === 0) return 0

    const recent = this.correlations.slice(-14)
    return recent.reduce((sum, c) => sum + c.correlation.overallCorrelation, 0) / recent.length
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        emotionData: this.emotionData,
        productivityData: Array.from(this.productivityData.entries()),
        insights: this.insights,
        correlations: this.correlations
      }
      localStorage.setItem('jihyung-emotion-analytics', JSON.stringify(data))
    } catch (error) {
      console.error('감정 분석 데이터 저장 실패:', error)
    }
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('jihyung-emotion-analytics')
      if (!saved) return

      const data = JSON.parse(saved)

      this.emotionData = data.emotionData || []
      this.productivityData = new Map(data.productivityData || [])
      this.insights = (data.insights || []).map((insight: any) => ({
        ...insight,
        createdAt: new Date(insight.createdAt)
      }))
      this.correlations = data.correlations || []

    } catch (error) {
      console.error('감정 분석 데이터 로드 실패:', error)
    }
  }

  // Export for external analysis
  exportData() {
    return {
      emotionData: this.emotionData,
      productivityData: Array.from(this.productivityData.entries()),
      insights: this.insights,
      correlations: this.correlations
    }
  }
}

// Export singleton instance
export const emotionAnalyticsService = new EmotionAnalyticsService()

export default emotionAnalyticsService