import { apiClient } from './enhanced-api';

export interface UserProductivityData {
  userId: string;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    tags: string[];
    reading_time: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    energy: number;
    created_at: string;
    completed_at?: string;
    due_at?: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    start_at: string;
    end_at: string;
    created_at: string;
    type?: 'work' | 'meeting' | 'break' | 'learning';
  }>;
  aiInteractions: Array<{
    id: string;
    query: string;
    response: string;
    created_at: string;
    quality_rating?: number;
  }>;
}

export interface AIInsight {
  id: string;
  type: 'productivity' | 'pattern' | 'suggestion' | 'prediction' | 'optimization';
  category: 'time' | 'focus' | 'collaboration' | 'goals' | 'wellness' | 'learning';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data: any;
  timestamp: string;
  priority: number;
}

export interface ProductivityMetrics {
  focusScore: number;
  efficiencyRating: number;
  goalProgress: number;
  completionRate: number;
  learningVelocity: number;
  wellnessBalance: number;
  workPatterns: {
    peakHours: string[];
    averageSessionLength: number;
    multitaskingRate: number;
    breakFrequency: number;
  };
}

export interface PredictiveAnalytics {
  burnoutRisk: number;
  optimalWorkHours: string[];
  peakProductivityTime: string;
  recommendedBreaks: number;
  goalAchievementProbability: number;
  upcomingChallenges: Array<{
    challenge: string;
    probability: number;
    mitigation: string;
  }>;
}

class AIAnalyticsService {
  // 사용자 생산성 데이터 수집
  async collectUserData(): Promise<UserProductivityData> {
    try {
      const [notes, tasks, events, aiInteractions] = await Promise.all([
        apiClient.getNotes(),
        apiClient.getTasks(),
        apiClient.getCalendarEvents(),
        this.getAIInteractions()
      ]);

      return {
        userId: 'current-user',
        notes: notes || [],
        tasks: tasks || [],
        events: events || [],
        aiInteractions: aiInteractions || []
      };
    } catch (error) {
      console.error('데이터 수집 오류:', error);
      throw new Error('사용자 데이터를 수집할 수 없습니다.');
    }
  }

  // AI 상호작용 기록 가져오기
  async getAIInteractions() {
    try {
      const response = await fetch('/api/ai-interactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('demo_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('AI 상호작용 데이터 로드 실패:', error);
      return [];
    }
  }

  // 실제 AI 기반 인사이트 생성
  async generateRealInsights(userData: UserProductivityData): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // 1. 작업 완료 패턴 분석
    const taskCompletionInsight = this.analyzeTaskCompletion(userData.tasks);
    if (taskCompletionInsight) insights.push(taskCompletionInsight);

    // 2. 시간대별 생산성 분석
    const timeProductivityInsight = this.analyzeTimeProductivity(userData.tasks, userData.events);
    if (timeProductivityInsight) insights.push(timeProductivityInsight);

    // 3. 노트 작성 패턴 분석
    const notePatternInsight = this.analyzeNotePatterns(userData.notes);
    if (notePatternInsight) insights.push(notePatternInsight);

    // 4. 에너지 레벨 최적화
    const energyOptimizationInsight = this.analyzeEnergyOptimization(userData.tasks);
    if (energyOptimizationInsight) insights.push(energyOptimizationInsight);

    // 5. 목표 달성 예측
    const goalPredictionInsight = this.predictGoalAchievement(userData.tasks);
    if (goalPredictionInsight) insights.push(goalPredictionInsight);

    return insights.sort((a, b) => b.priority - a.priority);
  }

