import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  BarChart3,
  Eye,
  Settings,
  Maximize2,
  Grid3X3,
  List,
  Filter,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Users,
  Clock,
  Star,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { AIInsightEngine } from '../components/advanced/AIInsightEngine';
import { RealTimeMonitoring } from '../components/advanced/RealTimeMonitoring';
import { DataVisualization } from '../components/advanced/DataVisualization';

interface DashboardConfig {
  layout: 'grid' | 'stack' | 'sidebar';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  showAnimations: boolean;
  compactMode: boolean;
}

interface QuickStat {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ReactNode;
}

export const AdvancedDashboard: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig>({
    layout: 'grid',
    theme: 'light',
    refreshInterval: 30000,
    showAnimations: true,
    compactMode: false
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);

  // 퀵 스탯 데이터 생성
  useEffect(() => {
    const stats: QuickStat[] = [
      {
        label: '오늘 생산성',
        value: '87%',
        change: 12,
        trend: 'up',
        color: 'text-blue-600',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        label: '완료된 작업',
        value: 23,
        change: 5,
        trend: 'up',
        color: 'text-green-600',
        icon: <Target className="h-4 w-4" />
      },
      {
        label: '집중 시간',
        value: '6.2h',
        change: -3,
        trend: 'down',
        color: 'text-purple-600',
        icon: <Clock className="h-4 w-4" />
      },
      {
        label: 'AI 점수',
        value: '92',
        change: 8,
        trend: 'up',
        color: 'text-indigo-600',
        icon: <Brain className="h-4 w-4" />
      }
    ];
    setQuickStats(stats);
  }, []);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = (newLayout: DashboardConfig['layout']) => {
    setConfig(prev => ({ ...prev, layout: newLayout }));
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 퀵 액션들
  const quickActions = [
    {
      label: '새 작업 생성',
      icon: <Target className="h-4 w-4" />,
      action: () => console.log('새 작업'),
      color: 'bg-blue-500'
    },
    {
      label: '노트 작성',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => console.log('노트 작성'),
      color: 'bg-green-500'
    },
    {
      label: '일정 추가',
      icon: <Calendar className="h-4 w-4" />,
      action: () => console.log('일정 추가'),
      color: 'bg-purple-500'
    },
    {
      label: 'AI 분석',
      icon: <Brain className="h-4 w-4" />,
      action: () => setActiveTab('ai-insights'),
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${config.compactMode ? 'p-2' : 'p-6'}`}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                고급 대시보드
              </h1>
              <p className="text-gray-600">AI 기반 생산성 분석 및 실시간 모니터링</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 레이아웃 선택 */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1">
              {(['grid', 'stack', 'sidebar'] as const).map((layout) => (
                <Button
                  key={layout}
                  variant={config.layout === layout ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleLayoutChange(layout)}
                  className="h-8 w-8 p-0"
                >
                  {layout === 'grid' && <Grid3X3 className="h-4 w-4" />}
                  {layout === 'stack' && <List className="h-4 w-4" />}
                  {layout === 'sidebar' && <Eye className="h-4 w-4" />}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              {isFullscreen ? '종료' : '전체화면'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, compactMode: !prev.compactMode }))}
            >
              <Filter className="h-4 w-4 mr-2" />
              {config.compactMode ? '일반' : '컴팩트'}
            </Button>
          </div>
        </div>

        {/* 퀵 스탯 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gray-100 rounded-lg ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' :
                      stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
                      {Math.abs(stat.change)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 퀵 액션 */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-2">빠른 작업:</span>
          {quickActions.map((action, index) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="h-8"
            >
              <div className={`p-1 rounded ${action.color} text-white mr-2`}>
                {action.icon}
              </div>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            개요
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI 인사이트
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            실시간 모니터링
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            데이터 분석
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className={`grid gap-6 ${
            config.layout === 'grid' ? 'grid-cols-1 lg:grid-cols-2' :
            config.layout === 'stack' ? 'grid-cols-1' :
            'grid-cols-1 lg:grid-cols-3'
          }`}>
            {/* 일일 목표 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  일일 목표
                </CardTitle>
                <CardDescription>오늘의 목표 달성률</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>작업 완료</span>
                      <span>8/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>집중 시간</span>
                      <span>6.2/8h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '77.5%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>학습 시간</span>
                      <span>1.5/2h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 최근 활동 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  최근 활동
                </CardTitle>
                <CardDescription>최근 2시간 동안의 활동</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '15:30', action: '프로젝트 계획 작성 완료', type: 'task' },
                    { time: '14:45', action: '팀 미팅 참여', type: 'meeting' },
                    { time: '14:15', action: '새로운 아이디어 노트 추가', type: 'note' },
                    { time: '13:30', action: '일정 업데이트', type: 'calendar' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'task' ? 'bg-blue-500' :
                        activity.type === 'meeting' ? 'bg-green-500' :
                        activity.type === 'note' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 주간 트렌드 */}
            {config.layout !== 'sidebar' && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    주간 성과 트렌드
                  </CardTitle>
                  <CardDescription>지난 7일간의 성과 변화</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>차트 데이터를 로드하는 중...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI 인사이트 탭 */}
        <TabsContent value="ai-insights">
          <AIInsightEngine />
        </TabsContent>

        {/* 실시간 모니터링 탭 */}
        <TabsContent value="monitoring">
          <RealTimeMonitoring />
        </TabsContent>

        {/* 데이터 분석 탭 */}
        <TabsContent value="analytics">
          <DataVisualization />
        </TabsContent>
      </Tabs>

      {/* 설정 패널 (우측 하단 플로팅) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              대시보드 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">애니메이션</span>
              <Switch
                checked={config.showAnimations}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, showAnimations: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">컴팩트 모드</span>
              <Switch
                checked={config.compactMode}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, compactMode: checked }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">새로고침 간격</label>
              <Select
                value={config.refreshInterval.toString()}
                onValueChange={(value) =>
                  setConfig(prev => ({ ...prev, refreshInterval: parseInt(value) }))
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">10초</SelectItem>
                  <SelectItem value="30000">30초</SelectItem>
                  <SelectItem value="60000">1분</SelectItem>
                  <SelectItem value="300000">5분</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};