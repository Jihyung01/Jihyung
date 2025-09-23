export interface BiometricData {
  id: string
  timestamp: number
  date: string
  heartRate?: number // bpm
  heartRateVariability?: number // RMSSD in ms
  stepCount?: number
  caloriesBurned?: number
  sleepDuration?: number // hours
  sleepQuality?: number // 0-100 score
  stressLevel?: number // 0-100, higher = more stressed
  energyLevel?: number // 0-100, higher = more energetic
  mood?: number // 0-100, higher = better mood
  focusLevel?: number // 0-100, self-reported
  hydrationLevel?: number // ml of water consumed
  screenTime?: number // hours
  physicalActivity?: {
    type: string
    duration: number // minutes
    intensity: 'low' | 'moderate' | 'high'
  }[]
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  weather?: {
    temperature: number
    humidity: number
    condition: string
  }
  manualEntry: boolean
}

export interface HealthMetrics {
  date: string
  averageHeartRate?: number
  restingHeartRate?: number
  activeHeartRate?: number
  hrvScore?: number
  stepsGoalAchieved?: boolean
  sleepEfficiency?: number
  recoveryScore?: number // 0-100
  readinessScore?: number // 0-100 (combination of metrics)
}

export interface ProductivityCorrelation {
  date: string
  biometric: BiometricData
  productivity: {
    tasksCompleted: number
    focusTime: number
    qualityScore: number
    efficiencyScore: number
    creativityScore: number
  }
  correlations: {
    sleepVsProductivity: number
    heartRateVsFocus: number
    stepsVsEnergy: number
    moodVsCreativity: number
    overallCorrelation: number
  }
}

export interface BiometricInsight {
  id: string
  type: 'pattern' | 'recommendation' | 'alert' | 'trend' | 'optimization'
  title: string
  description: string
  insight: string
  actionable: boolean
  recommendations: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  confidence: number
  dataPoints: string[]
  createdAt: Date
}

export interface OptimalConditions {
  heartRateRange: { min: number; max: number }
  optimalSleepDuration: number
  optimalSteps: number
  bestWorkingHours: number[]
  optimalEnvironment: {
    temperature?: number
    humidity?: number
    lightLevel?: string
  }
}

class BiometricTrackingService {
  private biometricData: BiometricData[] = []
  private healthMetrics: Map<string, HealthMetrics> = new Map()
  private correlations: ProductivityCorrelation[] = []
  private insights: BiometricInsight[] = []
  private optimalConditions: OptimalConditions | null = null

  // Device integration support
  private isWatchConnected: boolean = false
  private isFitnessTrackerConnected: boolean = false
  private webSensorsSupported: boolean = false

  constructor() {
    this.checkDeviceSupport()
    this.loadData()
    this.requestSensorPermissions()
  }

  private checkDeviceSupport(): void {
    // Check for Web Sensors API support
    this.webSensorsSupported = 'Accelerometer' in window || 'HeartRateSensor' in window

    // Check for potential fitness device connections
    this.checkFitnessDeviceSupport()
  }

  private async checkFitnessDeviceSupport(): Promise<void> {
    // Check for Web Bluetooth API for fitness devices
    if ('bluetooth' in navigator) {
      try {
        // This is just a check, not actually connecting
        console.log('Bluetooth API available for fitness device integration')
      } catch (error) {
        console.log('Bluetooth API not available')
      }
    }

    // Check for Health API integration (future implementation)
    if ('health' in navigator) {
      console.log('Health API available')
    }
  }

