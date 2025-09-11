import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Brain,
  Calendar,
  FileText,
  Target,
  TrendingUp,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  MessageSquare,
  Video,
  Share2,
  Settings,
  Bell,
  Filter,
  RefreshCw,
  Maximize2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Rocket,
  Shield,
  Globe,
  Heart,
  Award,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import enhancedAPI, { type Note, type Task, type CalendarEvent } from '@/lib/enhanced-api.ts';
import SmartAIAssistant from './AI/SmartAIAssistant';

interface DashboardViewProps {
  onNavigate?: (page: string) => void;
  onAIToggle?: () => void;
  notes?: Note[];
  tasks?: Task[];
  events?: CalendarEvent[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigate, 
  onAIToggle,
  notes = [],
  tasks = [],
  events = []
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiMinimized, setAIMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tasks: true,
    calendar: true,
    notes: true,
    collaboration: true,
    analytics: true
  });

  // 실시간 시계
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 데이터 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // 데이터 새로고침 로직
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('데이터가 새로고침되었습니다! ✨');
    } catch (error) {
      toast.error('새로고침 중 오류가 발생했습니다');
    } finally {
      setRefreshing(false);
    }
  };

  // 통계 계산
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    todayTasks: tasks.filter(t => t.due_at && isToday(new Date(t.due_at))).length,
    totalNotes: notes.length,
    totalEvents: events.length,
    todayEvents: events.filter(e => isToday(new Date(e.start_time))).length,
    weekEvents: events.filter(e => isThisWeek(new Date(e.start_time))).length,
    productivity: Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)
  };

  const todayTasks = tasks.filter(t => t.due_at && isToday(new Date(t.due_at))).slice(0, 5);
  const todayEvents = events.filter(e => isToday(new Date(e.start_time))).slice(0, 3);
  const recentNotes = notes.slice(0, 4);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: '좋은 아침이에요!', icon: <Sun className="h-5 w-5" /> };
    if (hour < 18) return { text: '좋은 오후에요!', icon: <Coffee className="h-5 w-5" /> };
    return { text: '좋은 저녁이에요!', icon: <Moon className="h-5 w-5" /> };
  };

  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              className="h-32 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 relative">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Welcome Header */}
        <motion.div 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <motion.div 
                className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {greeting.icon}
              </motion.div>
              
              <div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {greeting.text}
                </motion.h1>
                <motion.p 
                  className="text-gray-600 dark:text-gray-400 mt-2 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {format(currentTime, 'yyyy년 M월 d일 EEEE HH:mm:ss', { locale: ko })}
                </motion.p>
                <motion.p 
                  className="text-indigo-600 dark:text-indigo-400 mt-1 font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  오늘도 생산적인 하루 되세요! 🚀
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  className="bg-white/60 dark:bg-gray-700/60 border-white/30 dark:border-gray-600/30 rounded-xl px-4 py-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowAI(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-6 py-2"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI 어시스턴트
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {[
            { 
              label: '오늘 할 일', 
              value: stats.todayTasks, 
              icon: <Target className="h-6 w-6" />, 
              color: 'from-blue-500 to-cyan-500',
              trend: '+12%'
            },
            { 
              label: '오늘 일정', 
              value: stats.todayEvents, 
              icon: <Calendar className="h-6 w-6" />, 
              color: 'from-green-500 to-emerald-500',
              trend: '+8%'
            },
            { 
              label: '총 노트', 
              value: stats.totalNotes, 
              icon: <FileText className="h-6 w-6" />, 
              color: 'from-purple-500 to-violet-500',
              trend: '+25%'
            },
            { 
              label: '완료율', 
              value: `${stats.productivity}%`, 
              icon: <TrendingUp className="h-6 w-6" />, 
              color: 'from-orange-500 to-red-500',
              trend: '+5%'
            },
            { 
              label: '이번 주 일정', 
              value: stats.weekEvents, 
              icon: <Activity className="h-6 w-6" />, 
              color: 'from-pink-500 to-rose-500',
              trend: '+15%'
            },
            { 
              label: '총 태스크', 
              value: stats.totalTasks, 
              icon: <CheckCircle2 className="h-6 w-6" />, 
              color: 'from-indigo-500 to-blue-500',
              trend: '+20%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">{stat.trend}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Tasks & Calendar */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Tasks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white">
                        <Target className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">오늘의 할 일</CardTitle>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {todayTasks.length}개
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('tasks')}
                        className="h-8 w-8 p-0"
                      >
                        {expandedSections.tasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.('tasks')}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <AnimatePresence>
                  {expandedSections.tasks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-6">
                        {todayTasks.length > 0 ? (
                          <div className="space-y-3">
                            {todayTasks.map((task, index) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                              >
                                <div className={`w-2 h-2 rounded-full ${
                                  task.priority === 'high' ? 'bg-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                  {task.status === 'completed' ? '완료' : task.priority === 'high' ? '긴급' : '일반'}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">오늘 할 일이 없습니다</p>
                            <Button 
                              onClick={() => onNavigate?.('tasks')}
                              className="mt-3 bg-gradient-to-r from-blue-600 to-cyan-600"
                            >
                              할 일 추가하기
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">오늘의 일정</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        {todayEvents.length}개
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection('calendar')}
                        className="h-8 w-8 p-0"
                      >
                        {expandedSections.calendar ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.('calendar')}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <AnimatePresence>
                  {expandedSections.calendar && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-6">
                        {todayEvents.length > 0 ? (
                          <div className="space-y-4">
                            {todayEvents.map((event, index) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                              >
                                <div className="flex flex-col items-center">
                                  <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                    {format(new Date(event.start_time), 'HH:mm')}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(event.start_time), 'MM/dd')}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                    {event.title}
                                  </h4>
                                  {event.location && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline">
                                  {event.category || '일반'}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">오늘 일정이 없습니다</p>
                            <Button 
                              onClick={() => onNavigate?.('calendar')}
                              className="mt-3 bg-gradient-to-r from-green-600 to-emerald-600"
                            >
                              일정 추가하기
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Notes & Collaboration */}
          <div className="space-y-8">
            
            {/* Recent Notes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">최근 노트</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate?.('notes')}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {recentNotes.length > 0 ? (
                    <div className="space-y-3">
                      {recentNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                            {note.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {note.content || '내용이 없습니다.'}
                          </p>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {note.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">노트가 없습니다</p>
                      <Button 
                        onClick={() => onNavigate?.('notes')}
                        className="mt-3 bg-gradient-to-r from-purple-600 to-violet-600"
                      >
                        첫 노트 작성하기
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Collaboration Quick Access */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl text-white">
                        <Users className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">협업 센터</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate?.('collaboration')}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <motion.div 
                      className="grid grid-cols-2 gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {[
                        { label: '실시간 편집', icon: <MessageSquare className="h-4 w-4" />, color: 'from-green-500 to-emerald-500' },
                        { label: '화상 회의', icon: <Video className="h-4 w-4" />, color: 'from-blue-500 to-cyan-500' },
                        { label: '파일 공유', icon: <Share2 className="h-4 w-4" />, color: 'from-purple-500 to-violet-500' },
                        { label: '팀 채팅', icon: <Users className="h-4 w-4" />, color: 'from-pink-500 to-rose-500' }
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          className={`p-3 bg-gradient-to-r ${item.color} text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onNavigate?.('collaboration')}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {item.icon}
                            <span className="text-xs font-medium">{item.label}</span>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">활성 협업 세션</h4>
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">활성 세션이 없습니다</p>
                        <Button 
                          size="sm"
                          onClick={() => onNavigate?.('collaboration')}
                          className="mt-2 bg-gradient-to-r from-indigo-600 to-blue-600"
                        >
                          새 세션 시작
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">AI 인사이트</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">생산성 팁</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        오늘 완료한 작업이 {stats.completedTasks}개입니다. 남은 작업을 우선순위대로 정리해보세요! 🎯
                      </p>
                    </div>
                    
                    <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">시간 관리</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        이번 주 일정이 {stats.weekEvents}개 있습니다. 적절한 휴식 시간도 확보하세요! ⏰
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setShowAI(true)}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI와 더 자세히 상담하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Assistant Overlay */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  AI 대시보드 어시스턴트
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAI(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="h-[calc(80vh-80px)]">
                <SmartAIAssistant
                  notes={notes}
                  tasks={tasks}
                  events={events}
                  currentContext="dashboard"
                  onNoteCreate={(note) => {
                    onNavigate?.('notes');
                    setShowAI(false);
                  }}
                  onTaskCreate={(task) => {
                    onNavigate?.('tasks');
                    setShowAI(false);
                  }}
                  onEventCreate={(event) => {
                    onNavigate?.('calendar');
                    setShowAI(false);
                  }}
                  className="h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Button */}
      <AnimatePresence>
        {!showAI && (
          <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.button
              onClick={() => setShowAI(true)}
              className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(99, 102, 241, 0.7)",
                  "0 0 0 10px rgba(99, 102, 241, 0)",
                  "0 0 0 20px rgba(99, 102, 241, 0)"
                ]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <Brain className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardView;
