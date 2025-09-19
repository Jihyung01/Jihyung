import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  AlertTriangle,
  Lightbulb,
  Target,
  Smile,
  Frown,
  Meh
} from 'lucide-react'
import {
  emotionAnalyticsService,
  EmotionData,
  EmotionInsight,
  EmotionProductivityCorrelation
} from '../../services/EmotionAnalyticsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'

interface EmotionAnalyticsDashboardProps {
  className?: string
}

export function EmotionAnalyticsDashboard({ className }: EmotionAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<7 | 14 | 30>(7)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<EmotionInsight | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [selectedTimeRange])

  const loadDashboardData = () => {
    const data = emotionAnalyticsService.getDashboardData()
    setDashboardData(data)
  }

  const getEmotionIcon = (emotionName: string) => {
    const icons = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      trust: '🤝',
      anticipation: '🤔'
    }
    return icons[emotionName as keyof typeof icons] || '😐'
  }

  const getEmotionColor = (emotionName: string) => {
    const colors = {
      joy: '#f59e0b',
      sadness: '#3b82f6',
      anger: '#ef4444',
      fear: '#8b5cf6',
      surprise: '#f97316',
      disgust: '#84cc16',
      trust: '#10b981',
      anticipation: '#ec4899'
    }
    return colors[emotionName as keyof typeof colors] || '#6b7280'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <TrendingUp className="w-4 h-4 text-orange-500" />
      case 'medium': return <Activity className="w-4 h-4 text-yellow-500" />
      case 'low': return <Lightbulb className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getMoodIcon = (sentiment: string, score: number) => {
    if (sentiment === 'positive') return <Smile className="w-5 h-5 text-green-500" />
    if (sentiment === 'negative') return <Frown className="w-5 h-5 text-red-500" />
    return <Meh className="w-5 h-5 text-yellow-500" />
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">감정 분석 대시보드</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI 기반 감정 패턴 분석 및 생산성 상관관계
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <Button
              key={days}
              size="sm"
              variant={selectedTimeRange === days ? 'default' : 'outline'}
              onClick={() => setSelectedTimeRange(days)}
            >
              {days}일
            </Button>
          ))}
        </div>
      </div>

      {/* Current Mood & Weekly Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Mood */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              현재 기분
            </CardTitle>
            <CardDescription>
              오늘의 감정 상태 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.currentMood ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMoodIcon(dashboardData.currentMood.sentiment, dashboardData.currentMood.sentimentScore)}
                    <div>
                      <div className="font-medium capitalize">
                        {dashboardData.currentMood.sentiment === 'positive' ? '긍정적' :
                         dashboardData.currentMood.sentiment === 'negative' ? '부정적' : '중립적'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        점수: {dashboardData.currentMood.sentimentScore.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    신뢰도 {(dashboardData.currentMood.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">감정 강도</div>
                  <Progress
                    value={dashboardData.currentMood.intensity * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                오늘의 감정 데이터가 없습니다.
                <br />
                텍스트를 입력하여 감정을 분석해보세요.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              주간 추세
            </CardTitle>
            <CardDescription>
              최근 7일간 감정 변화
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.weeklyTrend ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMoodIcon(dashboardData.weeklyTrend.sentiment, dashboardData.weeklyTrend.sentimentScore)}
                    <div>
                      <div className="font-medium">
                        평균 점수: {dashboardData.weeklyTrend.sentimentScore.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        강도: {(dashboardData.weeklyTrend.intensity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">생산성 상관관계</div>
                    <div className="font-medium">
                      {(dashboardData.productivityCorrelation * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">감정 안정성</div>
                  <Progress
                    value={(1 - dashboardData.weeklyTrend.intensity) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                충분한 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotion Distribution */}
      {dashboardData.emotionDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              감정 분포
            </CardTitle>
            <CardDescription>
              최근 {selectedTimeRange}일간 감정 구성
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dashboardData.emotionDistribution).map(([emotion, value]) => (
                <motion.div
                  key={emotion}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="text-2xl mb-2">{getEmotionIcon(emotion)}</div>
                  <div className="font-medium text-sm capitalize mb-1">
                    {emotion === 'joy' ? '기쁨' :
                     emotion === 'sadness' ? '슬픔' :
                     emotion === 'anger' ? '분노' :
                     emotion === 'fear' ? '두려움' :
                     emotion === 'surprise' ? '놀람' :
                     emotion === 'disgust' ? '혐오' :
                     emotion === 'trust' ? '신뢰' :
                     emotion === 'anticipation' ? '기대' : emotion}
                  </div>
                  <Progress
                    value={(value as number) * 100}
                    className="h-1"
                    style={{
                      backgroundColor: getEmotionColor(emotion) + '20'
                    }}
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {((value as number) * 100).toFixed(0)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              AI 인사이트
            </CardTitle>
            <CardDescription>
              감정 패턴 분석 결과와 맞춤 조언
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.insights.slice(0, 5).map((insight: EmotionInsight, index: number) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedInsight(insight)
                    setShowDetailModal(true)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getPriorityIcon(insight.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {insight.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            insight.priority === 'urgent' ? 'destructive' :
                            insight.priority === 'high' ? 'default' :
                            insight.priority === 'medium' ? 'secondary' : 'outline'
                          }
                          className="ml-2"
                        >
                          {insight.priority === 'urgent' ? '긴급' :
                           insight.priority === 'high' ? '높음' :
                           insight.priority === 'medium' ? '보통' : '낮음'}
                        </Badge>
                      </div>
                      {insight.recommendation && (
                        <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                          💡 {insight.recommendation}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Productivity Correlations */}
      {dashboardData.correlations && dashboardData.correlations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              감정-생산성 상관관계
            </CardTitle>
            <CardDescription>
              감정 상태가 생산성에 미치는 영향 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.correlations.slice(0, 7).map((correlation: EmotionProductivityCorrelation, index: number) => (
                <motion.div
                  key={correlation.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {new Date(correlation.date).toLocaleDateString()}
                    </div>
                    {getMoodIcon(correlation.emotion.sentiment, correlation.emotion.sentimentScore)}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      감정: {correlation.emotion.sentimentScore.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">태스크: </span>
                      <span className="font-medium">{correlation.productivity.tasksCompleted}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">품질: </span>
                      <span className="font-medium">{correlation.productivity.qualityScore}/10</span>
                    </div>
                    <Badge
                      variant={
                        correlation.correlation.overallCorrelation > 0.7 ? 'default' :
                        correlation.correlation.overallCorrelation > 0.4 ? 'secondary' : 'outline'
                      }
                    >
                      상관도 {(correlation.correlation.overallCorrelation * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insight Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight && getPriorityIcon(selectedInsight.priority)}
              {selectedInsight?.title}
            </DialogTitle>
            <DialogDescription>
              상세 분석 결과 및 개선 방안
            </DialogDescription>
          </DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">분석 내용</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedInsight.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">세부 인사이트</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedInsight.insight}
                </p>
              </div>

              {selectedInsight.recommendation && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 추천 사항
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedInsight.recommendation}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <Badge variant="outline">
                  신뢰도: {(selectedInsight.confidence * 100).toFixed(0)}%
                </Badge>
                <span className="text-gray-500 dark:text-gray-400">
                  {selectedInsight.createdAt.toLocaleDateString()}
                </span>
              </div>

              <Button onClick={() => setShowDetailModal(false)} className="w-full">
                확인
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmotionAnalyticsDashboard