import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, CheckSquare, MessageCircle, Plus, Play, Pause, 
  Clock, Target, TrendingUp, Bell, Zap, Brain, Settings
} from '@phosphor-icons/react'
import { useRealTimeCalendar, CalendarEvent } from '../hooks/useRealTimeCalendar'
import { useRealTaskManager, Task } from '../hooks/useRealTaskManager'
import { useRealAI } from '../hooks/useRealAI'
import { toast } from 'sonner'

interface RealDashboardProps {
  onOpenCalendar: () => void
  onOpenTasks: () => void
  onOpenAI: () => void
}

export const RealDashboard: React.FC<RealDashboardProps> = ({
  onOpenCalendar,
  onOpenTasks,
  onOpenAI
}) => {
  const calendar = useRealTimeCalendar()
  const taskManager = useRealTaskManager()
  const ai = useRealAI()
  
  const [quickAddText, setQuickAddText] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 알림 권한 요청
  useEffect(() => {
    calendar.requestNotificationPermission()
  }, [calendar])

  // 오늘의 통계
  const todayStats = calendar.getTodaysSummary()
  const taskStats = taskManager.getTaskStats()
  const todaysTasks = taskManager.getTodaysTasks()

  // 빠른 태스크 추가
  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return
    
    setIsAddingTask(true)
    try {
      await taskManager.addTask({
        title: quickAddText,
        completed: false,
        priority: 'medium',
        tags: [],
        category: 'general'
      })
      
      setQuickAddText('')
      toast.success('태스크가 추가되었습니다!')
    } catch (error) {
      toast.error('태스크 추가에 실패했습니다.')
    } finally {
      setIsAddingTask(false)
    }
  }

  // 빠른 이벤트 추가
  const handleQuickEvent = () => {
    const now = new Date()
    const eventStart = new Date(now.getTime() + 60 * 60 * 1000) // 1시간 후
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000) // 2시간 후
    
    calendar.addEvent({
      title: '새 이벤트',
      start: eventStart,
      end: eventEnd,
      type: 'event',
      priority: 'medium'
    })
    
    toast.success('이벤트가 추가되었습니다!')
  }

  // 태스크 완료 토글
  const handleTaskToggle = (taskId: string) => {
    taskManager.toggleTaskCompletion(taskId)
    toast.success('태스크 상태가 업데이트되었습니다!')
  }

  // 포모도로 타이머 시작
  const startPomodoroTimer = (taskId: string) => {
    taskManager.startTimeTracking(taskId)
    toast.success('포모도로 타이머가 시작되었습니다! (25분)')
    
    // 25분 후 자동 정지
    setTimeout(() => {
      taskManager.stopTimeTracking()
      toast.success('포모도로 완료! 5분 휴식하세요.')
    }, 25 * 60 * 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              실시간 생산성 대시보드
            </h1>
            <p className="text-gray-300 mt-1">
              {currentTime.toLocaleDateString('ko-KR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} {currentTime.toLocaleTimeString('ko-KR')}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onOpenCalendar}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>캘린더</span>
            </button>
            <button
              onClick={onOpenTasks}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <CheckSquare className="w-5 h-5" />
              <span>태스크</span>
            </button>
            <button
              onClick={onOpenAI}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>AI 어시스턴트</span>
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">오늘 일정</p>
                <p className="text-2xl font-bold text-white">{todayStats.total}</p>
                <p className="text-green-400 text-sm">{todayStats.completed} 완료</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">전체 태스크</p>
                <p className="text-2xl font-bold text-white">{taskStats.total}</p>
                <p className="text-green-400 text-sm">{taskStats.completionRate.toFixed(1)}% 완료율</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">생산성</p>
                <p className="text-2xl font-bold text-white">{taskStats.productivity.toFixed(0)}%</p>
                <p className="text-purple-400 text-sm">시간 효율성</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">긴급 태스크</p>
                <p className="text-2xl font-bold text-white">{taskStats.overdue}</p>
                <p className="text-red-400 text-sm">지연됨</p>
              </div>
              <Bell className="w-8 h-8 text-red-400" />
            </div>
          </motion.div>
        </div>

        {/* 빠른 추가 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">빠른 추가</h3>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder="새 태스크를 입력하세요..."
                  className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                />
                <button
                  onClick={handleQuickAdd}
                  disabled={isAddingTask || !quickAddText.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </button>
              </div>
            </div>
            <button
              onClick={handleQuickEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>이벤트 추가</span>
            </button>
          </div>
        </div>

        {/* 오늘의 태스크 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">오늘 할 일</h3>
              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-sm">
                {todaysTasks.length}개
              </span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {todaysTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                  >
                    <button
                      onClick={() => handleTaskToggle(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-gray-400 hover:border-green-400'
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-3 h-3 text-white" />}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.priority === 'high' ? 'bg-red-600' :
                          task.priority === 'medium' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        } text-white`}>
                          {task.priority}
                        </span>
                        {task.estimatedTime && (
                          <span className="text-gray-300 text-xs flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.estimatedTime}분
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => startPomodoroTimer(task.id)}
                      className="p-2 text-purple-400 hover:bg-purple-600/20 rounded"
                      title="포모도로 시작"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {todaysTasks.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>오늘 할 일이 없습니다!</p>
                </div>
              )}
            </div>
          </div>

          {/* 다가오는 이벤트 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">다가오는 일정</h3>
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                {todayStats.upcoming}개
              </span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {calendar.getEventsForDate(new Date())
                .filter(event => new Date(event.start) > new Date())
                .slice(0, 5)
                .map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{event.title}</p>
                      <p className="text-gray-300 text-sm">
                        {new Date(event.start).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      event.priority === 'high' ? 'bg-red-600' :
                      event.priority === 'medium' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    } text-white`}>
                      {event.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 실시간 타이머 */}
        {taskManager.activeTimer && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-xl shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="font-medium">타이머 실행 중</p>
                <p className="text-sm opacity-80">
                  {Math.round((Date.now() - taskManager.activeTimer.startTime.getTime()) / 60000)}분 경과
                </p>
              </div>
              <button
                onClick={taskManager.stopTimeTracking}
                className="p-2 hover:bg-white/20 rounded"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
