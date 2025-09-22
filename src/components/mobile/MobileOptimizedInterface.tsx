import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  Menu,
  Home,
  Calendar,
  FileText,
  CheckSquare,
  Users,
  Settings,
  Search,
  Plus,
  ArrowLeft,
  MoreVertical,
  ChevronRight,
  Star,
  Bell,
  User,
  Filter,
  SortAsc,
  Grid,
  List,
  Zap,
  Heart,
  Share2,
  Bookmark,
  X,
  ChevronUp,
  ChevronDown,
  Mic,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';

interface MobileOptimizedInterfaceProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAction?: (action: string, data?: any) => void;
  className?: string;
}

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export const MobileOptimizedInterface: React.FC<MobileOptimizedInterfaceProps> = ({
  currentPage,
  onNavigate,
  onAction,
  className = ""
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pullToRefreshDistance, setPullToRefreshDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSwipeItem, setActiveSwipeItem] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [0, 1]);

  // Navigation items for mobile
  const navigationItems = [
    { id: 'dashboard', label: '대시보드', icon: <Home className="h-5 w-5" />, color: 'text-blue-500' },
    { id: 'tasks', label: '할 일', icon: <CheckSquare className="h-5 w-5" />, color: 'text-green-500' },
    { id: 'calendar', label: '캘린더', icon: <Calendar className="h-5 w-5" />, color: 'text-purple-500' },
    { id: 'notes', label: '노트', icon: <FileText className="h-5 w-5" />, color: 'text-orange-500' },
    { id: 'collaboration', label: '협업', icon: <Users className="h-5 w-5" />, color: 'text-pink-500' }
  ];

  // Quick actions
  const quickActions = [
    {
      label: '새 할 일',
      icon: <CheckSquare className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
      action: () => onAction?.('new-task')
    },
    {
      label: '새 노트',
      icon: <FileText className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
      action: () => onAction?.('new-note')
    },
    {
      label: '음성 메모',
      icon: <Mic className="h-5 w-5" />,
      color: 'from-purple-500 to-violet-500',
      action: () => onAction?.('voice-memo')
    },
    {
      label: '사진 캡처',
      icon: <Camera className="h-5 w-5" />,
      color: 'from-pink-500 to-rose-500',
      action: () => onAction?.('photo-capture')
    }
  ];

  // Sample data for demonstration
  const sampleItems = [
    {
      id: '1',
      title: '프로젝트 미팅 준비',
      subtitle: '오후 2시 회의실 A',
      type: 'task',
      priority: 'high',
      completed: false,
      time: '2시간 전'
    },
    {
      id: '2',
      title: '아이디어 노트: 새로운 기능',
      subtitle: 'AI 기반 스케줄링 시스템',
      type: 'note',
      priority: 'medium',
      completed: false,
      time: '3시간 전'
    },
    {
      id: '3',
      title: '팀 브레인스토밍',
      subtitle: '다음 주 월요일 오전 10시',
      type: 'event',
      priority: 'medium',
      completed: false,
      time: '5시간 전'
    }
  ];

  // Handle pull to refresh
  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('새로고침 완료! ✨');
    }, 2000);
  }, []);

  // Handle drag
  const handleDrag = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 0 && window.scrollY === 0) {
      setPullToRefreshDistance(Math.min(info.offset.y, 100));
      if (info.offset.y > 100 && !isRefreshing) {
        handlePullToRefresh();
      }
    }
  }, [isRefreshing, handlePullToRefresh]);

  // Swipe actions for items
  const getSwipeActions = (item: any): SwipeAction[] => [
    {
      id: 'complete',
      label: item.completed ? '미완료' : '완료',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'bg-green-500',
      action: () => {
        toast.success(item.completed ? '미완료로 표시됨' : '완료로 표시됨');
        setActiveSwipeItem(null);
      }
    },
    {
      id: 'bookmark',
      label: '북마크',
      icon: <Bookmark className="h-4 w-4" />,
      color: 'bg-yellow-500',
      action: () => {
        toast.success('북마크에 추가됨');
        setActiveSwipeItem(null);
      }
    },
    {
      id: 'share',
      label: '공유',
      icon: <Share2 className="h-4 w-4" />,
      color: 'bg-blue-500',
      action: () => {
        toast.success('공유 메뉴 열림');
        setActiveSwipeItem(null);
      }
    }
  ];

  // Touch vibration feedback
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Mobile Header */}
      <motion.header
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                vibrate();
              }}
              className="h-10 w-10 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="font-bold text-xl">JIHYUNG</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {navigationItems.find(item => item.id === currentPage)?.label || currentPage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-10 w-10 p-0"
            >
              {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
            />
          </div>
        </div>

        {/* Pull to Refresh Indicator */}
        {pullToRefreshDistance > 0 && (
          <motion.div
            style={{ opacity }}
            className="absolute top-full left-0 right-0 flex justify-center py-2 bg-blue-50 dark:bg-blue-950"
          >
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              {isRefreshing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"
                  />
                  <span className="text-sm">새로고침 중...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-sm">당겨서 새로고침</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl"
            >
              <div className="p-6">
                {/* Profile Section */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">지형</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">생산성 마스터</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMenuOpen(false);
                        vibrate();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        currentPage === item.id
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={item.color}>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      {currentPage === item.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </motion.button>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl">
                  <h4 className="font-semibold mb-3">오늘의 성과</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">8</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">완료됨</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">진행 중</div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="mt-8">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onNavigate('settings');
                      setIsMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    설정
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        className="flex-1 p-4 space-y-4"
      >
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: '오늘 할 일',
              value: '8/15',
              icon: <CheckSquare className="h-4 w-4" />,
              color: 'from-green-500 to-emerald-500',
              progress: 53
            },
            {
              label: '이번 주 일정',
              value: '12',
              icon: <Calendar className="h-4 w-4" />,
              color: 'from-blue-500 to-cyan-500',
              progress: 75
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-green-600 dark:text-green-400">+{stat.progress}%</div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</p>
                <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Content List */}
        <div className="space-y-3">
          {sampleItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Swipe Actions Background */}
              <div className="absolute inset-0 flex items-center justify-end pr-4 bg-gradient-to-l from-red-500 via-yellow-500 to-green-500 rounded-2xl">
                <div className="flex gap-4">
                  {getSwipeActions(item).map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`${action.color} text-white p-3 rounded-xl`}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Item */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(event, info) => {
                  if (info.offset.x < -60) {
                    setActiveSwipeItem(item.id);
                    vibrate([50, 50, 50]);
                  } else {
                    setActiveSwipeItem(null);
                  }
                }}
                className="relative z-10"
              >
                <Card className={`p-4 cursor-pointer transition-all ${
                  activeSwipeItem === item.id ? 'translate-x-[-120px]' : ''
                } ${viewMode === 'list' ? 'mb-2' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {item.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <Badge variant="secondary" className="text-xs">
                            {item.type}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Time and Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Heart className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center py-8">
          <Button variant="outline" className="rounded-full">
            더 보기
          </Button>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-around p-2">
          {navigationItems.slice(0, 4).map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                vibrate();
              }}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </motion.button>
          ))}

          {/* Quick Action Button */}
          <motion.button
            onClick={() => {
              setQuickActionOpen(true);
              vibrate([50, 50]);
            }}
            className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">추가</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Action Modal */}
      <AnimatePresence>
        {quickActionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setQuickActionOpen(false)}
            />

            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 p-6"
            >
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />

              <h3 className="text-xl font-bold mb-6 text-center">빠른 작업</h3>

              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    onClick={() => {
                      action.action();
                      setQuickActionOpen(false);
                      vibrate();
                    }}
                    className={`p-6 bg-gradient-to-r ${action.color} text-white rounded-2xl flex flex-col items-center gap-3`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {action.icon}
                    <span className="font-medium text-sm">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setQuickActionOpen(false)}
                className="w-full mt-6"
              >
                취소
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileOptimizedInterface;