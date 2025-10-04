import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Clock,
  Target,
  Users,
  Zap,
  Brain,
  Eye,
  Download,
  Filter,
  Settings,
  RefreshCw,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { toast } from 'sonner';
import { aiAnalytics } from '../../lib/ai-analytics';
import { apiClient } from '../../lib/enhanced-api';

interface ChartData {
  name: string;
  value: number;
  date: string;
  category?: string;
  [key: string]: any;
}

interface AnalyticsData {
  productivity: ChartData[];
  tasks: ChartData[];
  time: ChartData[];
  goals: ChartData[];
  collaboration: ChartData[];
  wellness: ChartData[];
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'radial' | 'scatter';
  title: string;
  description: string;
  dataKey: keyof AnalyticsData;
  color: string;
  metrics: string[];
}

const CHART_CONFIGS: ChartConfig[] = [
  {
    type: 'line',
    title: '생산성 트렌드',
    description: '시간별 생산성 변화 추이',
    dataKey: 'productivity',
    color: '#3b82f6',
    metrics: ['efficiency', 'focus', 'quality']
  },
  {
    type: 'bar',
    title: '작업 완료 현황',
    description: '일별 작업 완료 및 미완료 통계',
    dataKey: 'tasks',
    color: '#10b981',
    metrics: ['completed', 'pending', 'cancelled']
  },
  {
    type: 'area',
    title: '시간 활용 분석',
    description: '카테고리별 시간 배분 현황',
    dataKey: 'time',
    color: '#8b5cf6',
    metrics: ['work', 'break', 'learning', 'other']
  },
  {
    type: 'pie',
    title: '목표 달성률',
    description: '목표별 달성 현황 분포',
    dataKey: 'goals',
    color: '#f59e0b',
    metrics: ['achieved', 'progress', 'pending']
  },
  {
    type: 'radial',
    title: '협업 지수',
    description: '팀 협업 효율성 측정',
    dataKey: 'collaboration',
    color: '#ef4444',
    metrics: ['communication', 'participation', 'contribution']
  },
  {
    type: 'scatter',
    title: '웰니스 밸런스',
    description: '업무와 휴식의 균형 분석',
    dataKey: 'wellness',
    color: '#06b6d4',
    metrics: ['stress', 'energy', 'satisfaction']
  }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export const DataVisualization: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('productivity');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
  const [dateRange, setDateRange] = useState<{from: Date, to: Date} | undefined>();

  // 데이터 생성 함수
  const generateAnalyticsData = (range: string): AnalyticsData => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const baseData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        name: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        date: date.toISOString(),
        value: Math.random() * 100
      };
    });

    return {
      productivity: baseData.map(item => ({
        ...item,
        efficiency: 60 + Math.random() * 40,
        focus: 50 + Math.random() * 50,
        quality: 70 + Math.random() * 30,
        category: 'productivity'
      })),
      tasks: baseData.map(item => ({
        ...item,
        completed: Math.floor(Math.random() * 20) + 5,
        pending: Math.floor(Math.random() * 10) + 2,
        cancelled: Math.floor(Math.random() * 3),
        category: 'tasks'
      })),
      time: baseData.map(item => ({
        ...item,
        work: Math.floor(Math.random() * 8) + 4,
        break: Math.floor(Math.random() * 2) + 1,
        learning: Math.floor(Math.random() * 3) + 0.5,
        other: Math.floor(Math.random() * 2) + 0.5,
        category: 'time'
      })),
      goals: [
        { name: '달성', value: 65, date: '', category: 'achieved' },
        { name: '진행중', value: 25, date: '', category: 'progress' },
        { name: '대기', value: 10, date: '', category: 'pending' }
      ],
      collaboration: baseData.map(item => ({
        ...item,
        communication: 60 + Math.random() * 40,
        participation: 70 + Math.random() * 30,
        contribution: 50 + Math.random() * 50,
        category: 'collaboration'
      })),
      wellness: baseData.map(item => ({
        ...item,
        stress: Math.random() * 100,
        energy: Math.random() * 100,
        satisfaction: Math.random() * 100,
        category: 'wellness'
      }))
    };
  };

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 실제 환경에서는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateAnalyticsData(timeRange);
      setAnalyticsData(data);
      toast.success('데이터를 성공적으로 로드했습니다.');
    } catch (error) {
      toast.error('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 범위 변경 시 데이터 재로드
  useEffect(() => {
    loadData();
  }, [timeRange]);

  // 차트 렌더링 함수
  const renderChart = (config: ChartConfig, data: ChartData[] | undefined) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          데이터가 없습니다
        </div>
      );
    }

    const chartProps = {
      width: '100%',
      height: 300,
      data: data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'line':
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.metrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={COLORS[index]}
                  strokeWidth={2}
                  name={metric}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.metrics.map((metric, index) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={COLORS[index]}
                  name={metric}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.metrics.map((metric, index) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stackId="1"
                  stroke={COLORS[index]}
                  fill={COLORS[index]}
                  fillOpacity={0.6}
                  name={metric}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer {...chartProps}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data}>
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
                fill={config.color}
              />
              <Legend iconSize={18} layout="vertical" verticalAlign="middle" align="right" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer {...chartProps}>
            <ScatterChart data={data}>
              <CartesianGrid />
              <XAxis type="number" dataKey="stress" name="스트레스" />
              <YAxis type="number" dataKey="energy" name="에너지" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="웰니스 포인트" data={data} fill={config.color} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // 통계 요약 계산
  const calculateSummary = (data: ChartData[] | undefined) => {
    if (!data || data.length === 0) return null;

    const values = data.map(item => item.value).filter(v => !isNaN(v));
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { sum, avg, max, min, count: values.length };
  };

  // 데이터 내보내기
  const exportData = () => {
    if (!analyticsData) return;

    const csv = Object.entries(analyticsData)
      .flatMap(([key, data]) =>
        data.map(item => ({ category: key, ...item }))
      )
      .map(row => Object.values(row).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('데이터를 내보냈습니다.');
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">데이터 시각화</h2>
            <p className="text-gray-600">고급 분석 및 인사이트 대시보드</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'focus' : 'grid')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {viewMode === 'grid' ? '포커스' : '그리드'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 뷰 모드에 따른 렌더링 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHART_CONFIGS.map((config) => {
            const data = analyticsData[config.dataKey];
            const summary = calculateSummary(data);

            return (
              <motion.div
                key={config.dataKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: CHART_CONFIGS.indexOf(config) * 0.1 }}
              >
                <Card className="h-96">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedChart(config.dataKey);
                          setViewMode('focus');
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {summary && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>평균: {summary.avg.toFixed(1)}</span>
                        <span>최대: {summary.max.toFixed(1)}</span>
                        <span>최소: {summary.min.toFixed(1)}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="h-64">
                    {renderChart(config, data)}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // 포커스 모드
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {CHART_CONFIGS.find(c => c.dataKey === selectedChart)?.title}
                </CardTitle>
                <CardDescription>
                  {CHART_CONFIGS.find(c => c.dataKey === selectedChart)?.description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedChart} onValueChange={setSelectedChart}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_CONFIGS.map(config => (
                      <SelectItem key={config.dataKey} value={config.dataKey}>
                        {config.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {renderChart(
                CHART_CONFIGS.find(c => c.dataKey === selectedChart)!,
                analyticsData[selectedChart as keyof AnalyticsData]
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 인사이트 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">트렌드 분석</h4>
              <p className="text-sm text-blue-700">
                최근 7일간 생산성이 15% 증가했습니다. 현재 패턴을 유지하면 월간 목표 달성이 가능합니다.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">성과 요약</h4>
              <p className="text-sm text-green-700">
                작업 완료율이 85%로 높은 수준을 유지하고 있으며, 특히 오후 시간대 집중도가 향상되었습니다.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">개선 제안</h4>
              <p className="text-sm text-yellow-700">
                휴식 시간을 10% 늘리면 전체적인 웰니스 점수가 향상될 것으로 예상됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};