  // 작업 완료 패턴 분석
  private analyzeTaskCompletion(tasks: UserProductivityData['tasks']): AIInsight | null {
    if (tasks.length === 0) return null;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = (completedTasks.length / tasks.length) * 100;

    // 요일별 완료 패턴 분석
    const dayCompletion = this.analyzeCompletionByDay(completedTasks);
    const bestDay = Object.entries(dayCompletion).reduce((a, b) => a[1] > b[1] ? a : b);

    // 시간대별 완료 패턴 분석
    const hourCompletion = this.analyzeCompletionByHour(completedTasks);
    const peakHour = Object.entries(hourCompletion).reduce((a, b) => a[1] > b[1] ? a : b);

    let title: string;
    let description: string;
    let impact: 'low' | 'medium' | 'high';

    if (completionRate >= 80) {
      title = '우수한 작업 완료율 유지';
      description = `${completionRate.toFixed(1)}%의 높은 완료율을 보이고 있습니다. ${bestDay[0]}요일에 가장 생산적이며, ${peakHour[0]}시에 가장 많은 작업을 완료합니다.`;
      impact = 'high';
    } else if (completionRate >= 60) {
      title = '작업 완료율 개선 가능';
      description = `현재 완료율 ${completionRate.toFixed(1)}%입니다. ${bestDay[0]}요일 패턴을 다른 요일에도 적용하면 효율성을 높일 수 있습니다.`;
      impact = 'medium';
    } else {
      title = '작업 완료율 향상 필요';
      description = `완료율이 ${completionRate.toFixed(1)}%로 낮습니다. 작업을 더 작은 단위로 나누고 우선순위를 재설정하는 것을 권장합니다.`;
      impact = 'high';
    }

    return {
      id: `task-completion-${Date.now()}`,
      type: 'pattern',
      category: 'goals',
      title,
      description,
      confidence: Math.min(95, Math.max(70, tasks.length * 5)),
      impact,
      actionable: true,
      data: {
        completionRate,
        bestDay: bestDay[0],
        peakHour: parseInt(peakHour[0]),
        totalTasks: tasks.length,
        completedTasks: completedTasks.length
      },
      timestamp: new Date().toISOString(),
      priority: impact === 'high' ? 1 : impact === 'medium' ? 2 : 3
    };
  }

  // 시간대별 생산성 분석
  private analyzeTimeProductivity(tasks: UserProductivityData['tasks'], events: UserProductivityData['events']): AIInsight | null {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
    if (completedTasks.length === 0) return null;

    const hourlyProductivity = new Array(24).fill(0);

    completedTasks.forEach(task => {
      if (task.completed_at) {
        const hour = new Date(task.completed_at).getHours();
        hourlyProductivity[hour] += task.energy || 1;
      }
    });

    const maxProductivity = Math.max(...hourlyProductivity);
    const peakHours = hourlyProductivity
      .map((value, index) => ({ hour: index, value }))
      .filter(item => item.value >= maxProductivity * 0.8)
      .map(item => item.hour);

    const morningProductivity = hourlyProductivity.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoonProductivity = hourlyProductivity.slice(12, 18).reduce((a, b) => a + b, 0);
    const eveningProductivity = hourlyProductivity.slice(18, 24).reduce((a, b) => a + b, 0);

    let bestPeriod: string;
    let title: string;
    let description: string;

    if (morningProductivity >= afternoonProductivity && morningProductivity >= eveningProductivity) {
      bestPeriod = '오전';
      title = '오전 시간대 최고 생산성';
      description = `오전 시간대(6-12시)에 가장 높은 생산성을 보입니다. 특히 ${peakHours.join(', ')}시에 집중도가 최고조에 달합니다. 중요한 작업을 오전에 배치하세요.`;
    } else if (afternoonProductivity >= eveningProductivity) {
      bestPeriod = '오후';
      title = '오후 시간대 최고 생산성';
      description = `오후 시간대(12-18시)에 가장 효율적입니다. ${peakHours.join(', ')}시가 골든타임입니다. 점심 후 에너지를 활용한 업무 스케줄링을 권장합니다.`;
    } else {
      bestPeriod = '저녁';
      title = '저녁 시간대 높은 집중력';
      description = `저녁 시간대(18-24시)에 생산성이 높습니다. ${peakHours.join(', ')}시에 가장 집중됩니다. 야간 작업 스타일에 맞는 일정 관리가 필요합니다.`;
    }

    return {
      id: `time-productivity-${Date.now()}`,
      type: 'productivity',
      category: 'time',
      title,
      description,
      confidence: Math.min(90, Math.max(75, completedTasks.length * 3)),
      impact: 'high',
      actionable: true,
      data: {
        bestPeriod,
        peakHours,
        hourlyProductivity,
        morningScore: morningProductivity,
        afternoonScore: afternoonProductivity,
        eveningScore: eveningProductivity
      },
      timestamp: new Date().toISOString(),
      priority: 1
    };
  }

