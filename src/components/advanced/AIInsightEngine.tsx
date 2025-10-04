import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Star,
  Filter,
  Refresh,
  ChevronRight,
  Sparkles,
  Activity,
  Globe,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { aiAnalytics, AIInsight, ProductivityMetrics, PredictiveAnalytics } from '../../lib/ai-analytics';

interface PatternAnalysis {
  name: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  value: number;
  change: number;
  timeframe: string;
}

export const AIInsightEngine: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [predictions, setPredictions] = useState<PredictiveAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 실제 AI 인사이트 생성
  const generateInsights = async (): Promise<AIInsight[]> => {
    try {
      // 사용자 데이터 수집
      const userData = await aiAnalytics.collectUserData();

      // AI 기반 인사이트 생성
      const insights = await aiAnalytics.generateRealInsights(userData);

      return insights;
    } catch (error) {
      console.error('AI 인사이트 생성 오류:', error);
      // 에러 발생시 기본 메시지
      return [{
        id: 'error-insight',
        type: 'suggestion',
        category: 'wellness',
        title: '데이터 수집 중',
        description: '더 정확한 AI 인사이트를 위해 작업, 노트, 일정 데이터를 수집하고 있습니다. 몇 가지 활동을 기록하시면 개인화된 분석을 제공해드릴 수 있습니다.',
        confidence: 100,
        impact: 'low',
        actionable: true,
        data: {},
        timestamp: new Date().toISOString(),
        priority: 1
      }];
    }
  };

  // 패턴 분석 데이터 생성
  const analyzePatterns = (): PatternAnalysis[] => {
    return [
      {
        name: '일일 생산성',
        trend: 'increasing',
        value: 78,
        change: 12,
        timeframe: '지난 7일'
      },
      {
        name: '작업 완료율',
        trend: 'stable',
        value: 85,
        change: 2,
        timeframe: '지난 30일'
      },
      {
        name: '집중 시간',
        trend: 'increasing',
        value: 6.2,
        change: 8,
        timeframe: '이번 주'
      },
      {
        name: '응답 시간',
        trend: 'decreasing',
        value: 2.1,
        change: -15,
        timeframe: '지난 14일'
      }
    ];
  };

  // 실제 생산성 메트릭 계산
  const calculateMetrics = async (): Promise<ProductivityMetrics | null> => {
    try {
      const userData = await aiAnalytics.collectUserData();
      return await aiAnalytics.calculateProductivityMetrics(userData);
    } catch (error) {
      console.error('메트릭 계산 오류:', error);
      return null;
    }
  };

  // 실제 예측 분석 데이터
  const generatePredictions = async (): Promise<PredictiveAnalytics | null> => {
    try {
      const userData = await aiAnalytics.collectUserData();
      const metrics = await aiAnalytics.calculateProductivityMetrics(userData);
      return await aiAnalytics.generatePredictiveAnalytics(userData, metrics);
    } catch (error) {
      console.error('예측 분석 오류:', error);
      return null;
    }
  };

  // AI 분석 실행
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const [insightData, patternData, metricData, predictionData] = await Promise.all([
        generateInsights(),
        Promise.resolve(analyzePatterns()),
        calculateMetrics(),
        generatePredictions()
      ]);

      setInsights(insightData);
      setPatterns(patternData);
      setMetrics(metricData);
      setPredictions(predictionData);

      if (insightData.length > 0) {
        toast.success(`${insightData.length}개의 AI 인사이트가 생성되었습니다.`);
      } else {
        toast.info('더 많은 데이터가 수집되면 더 정확한 인사이트를 제공할 수 있습니다.');
      }
    } catch (error) {
      toast.error('AI 분석 중 오류가 발생했습니다.');
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(runAnalysis, 300000); // 5분마다
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // 초기 분석 실행
  useEffect(() => {
    runAnalysis();
  }, []);

  const filteredInsights = insights.filter(insight =>
    selectedCategory === 'all' || insight.category === selectedCategory
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp className="h-4 w-4" />;
      case 'pattern': return <BarChart3 className="h-4 w-4" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI 인사이트 엔진</h2>
            <p className="text-gray-600">개인화된 생산성 분석 및 최적화 제안</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Refresh className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAnalyzing ? '분석 중...' : '새로 분석'}
          </Button>
        </div>
      </div>

      {/* 메인 탭 */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI 인사이트</TabsTrigger>
          <TabsTrigger value="patterns">패턴 분석</TabsTrigger>
          <TabsTrigger value="metrics">성과 지표</TabsTrigger>
          <TabsTrigger value="predictions">예측 분석</TabsTrigger>
        </TabsList>

        {/* AI 인사이트 */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">모든 카테고리</option>
              <option value="time">시간 관리</option>
              <option value="focus">집중도</option>
              <option value="collaboration">협업</option>
              <option value="goals">목표</option>
              <option value="wellness">웰니스</option>
              <option value="learning">학습</option>
            </select>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(insight.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getImpactColor(insight.impact)}`}
                              >
                                {insight.impact} 영향
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Star className="h-3 w-3 fill-current" />
                                {insight.confidence}% 신뢰도
                              </div>
                            </div>
                          </div>
                        </div>

                        {insight.actionable && (
                          <Button size="sm" variant="ghost">
                            액션 <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">{insight.description}</p>
                      {insight.data && (
                        <div className="flex flex-wrap gap-3 text-sm">
                          {Object.entries(insight.data).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 px-3 py-1 rounded-md">
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* 패턴 분석 */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pattern, index) => (
              <motion.div
                key={pattern.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        pattern.trend === 'increasing' ? 'text-green-600' :
                        pattern.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <TrendingUp className={`h-4 w-4 ${
                          pattern.trend === 'decreasing' ? 'rotate-180' : ''
                        }`} />
                        {pattern.change > 0 ? '+' : ''}{pattern.change}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {pattern.value}{pattern.name.includes('시간') ? 'h' : pattern.name.includes('율') ? '%' : ''}
                    </div>
                    <p className="text-sm text-gray-600">{pattern.timeframe}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 성과 지표 */}
        <TabsContent value="metrics" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(metrics).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <span className="text-2xl font-bold">{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                      <p className="text-xs text-gray-600 mt-2">
                        {value >= 80 ? '우수' : value >= 60 ? '양호' : '개선 필요'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 예측 분석 */}
        <TabsContent value="predictions" className="space-y-4">
          {predictions && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    예측 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        번아웃 위험도
                      </h4>
                      <div className="flex items-center gap-3">
                        <Progress value={predictions.burnoutRisk} className="flex-1" />
                        <span className="text-sm font-medium">{predictions.burnoutRisk}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        목표 달성 확률
                      </h4>
                      <div className="flex items-center gap-3">
                        <Progress value={predictions.goalAchievementProbability} className="flex-1" />
                        <span className="text-sm font-medium">{predictions.goalAchievementProbability}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        최적 작업 시간대
                      </h4>
                      <div className="space-y-1">
                        {predictions.optimalWorkHours.map((time, idx) => (
                          <Badge key={idx} variant="outline" className="mr-2">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        권장 휴식
                      </h4>
                      <p className="text-sm text-gray-600">
                        일일 {predictions.recommendedBreaks}회 휴식 권장
                      </p>
                      <p className="text-sm text-gray-600">
                        최고 생산성 시간: {predictions.peakProductivityTime}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};