  private async requestSensorPermissions(): Promise<void> {
    try {
      // Request motion sensors permission
      if ('DeviceMotionEvent' in window && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission === 'granted') {
          this.initializeMotionTracking()
        }
      }

      // Request location permission for environmental correlation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => console.log('Location permission granted'),
          () => console.log('Location permission denied')
        )
      }
    } catch (error) {
      console.error('Permission request failed:', error)
    }
  }

  private initializeMotionTracking(): void {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (event) => {
        // Basic activity detection from accelerometer
        const acceleration = event.acceleration
        if (acceleration) {
          const totalAcceleration = Math.sqrt(
            Math.pow(acceleration.x || 0, 2) +
            Math.pow(acceleration.y || 0, 2) +
            Math.pow(acceleration.z || 0, 2)
          )

          // Simple step detection (basic implementation)
          if (totalAcceleration > 2) {
            this.incrementStepCount()
          }
        }
      })
    }
  }

  private incrementStepCount(): void {
    const today = new Date().toISOString().split('T')[0]
    const todayData = this.biometricData.find(d => d.date === today)

    if (todayData) {
      todayData.stepCount = (todayData.stepCount || 0) + 1
    } else {
      this.recordBiometricData({
        stepCount: 1,
        manualEntry: false
      })
    }
  }

  // Data Recording
  recordBiometricData(data: Partial<Omit<BiometricData, 'id' | 'timestamp' | 'date'>>): BiometricData {
    const today = new Date().toISOString().split('T')[0]
    const existingData = this.biometricData.find(d => d.date === today)

    if (existingData) {
      // Update existing data
      Object.assign(existingData, data)
      existingData.timestamp = Date.now()
      this.saveData()
      return existingData
    } else {
      // Create new entry
      const newData: BiometricData = {
        id: `biometric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        date: today,
        manualEntry: data.manualEntry ?? true,
        ...data
      }

      this.biometricData.push(newData)
      this.calculateHealthMetrics(today)
      this.generateInsights()
      this.saveData()
      return newData
    }
  }

  // Automated Data Collection
  async collectEnvironmentalData(): Promise<Partial<BiometricData>> {
    const environmentalData: Partial<BiometricData> = {}

    // Location data
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          })
        })

        environmentalData.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        // Get weather data (would need API integration)
        const weather = await this.getWeatherData(position.coords.latitude, position.coords.longitude)
        if (weather) {
          environmentalData.weather = weather
        }
      } catch (error) {
        console.error('Failed to get location:', error)
      }
    }

    // Screen time tracking (using Page Visibility API)
    environmentalData.screenTime = this.calculateDailyScreenTime()

    return environmentalData
  }

  private async getWeatherData(lat: number, lon: number): Promise<BiometricData['weather'] | null> {
    // This would integrate with a weather API
    // For demo purposes, returning mock data
    return {
      temperature: 22 + Math.random() * 10, // 22-32°C
      humidity: 40 + Math.random() * 40, // 40-80%
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
    }
  }

  private calculateDailyScreenTime(): number {
    // Track screen time using Page Visibility API
    const screenTimeKey = `screen-time-${new Date().toISOString().split('T')[0]}`
    const stored = localStorage.getItem(screenTimeKey)

    if (stored) {
      const data = JSON.parse(stored)
      return data.totalTime / (1000 * 60 * 60) // Convert to hours
    }

    return 0
  }

  // Health Metrics Calculation
  private calculateHealthMetrics(date: string): void {
    const dayData = this.biometricData.filter(d => d.date === date)
    if (dayData.length === 0) return

    const latestData = dayData[dayData.length - 1]
    const heartRates = dayData.filter(d => d.heartRate).map(d => d.heartRate!)

    const metrics: HealthMetrics = {
      date,
      averageHeartRate: heartRates.length > 0
        ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
        : undefined,
      restingHeartRate: heartRates.length > 0 ? Math.min(...heartRates) : undefined,
      activeHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : undefined,
      hrvScore: latestData.heartRateVariability,
      stepsGoalAchieved: (latestData.stepCount || 0) >= 10000,
      sleepEfficiency: latestData.sleepQuality,
      recoveryScore: this.calculateRecoveryScore(latestData),
      readinessScore: this.calculateReadinessScore(latestData)
    }

    this.healthMetrics.set(date, metrics)
  }

  private calculateRecoveryScore(data: BiometricData): number {
    let score = 50 // Base score

    // Sleep quality impact (30% weight)
    if (data.sleepQuality !== undefined) {
      score += (data.sleepQuality - 50) * 0.3
    }

    // Sleep duration impact (20% weight)
    if (data.sleepDuration !== undefined) {
      const optimalSleep = 8
      const sleepDifference = Math.abs(data.sleepDuration - optimalSleep)
      score += Math.max(0, (2 - sleepDifference) * 10) * 0.2
    }

    // HRV impact (25% weight)
    if (data.heartRateVariability !== undefined) {
      // Higher HRV is generally better (normalized to 0-100)
      const normalizedHRV = Math.min(100, data.heartRateVariability * 2)
      score += (normalizedHRV - 50) * 0.25
    }

    // Stress level impact (25% weight)
    if (data.stressLevel !== undefined) {
      score += (50 - data.stressLevel) * 0.25
    }

    return Math.max(0, Math.min(100, score))
  }

  private calculateReadinessScore(data: BiometricData): number {
    let score = 50 // Base score

    // Recovery score impact
    const recoveryScore = this.calculateRecoveryScore(data)
    score += (recoveryScore - 50) * 0.4

    // Energy level impact
    if (data.energyLevel !== undefined) {
      score += (data.energyLevel - 50) * 0.3
    }

    // Mood impact
    if (data.mood !== undefined) {
      score += (data.mood - 50) * 0.2
    }

    // Focus level impact
    if (data.focusLevel !== undefined) {
      score += (data.focusLevel - 50) * 0.1
    }

    return Math.max(0, Math.min(100, score))
  }

  // Productivity Correlation Analysis
  analyzeProductivityCorrelation(productivityData: any[]): void {
    this.correlations = []

    productivityData.forEach(prodData => {
      const biometricData = this.biometricData.find(b => b.date === prodData.date)
      if (!biometricData) return

      const correlation: ProductivityCorrelation = {
        date: prodData.date,
        biometric: biometricData,
        productivity: prodData.productivity,
        correlations: this.calculateCorrelations(biometricData, prodData.productivity)
      }

      this.correlations.push(correlation)
    })

    this.generateProductivityInsights()
  }

  private generateProductivityInsights() {
    // Generate insights based on current data
    const recentData = this.data.slice(-7); // Last 7 entries
    if (recentData.length === 0) return;

    const avgStress = this.average(recentData.map(d => d.stressLevel).filter((val): val is number => typeof val === 'number'));
    const avgEnergy = this.average(recentData.map(d => d.energyLevel).filter((val): val is number => typeof val === 'number'));
    const avgSleep = this.average(recentData.map(d => d.sleepQuality).filter((val): val is number => typeof val === 'number'));

    // Generate insights based on patterns
    if (avgStress > 70) {
      console.log('High stress levels detected - consider stress management techniques');
    }
    if (avgEnergy < 30) {
      console.log('Low energy levels detected - consider improving sleep or nutrition');
    }
    if (avgSleep < 50) {
      console.log('Poor sleep quality detected - consider sleep hygiene improvements');
    }
  }

  private calculateCorrelations(biometric: BiometricData, productivity: any) {
    return {
      sleepVsProductivity: this.correlateValues(
        biometric.sleepQuality || 50,
        productivity.efficiencyScore * 10
      ),
      heartRateVsFocus: this.correlateValues(
        this.normalizeHeartRate(biometric.heartRate || 70),
        productivity.focusTime / 8 * 100 // Normalize to 8 hours
      ),
      stepsVsEnergy: this.correlateValues(
        Math.min(100, (biometric.stepCount || 0) / 100),
        biometric.energyLevel || 50
      ),
      moodVsCreativity: this.correlateValues(
        biometric.mood || 50,
        productivity.creativityScore * 10
      ),
      overallCorrelation: 0 // Will be calculated
    }
  }

  private correlateValues(x: number, y: number): number {
    // Simple correlation calculation (-1 to 1)
    const normalizedX = x / 100
    const normalizedY = y / 100

    // Pearson-like correlation
    return 1 - Math.abs(normalizedX - normalizedY)
  }

  private normalizeHeartRate(hr: number): number {
    // Normalize heart rate to 0-100 scale (assuming 60-100 is optimal range)
    const optimalMin = 60
    const optimalMax = 100

    if (hr < optimalMin) return 100 - ((optimalMin - hr) / optimalMin) * 100
    if (hr > optimalMax) return 100 - ((hr - optimalMax) / optimalMax) * 100

    return 100 // Optimal range
  }

  // Insights Generation
  generateInsights(): void {
    this.insights = []

    this.analyzeSleepPatterns()
    this.analyzeActivityPatterns()
    this.analyzeStressPatterns()
    this.analyzeOptimalConditions()
    this.generateRecommendations()

    this.saveData()
  }

  private analyzeSleepPatterns(): void {
    const recentData = this.getRecentData(14)
    const sleepData = recentData.filter(d => d.sleepDuration !== undefined)

    if (sleepData.length < 7) return

    const avgSleepDuration = sleepData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / sleepData.length
    const avgSleepQuality = sleepData.reduce((sum, d) => sum + (d.sleepQuality || 0), 0) / sleepData.length

    if (avgSleepDuration < 7) {
      this.insights.push({
        id: `sleep-duration-${Date.now()}`,
        type: 'alert',
        title: '수면 부족 패턴',
        description: `평균 수면시간이 ${avgSleepDuration.toFixed(1)}시간으로 부족합니다.`,
        insight: '충분한 수면은 생산성과 건강에 매우 중요합니다.',
        actionable: true,
        recommendations: [
          '매일 같은 시간에 잠자리에 들기',
          '취침 1시간 전 전자기기 사용 중단',
          '수면 환경 개선 (온도, 조명, 소음)',
          '카페인 섭취 시간 조절'
        ],
        priority: 'high',
        confidence: 0.9,
        dataPoints: [`평균 수면시간: ${avgSleepDuration.toFixed(1)}시간`],
        createdAt: new Date()
      })
    }

    if (avgSleepQuality < 60) {
      this.insights.push({
        id: `sleep-quality-${Date.now()}`,
        type: 'recommendation',
        title: '수면 질 개선 필요',
        description: `평균 수면 질 점수가 ${avgSleepQuality.toFixed(0)}점으로 낮습니다.`,
        insight: '수면의 질이 낮으면 다음 날 집중력과 에너지 수준이 저하됩니다.',
        actionable: true,
        recommendations: [
          '규칙적인 운동 (단, 취침 4시간 전까지)',
          '스트레스 관리 기법 연습',
          '수면 추적을 통한 패턴 파악',
          '침실 환경 최적화'
        ],
        priority: 'medium',
        confidence: 0.8,
        dataPoints: [`평균 수면 질: ${avgSleepQuality.toFixed(0)}점`],
        createdAt: new Date()
      })
    }
  }

  private analyzeActivityPatterns(): void {
    const recentData = this.getRecentData(7)
    const activeData = recentData.filter(d => d.stepCount !== undefined)

    if (activeData.length < 5) return

    const avgSteps = activeData.reduce((sum, d) => sum + (d.stepCount || 0), 0) / activeData.length
    const activeMinutes = activeData.reduce((sum, d) => {
      return sum + (d.physicalActivity?.reduce((acc, act) => acc + act.duration, 0) || 0)
    }, 0) / activeData.length

    if (avgSteps < 8000) {
      this.insights.push({
        id: `activity-low-${Date.now()}`,
        type: 'recommendation',
        title: '활동량 부족',
        description: `일평균 ${Math.round(avgSteps)}보로 권장량에 미달입니다.`,
        insight: '적절한 신체 활동은 에너지 수준과 집중력 향상에 도움이 됩니다.',
        actionable: true,
        recommendations: [
          '하루 10,000보 목표 설정',
          '계단 이용하기',
          '점심시간 산책',
          '서서 일하는 시간 늘리기',
          '짧은 운동 루틴 추가'
        ],
        priority: 'medium',
        confidence: 0.7,
        dataPoints: [`평균 걸음수: ${Math.round(avgSteps)}보`],
        createdAt: new Date()
      })
    }

    if (activeMinutes < 30) {
      this.insights.push({
        id: `exercise-low-${Date.now()}`,
        type: 'recommendation',
        title: '운동 시간 부족',
        description: `일평균 운동시간이 ${Math.round(activeMinutes)}분으로 부족합니다.`,
        insight: '규칙적인 운동은 스트레스 해소와 생산성 향상에 효과적입니다.',
        actionable: true,
        recommendations: [
          '주 3회 이상 30분 운동',
          '업무 중 스트레칭 시간',
          '계단 오르기, 빠른 걷기 등 간단한 운동',
          '운동 스케줄 정하기'
        ],
        priority: 'medium',
        confidence: 0.8,
        dataPoints: [`평균 운동시간: ${Math.round(activeMinutes)}분`],
        createdAt: new Date()
      })
    }
  }

  private analyzeStressPatterns(): void {
    const recentData = this.getRecentData(14)
    const stressData = recentData.filter(d => d.stressLevel !== undefined)

    if (stressData.length < 7) return

    const avgStress = stressData.reduce((sum, d) => sum + (d.stressLevel || 0), 0) / stressData.length
    const highStressDays = stressData.filter(d => (d.stressLevel || 0) > 70).length

    if (avgStress > 60) {
      this.insights.push({
        id: `stress-high-${Date.now()}`,
        type: 'alert',
        title: '스트레스 수준 높음',
        description: `평균 스트레스 수준이 ${avgStress.toFixed(0)}점으로 높습니다.`,
        insight: '지속적인 고스트레스는 건강과 생산성에 부정적 영향을 미칩니다.',
        actionable: true,
        recommendations: [
          '명상이나 심호흡 연습',
          '업무 우선순위 재정리',
          '충분한 휴식 시간 확보',
          '스트레스 요인 파악 및 관리',
          '전문가 상담 고려'
        ],
        priority: 'high',
        confidence: 0.85,
        dataPoints: [
          `평균 스트레스: ${avgStress.toFixed(0)}점`,
          `고스트레스 일수: ${highStressDays}일`
        ],
        createdAt: new Date()
      })
    }

    if (highStressDays > stressData.length * 0.5) {
      this.insights.push({
        id: `stress-frequent-${Date.now()}`,
        type: 'pattern',
        title: '빈번한 고스트레스',
        description: `${highStressDays}일간 높은 스트레스를 경험했습니다.`,
        insight: '스트레스 관리 전략이 필요합니다.',
        actionable: true,
        recommendations: [
          '스트레스 일기 작성',
          '트리거 요인 분석',
          '대처 방법 개발',
          '생활 패턴 조정'
        ],
        priority: 'high',
        confidence: 0.8,
        dataPoints: [`고스트레스 빈도: ${(highStressDays / stressData.length * 100).toFixed(0)}%`],
        createdAt: new Date()
      })
    }
  }

  private analyzeOptimalConditions(): void {
    if (this.correlations.length < 14) return

    const highProductivityDays = this.correlations.filter(c =>
      c.productivity.efficiencyScore > 7 && c.productivity.qualityScore > 7
    )

    if (highProductivityDays.length < 3) return

    // Analyze patterns in high productivity days
    const optimalSleep = highProductivityDays.reduce((sum, day) =>
      sum + (day.biometric.sleepDuration || 8), 0
    ) / highProductivityDays.length

    const optimalSteps = highProductivityDays.reduce((sum, day) =>
      sum + (day.biometric.stepCount || 0), 0
    ) / highProductivityDays.length

    this.optimalConditions = {
      heartRateRange: {
        min: 60,
        max: 90
      },
      optimalSleepDuration: optimalSleep,
      optimalSteps: optimalSteps,
      bestWorkingHours: [9, 10, 11, 14, 15, 16], // Would be analyzed from data
      optimalEnvironment: {
        temperature: 22,
        humidity: 50
      }
    }

    this.insights.push({
      id: `optimal-conditions-${Date.now()}`,
      type: 'optimization',
      title: '최적 생산성 조건 발견',
      description: '높은 생산성을 보인 날들의 공통 패턴을 발견했습니다.',
      insight: `최적 수면시간: ${optimalSleep.toFixed(1)}시간, 최적 활동량: ${Math.round(optimalSteps)}보`,
      actionable: true,
      recommendations: [
        `${optimalSleep.toFixed(1)}시간 수면 목표`,
        `일일 ${Math.round(optimalSteps)}보 활동 목표`,
        '9-11시, 14-16시 집중 업무 시간 활용',
        '최적 환경 조건 유지'
      ],
      priority: 'medium',
      confidence: 0.75,
      dataPoints: [
        `분석 기반 일수: ${highProductivityDays.length}일`,
        `최적 수면: ${optimalSleep.toFixed(1)}시간`,
        `최적 활동: ${Math.round(optimalSteps)}보`
      ],
      createdAt: new Date()
    })
  }

  private generateRecommendations(): void {
    const recentData = this.getRecentData(7)
    if (recentData.length === 0) return

    // Hydration recommendations
    const avgHydration = recentData
      .filter(d => d.hydrationLevel !== undefined)
      .reduce((sum, d) => sum + (d.hydrationLevel || 0), 0) / recentData.length

    if (avgHydration < 2000) { // Less than 2L per day
      this.insights.push({
        id: `hydration-${Date.now()}`,
        type: 'recommendation',
        title: '수분 섭취 부족',
        description: `일평균 수분 섭취량이 ${Math.round(avgHydration)}ml로 부족합니다.`,
        insight: '적절한 수분 섭취는 집중력과 에너지 유지에 중요합니다.',
        actionable: true,
        recommendations: [
          '하루 2-3L 물 섭취 목표',
          '일정 간격으로 물 마시기 알람',
          '물병 항상 준비하기',
          '카페인 음료 줄이기'
        ],
        priority: 'low',
        confidence: 0.6,
        dataPoints: [`평균 수분 섭취: ${Math.round(avgHydration)}ml`],
        createdAt: new Date()
      })
    }

    // Screen time recommendations
    const avgScreenTime = recentData
      .filter(d => d.screenTime !== undefined)
      .reduce((sum, d) => sum + (d.screenTime || 0), 0) / recentData.length

    if (avgScreenTime > 8) { // More than 8 hours per day
      this.insights.push({
        id: `screen-time-${Date.now()}`,
        type: 'recommendation',
        title: '과도한 스크린 시간',
        description: `일평균 스크린 시간이 ${avgScreenTime.toFixed(1)}시간입니다.`,
        insight: '과도한 스크린 시간은 눈의 피로와 수면 질에 영향을 줄 수 있습니다.',
        actionable: true,
        recommendations: [
          '20-20-20 규칙 적용 (20분마다 20초간 20피트 거리 바라보기)',
          '취침 1시간 전 스크린 차단',
          '블루라이트 필터 사용',
          '정기적인 눈 휴식'
        ],
        priority: 'medium',
        confidence: 0.7,
        dataPoints: [`평균 스크린 시간: ${avgScreenTime.toFixed(1)}시간`],
        createdAt: new Date()
      })
    }
  }

  // Data Access Methods
  private getRecentData(days: number): BiometricData[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return this.biometricData.filter(d => d.timestamp > cutoff)
  }

  getBiometricData(days: number = 30): BiometricData[] {
    return this.getRecentData(days)
  }

  getHealthMetrics(days: number = 30): HealthMetrics[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return Array.from(this.healthMetrics.values())
      .filter(m => new Date(m.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  getInsights(): BiometricInsight[] {
    return this.insights.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  getCorrelations(): ProductivityCorrelation[] {
    return this.correlations
  }

  getOptimalConditions(): OptimalConditions | null {
    return this.optimalConditions
  }

  // Dashboard Data
  getDashboardData() {
    const recentData = this.getRecentData(7)
    const todayData = this.getRecentData(1)[0]

    return {
      today: todayData || null,
      weeklyAverage: this.calculateWeeklyAverages(recentData),
      insights: this.getInsights().slice(0, 5),
      correlations: this.correlations.slice(-7),
      healthMetrics: Array.from(this.healthMetrics.values()).slice(-7),
      optimalConditions: this.optimalConditions,
      trends: this.calculateTrends(recentData)
    }
  }

  private calculateWeeklyAverages(data: BiometricData[]) {
    if (data.length === 0) return null

    return {
      heartRate: this.average(data.map(d => d.heartRate).filter((val): val is number => typeof val === 'number')),
      steps: this.average(data.map(d => d.stepCount).filter((val): val is number => typeof val === 'number')),
      sleep: this.average(data.map(d => d.sleepDuration).filter((val): val is number => typeof val === 'number')),
      sleepQuality: this.average(data.map(d => d.sleepQuality).filter((val): val is number => typeof val === 'number')),
      stress: this.average(data.map(d => d.stressLevel).filter((val): val is number => typeof val === 'number')),
      energy: this.average(data.map(d => d.energyLevel).filter((val): val is number => typeof val === 'number')),
      mood: this.average(data.map(d => d.mood).filter((val): val is number => typeof val === 'number'))
    }
  }

  private calculateTrends(data: BiometricData[]) {
    // Simple trend calculation (positive/negative/stable)
    const first = data.slice(0, Math.floor(data.length / 2))
    const second = data.slice(Math.floor(data.length / 2))

    const firstAvg = this.calculateWeeklyAverages(first)
    const secondAvg = this.calculateWeeklyAverages(second)

    if (!firstAvg || !secondAvg) return null

    return {
      sleep: this.getTrend(firstAvg.sleep, secondAvg.sleep),
      energy: this.getTrend(firstAvg.energy, secondAvg.energy),
      stress: this.getTrend(firstAvg.stress, secondAvg.stress, true), // Lower is better
      activity: this.getTrend(firstAvg.steps, secondAvg.steps)
    }
  }

  private getTrend(oldVal: number, newVal: number, reverse: boolean = false): 'improving' | 'declining' | 'stable' {
    if (!oldVal || !newVal) return 'stable'

    const change = (newVal - oldVal) / oldVal
    const threshold = 0.1 // 10% change threshold

    if (Math.abs(change) < threshold) return 'stable'

    const improving = reverse ? change < 0 : change > 0
    return improving ? 'improving' : 'declining'
  }

  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }

  // Device Integration
  async connectFitnessDevice(): Promise<boolean> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Bluetooth not supported')
    }

    try {
      // Request Bluetooth device with heart rate service
      const device = await (navigator.bluetooth as any).requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      })

      const server = await device.gatt.connect()
      console.log('Connected to fitness device:', device.name)

      this.isFitnessTrackerConnected = true
      return true
    } catch (error) {
      console.error('Failed to connect to fitness device:', error)
      return false
    }
  }

  // Data Export
  exportData() {
    return {
      biometricData: this.biometricData,
      healthMetrics: Array.from(this.healthMetrics.entries()),
      correlations: this.correlations,
      insights: this.insights,
      optimalConditions: this.optimalConditions
    }
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        biometricData: this.biometricData,
        healthMetrics: Array.from(this.healthMetrics.entries()),
        correlations: this.correlations,
        insights: this.insights,
        optimalConditions: this.optimalConditions
      }
      localStorage.setItem('jihyung-biometric-tracking', JSON.stringify(data))
    } catch (error) {
      console.error('생체 데이터 저장 실패:', error)
    }
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('jihyung-biometric-tracking')
      if (!saved) return

      const data = JSON.parse(saved)

      this.biometricData = (data.biometricData || []).map((item: any) => ({
        ...item,
        timestamp: typeof item.timestamp === 'string' ? new Date(item.timestamp).getTime() : item.timestamp
      }))

      this.healthMetrics = new Map(data.healthMetrics || [])
      this.correlations = data.correlations || []

      this.insights = (data.insights || []).map((insight: any) => ({
        ...insight,
        createdAt: new Date(insight.createdAt)
      }))

      this.optimalConditions = data.optimalConditions || null

    } catch (error) {
      console.error('생체 데이터 로드 실패:', error)
    }
  }
}

// Export singleton instance
export const biometricTrackingService = new BiometricTrackingService()

export default biometricTrackingService