  // 노트 작성 패턴 분석
  private analyzeNotePatterns(notes: UserProductivityData['notes']): AIInsight | null {
    if (notes.length === 0) return null;

    // 태그 빈도 분석
    const tagFrequency: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // 작성 빈도 분석
    const recentNotes = notes.filter(note => {
      const noteDate = new Date(note.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    });

    const avgReadingTime = notes.reduce((sum, note) => sum + (note.reading_time || 0), 0) / notes.length;

    let title: string;
    let description: string;
    let impact: 'low' | 'medium' | 'high';

    if (recentNotes.length >= 5) {
      title = '활발한 지식 관리 활동';
      description = `최근 일주일간 ${recentNotes.length}개의 노트를 작성했습니다. 주로 '${topTags[0]?.[0] || '일반'}' 주제에 관심이 높으며, 평균 읽기 시간은 ${Math.round(avgReadingTime)}분입니다.`;
      impact = 'medium';
    } else if (recentNotes.length >= 2) {
      title = '꾸준한 학습 기록';
      description = `최근 ${recentNotes.length}개의 노트를 작성했습니다. '${topTags[0]?.[0] || '일반'}' 분야에 집중하고 있으며, 지식 축적 패턴이 좋습니다.`;
      impact = 'low';
    } else {
      title = '노트 작성 빈도 증가 권장';
      description = `최근 노트 작성이 저조합니다. 학습한 내용을 기록하면 장기 기억에 도움이 되며, 나중에 참고할 수 있는 개인 지식 베이스를 구축할 수 있습니다.`;
      impact = 'medium';
    }

    return {
      id: `note-pattern-${Date.now()}`,
      type: 'pattern',
      category: 'learning',
      title,
      description,
      confidence: 85,
      impact,
      actionable: true,
      data: {
        totalNotes: notes.length,
        recentNotes: recentNotes.length,
        topTags: topTags.map(([tag, count]) => ({ tag, count })),
        avgReadingTime: Math.round(avgReadingTime)
      },
      timestamp: new Date().toISOString(),
      priority: impact === 'high' ? 1 : 2
    };
  }

  // 에너지 레벨 최적화 분석
  private analyzeEnergyOptimization(tasks: UserProductivityData['tasks']): AIInsight | null {
    const tasksWithEnergy = tasks.filter(t => t.energy && t.energy > 0);
    if (tasksWithEnergy.length === 0) return null;

    const avgEnergyRequired = tasksWithEnergy.reduce((sum, task) => sum + task.energy, 0) / tasksWithEnergy.length;
    const highEnergyTasks = tasksWithEnergy.filter(t => t.energy >= avgEnergyRequired * 1.2);
    const lowEnergyTasks = tasksWithEnergy.filter(t => t.energy <= avgEnergyRequired * 0.8);

    const completedHighEnergy = highEnergyTasks.filter(t => t.status === 'completed').length;
    const completedLowEnergy = lowEnergyTasks.filter(t => t.status === 'completed').length;

    const highEnergyCompletionRate = highEnergyTasks.length > 0 ? (completedHighEnergy / highEnergyTasks.length) * 100 : 0;
    const lowEnergyCompletionRate = lowEnergyTasks.length > 0 ? (completedLowEnergy / lowEnergyTasks.length) * 100 : 0;

    let title: string;
    let description: string;
    let suggestion: string;

    if (highEnergyCompletionRate > lowEnergyCompletionRate) {
      title = '고에너지 작업에 강함';
      description = `고에너지 작업 완료율(${highEnergyCompletionRate.toFixed(1)}%)이 저에너지 작업(${lowEnergyCompletionRate.toFixed(1)}%)보다 높습니다.`;
      suggestion = '도전적인 작업을 우선적으로 배치하고, 루틴한 작업은 에너지가 낮을 때 처리하세요.';
    } else {
      title = '에너지 관리 최적화 필요';
      description = `저에너지 작업 완료율(${lowEnergyCompletionRate.toFixed(1}}%)이 더 높습니다. 에너지 배분을 재고려해보세요.`;
      suggestion = '큰 작업을 작은 단위로 나누고, 에너지가 높을 때 중요한 작업을 먼저 처리하세요.';
    }

    return {
      id: `energy-optimization-${Date.now()}`,
      type: 'optimization',
      category: 'wellness',
      title,
      description: `${description} ${suggestion}`,
      confidence: 80,
      impact: 'medium',
      actionable: true,
      data: {
        avgEnergyRequired: Math.round(avgEnergyRequired),
        highEnergyCompletionRate,
        lowEnergyCompletionRate,
        highEnergyTasksCount: highEnergyTasks.length,
        lowEnergyTasksCount: lowEnergyTasks.length
      },
      timestamp: new Date().toISOString(),
      priority: 2
    };
  }

  // 목표 달성 예측
  private predictGoalAchievement(tasks: UserProductivityData['tasks']): AIInsight | null {
    if (tasks.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(task => new Date(task.created_at) >= thirtyDaysAgo);
    const completedRecent = recentTasks.filter(task => task.status === 'completed');

    const completionRate = recentTasks.length > 0 ? (completedRecent.length / recentTasks.length) * 100 : 0;

    // 완료 속도 계산 (일평균)
    const completionVelocity = completedRecent.length / 30;

    // 남은 작업 수
    const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length;

    // 예상 완료 일수
    const estimatedDaysToComplete = completionVelocity > 0 ? pendingTasks / completionVelocity : Infinity;

    let probability: number;
    let title: string;
    let description: string;

    if (completionRate >= 80) {
      probability = Math.min(95, 70 + completionRate * 0.3);
      title = '목표 달성 가능성 높음';
      description = `현재 완료율 ${completionRate.toFixed(1)}%로 우수한 성과를 보이고 있습니다. 현재 속도로 진행하면 약 ${Math.ceil(estimatedDaysToComplete)}일 후 모든 작업을 완료할 수 있습니다.`;
    } else if (completionRate >= 60) {
      probability = Math.min(85, 50 + completionRate * 0.5);
      title = '목표 달성 가능';
      description = `완료율 ${completionRate.toFixed(1}}%로 양호한 수준입니다. 현재 패턴을 유지하면 목표 달성이 가능하지만, 약간의 속도 개선이 도움이 될 것입니다.`;
    } else {
      probability = Math.max(30, completionRate * 0.8);
      title = '목표 달성을 위한 전략 수정 필요';
      description = `현재 완료율 ${completionRate.toFixed(1}}%로 목표 달성을 위해서는 작업 방식의 개선이 필요합니다. 우선순위 재정렬과 시간 관리 최적화를 권장합니다.`;
    }

    return {
      id: `goal-prediction-${Date.now()}`,
      type: 'prediction',
      category: 'goals',
      title,
      description,
      confidence: 85,
      impact: 'high',
      actionable: true,
      data: {
        completionRate,
        completionVelocity: Math.round(completionVelocity * 10) / 10,
        pendingTasks,
        estimatedDaysToComplete: Math.ceil(estimatedDaysToComplete),
        achievementProbability: Math.round(probability)
      },
      timestamp: new Date().toISOString(),
      priority: 1
    };
  }

  // 요일별 완료 패턴 분석
  private analyzeCompletionByDay(completedTasks: UserProductivityData['tasks']) {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayCompletion: Record<string, number> = {};

    dayNames.forEach(day => dayCompletion[day] = 0);

    completedTasks.forEach(task => {
      if (task.completed_at) {
        const dayIndex = new Date(task.completed_at).getDay();
        dayCompletion[dayNames[dayIndex]]++;
      }
    });

    return dayCompletion;
  }

  // 시간별 완료 패턴 분석
  private analyzeCompletionByHour(completedTasks: UserProductivityData['tasks']) {
    const hourCompletion: Record<string, number> = {};

    for (let i = 0; i < 24; i++) {
      hourCompletion[i.toString()] = 0;
    }

    completedTasks.forEach(task => {
      if (task.completed_at) {
        const hour = new Date(task.completed_at).getHours();
        hourCompletion[hour.toString()]++;
      }
    });

    return hourCompletion;
  }

  // 생산성 메트릭 계산
  async calculateProductivityMetrics(userData: UserProductivityData): Promise<ProductivityMetrics> {
    const { tasks, notes, events } = userData;

    // 완료율
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // 집중도 점수 (고에너지 작업 완료율)
    const highEnergyTasks = tasks.filter(t => t.energy && t.energy >= 7);
    const completedHighEnergy = highEnergyTasks.filter(t => t.status === 'completed');
    const focusScore = highEnergyTasks.length > 0 ? (completedHighEnergy.length / highEnergyTasks.length) * 100 : 0;

    // 효율성 점수 (기한 내 완료율)
    const tasksWithDue = tasks.filter(t => t.due_at);
    const onTimeTasks = tasksWithDue.filter(t =>
      t.status === 'completed' && t.completed_at && t.due_at &&
      new Date(t.completed_at) <= new Date(t.due_at)
    );
    const efficiencyRating = tasksWithDue.length > 0 ? (onTimeTasks.length / tasksWithDue.length) * 100 : 0;

    // 학습 속도 (최근 노트 작성 빈도)
    const recentNotes = notes.filter(note => {
      const noteDate = new Date(note.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    });
    const learningVelocity = Math.min(100, recentNotes.length * 20);

    // 작업 패턴 분석
    const hourlyCompletion = this.analyzeCompletionByHour(completedTasks);
    const peakHours = Object.entries(hourlyCompletion)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // 평균 세션 길이 (이벤트 기반)
    const workEvents = events.filter(e => e.type === 'work' || !e.type);
    const sessionLengths = workEvents.map(e => {
      const start = new Date(e.start_at);
      const end = new Date(e.end_at);
      return (end.getTime() - start.getTime()) / (1000 * 60); // 분 단위
    });
    const averageSessionLength = sessionLengths.length > 0
      ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length
      : 0;

    // 멀티태스킹 비율 (동시간대 여러 작업)
    const multitaskingRate = this.calculateMultitaskingRate(events);

    // 휴식 빈도
    const breakEvents = events.filter(e => e.type === 'break');
    const workDays = this.getUniqueDays(events);
    const breakFrequency = workDays.length > 0 ? breakEvents.length / workDays.length : 0;

    // 웰니스 밸런스 (작업-휴식 비율)
    const workTime = workEvents.reduce((sum, e) => {
      const duration = new Date(e.end_at).getTime() - new Date(e.start_at).getTime();
      return sum + duration;
    }, 0);
    const breakTime = breakEvents.reduce((sum, e) => {
      const duration = new Date(e.end_at).getTime() - new Date(e.start_at).getTime();
      return sum + duration;
    }, 0);
    const wellnessBalance = workTime > 0 ? Math.min(100, (breakTime / workTime) * 500) : 0;

    return {
      focusScore: Math.round(focusScore),
      efficiencyRating: Math.round(efficiencyRating),
      goalProgress: Math.round(completionRate),
      completionRate: Math.round(completionRate),
      learningVelocity: Math.round(learningVelocity),
      wellnessBalance: Math.round(wellnessBalance),
      workPatterns: {
        peakHours,
        averageSessionLength: Math.round(averageSessionLength),
        multitaskingRate: Math.round(multitaskingRate),
        breakFrequency: Math.round(breakFrequency * 10) / 10
      }
    };
  }

  // 멀티태스킹 비율 계산
  private calculateMultitaskingRate(events: UserProductivityData['events']): number {
    // 시간대별로 겹치는 이벤트 수를 계산
    const overlaps = events.reduce((count, event, index) => {
      const eventStart = new Date(event.start_at);
      const eventEnd = new Date(event.end_at);

      const overlappingEvents = events.slice(index + 1).filter(otherEvent => {
        const otherStart = new Date(otherEvent.start_at);
        const otherEnd = new Date(otherEvent.end_at);

        return (eventStart < otherEnd && eventEnd > otherStart);
      });

      return count + (overlappingEvents.length > 0 ? 1 : 0);
    }, 0);

    return events.length > 0 ? (overlaps / events.length) * 100 : 0;
  }

  // 고유 날짜 수 계산
  private getUniqueDays(events: UserProductivityData['events']): string[] {
    const days = new Set();
    events.forEach(event => {
      const day = new Date(event.start_at).toDateString();
      days.add(day);
    });
    return Array.from(days) as string[];
  }

  // 예측 분석 생성
  async generatePredictiveAnalytics(userData: UserProductivityData, metrics: ProductivityMetrics): Promise<PredictiveAnalytics> {
    const { tasks } = userData;

    // 번아웃 위험도 계산
    const burnoutRisk = this.calculateBurnoutRisk(metrics);

    // 목표 달성 확률
    const goalAchievementProbability = this.calculateGoalAchievementProbability(tasks);

    // 다가오는 도전과제 예측
    const upcomingChallenges = this.predictUpcomingChallenges(userData, metrics);

    return {
      burnoutRisk,
      optimalWorkHours: metrics.workPatterns.peakHours,
      peakProductivityTime: metrics.workPatterns.peakHours[0] || '14:00',
      recommendedBreaks: Math.max(4, Math.round(metrics.workPatterns.averageSessionLength / 90)),
      goalAchievementProbability,
      upcomingChallenges
    };
  }

  // 번아웃 위험도 계산
  private calculateBurnoutRisk(metrics: ProductivityMetrics): number {
    let risk = 0;

    // 웰니스 밸런스가 낮으면 위험도 증가
    if (metrics.wellnessBalance < 30) risk += 30;
    else if (metrics.wellnessBalance < 50) risk += 15;

    // 평균 세션이 너무 길면 위험도 증가
    if (metrics.workPatterns.averageSessionLength > 120) risk += 25;
    else if (metrics.workPatterns.averageSessionLength > 90) risk += 10;

    // 멀티태스킹이 많으면 위험도 증가
    if (metrics.workPatterns.multitaskingRate > 50) risk += 20;
    else if (metrics.workPatterns.multitaskingRate > 30) risk += 10;

    // 휴식이 부족하면 위험도 증가
    if (metrics.workPatterns.breakFrequency < 2) risk += 15;

    return Math.min(100, risk);
  }

  // 목표 달성 확률 계산
  private calculateGoalAchievementProbability(tasks: UserProductivityData['tasks']): number {
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (tasks.length === 0) return 50; // 기본값

    const completionRate = (completedTasks.length / tasks.length) * 100;

    // 최근 완료 트렌드 계산
    const recentCompleted = completedTasks.filter(task => {
      if (!task.completed_at) return false;
      const completedDate = new Date(task.completed_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    });

    const recentTrend = recentCompleted.length >= 3 ? 10 : recentCompleted.length >= 1 ? 0 : -10;

    return Math.min(100, Math.max(10, completionRate + recentTrend));
  }

  // 다가오는 도전과제 예측
  private predictUpcomingChallenges(userData: UserProductivityData, metrics: ProductivityMetrics) {
    const challenges = [];

    // 높은 번아웃 위험
    const burnoutRisk = this.calculateBurnoutRisk(metrics);
    if (burnoutRisk > 60) {
      challenges.push({
        challenge: '번아웃 위험 증가',
        probability: burnoutRisk,
        mitigation: '업무 강도를 줄이고 충분한 휴식을 취하세요. 작업 세션을 90분 이하로 제한하고 규칙적인 브레이크를 갖는 것을 권장합니다.'
      });
    }

    // 낮은 완료율
    if (metrics.completionRate < 60) {
      challenges.push({
        challenge: '목표 달성 어려움',
        probability: 100 - metrics.completionRate,
        mitigation: '작업을 더 작은 단위로 나누고 우선순위를 명확히 하세요. 일일 목표를 현실적으로 설정하는 것이 중요합니다.'
      });
    }

    // 학습 속도 저하
    if (metrics.learningVelocity < 40) {
      challenges.push({
        challenge: '지속적 학습 부족',
        probability: 70,
        mitigation: '주간 학습 시간을 별도로 배정하고 새로운 지식을 정기적으로 노트에 기록하세요. 작은 학습이라도 꾸준히 하는 것이 중요합니다.'
      });
    }

    return challenges;
  }
}

export const aiAnalytics = new AIAnalyticsService();