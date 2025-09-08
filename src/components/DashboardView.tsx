import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Brain, Sparkles, TrendingUp, Users, Clock, 
  Target, CheckSquare, FileText, Calendar, BarChart3 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { FeatureCard, StatsCard, InteractiveCard } from './ui/card-advanced'
import { listNotes, listTasks } from '../api/client'
import { toast } from 'sonner'
import { format, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DashboardViewProps {
  state: any
  stats: any
  insights: any[]
  onNavigate: (page: string) => void
  ragEnabled: boolean
  crdtEnabled: boolean
  aiMode: string
}

export function DashboardView({ 
  state, 
  stats, 
  insights, 
  onNavigate, 
  ragEnabled, 
  crdtEnabled, 
  aiMode 
}: DashboardViewProps) {
  const [recentNotes, setRecentNotes] = useState<any[]>([])
  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [notesData, tasksData] = await Promise.all([
        listNotes(),
        listTasks()
      ])
      
      // Sort notes by updated_at and take the 5 most recent
      const sortedNotes = (notesData || []).sort((a: any, b: any) => 
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      )
      setRecentNotes(sortedNotes.slice(0, 5))
      
      // Filter active tasks (not completed) and sort by priority/due date
      const activeTasks = (tasksData || []).filter((task: any) => 
        task.status !== 'completed' && task.status !== 'cancelled'
      ).sort((a: any, b: any) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        // Then sort by due date
        const aDue = a.due_at || a.due_date
        const bDue = b.due_at || b.due_date
        
        if (aDue && bDue) {
          return new Date(aDue).getTime() - new Date(bDue).getTime()
        } else if (aDue) {
          return -1
        } else if (bDue) {
          return 1
        }
        
        return 0
      })
      
      setActiveTasks(activeTasks.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('대시보드 데이터 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString);
      }
      
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Invalid Date';
      }
      
      return format(date, 'M월 d일', { locale: ko });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Invalid Date';
    }
  }

  const quickActions = [
    { icon: Plus, label: 'Quick Note', action: () => onNavigate('notes') },
    { icon: CheckSquare, label: 'New Task', action: () => onNavigate('tasks') },
    { icon: Calendar, label: 'Schedule Event', action: () => onNavigate('calendar') },
    { icon: Brain, label: 'AI Workspace', action: () => onNavigate('ai-workspace') }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  Welcome back! 👋
                </motion.h1>
                <motion.p 
                  className="text-lg text-slate-600 dark:text-slate-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Your AI-powered workspace is ready to help you achieve more
                </motion.p>
              </div>
              <motion.div 
                className="hidden md:flex items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-purple-600">{stats.productivity}%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Productivity</div>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-slate-700/50 rounded-2xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-blue-600">{stats.aiInteractions}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">AI Assists</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Notes</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalNotes}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">+{Math.floor(stats.totalNotes * 0.1)} this week</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <Card className="h-full bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Active Tasks</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pendingTasks}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stats.completedTasks} completed</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-2xl group-hover:bg-orange-500/20 transition-colors">
                    <CheckSquare className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Productivity</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.productivity}%</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">+5% from last week</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 transition-colors">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <Card className="h-full bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">AI Interactions</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.aiInteractions}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Smart assistance</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                    <Brain className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-base">
                Jump into your most productive workflows with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center gap-3 bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={action.action}
                    >
                      <action.icon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                AI Insights
              </CardTitle>
              <CardDescription className="text-base">
                Intelligent recommendations based on your activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                    <Brain className="w-8 h-8 text-purple-500 opacity-60" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No insights yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Start creating content to see AI-powered recommendations and insights!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {insights.slice(0, 3).map((insight, index) => (
                    <motion.div 
                      key={index} 
                      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                    >
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{insight.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{insight.content}</p>
                      <Badge variant="secondary" className="bg-white/70 dark:bg-slate-700/70">
                        {insight.type}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Card className="h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Recent Notes
                </CardTitle>
                <CardDescription>Your latest thoughts and ideas</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : recentNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-500 opacity-60" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">No notes yet. Create your first note!</p>
                    <Button 
                      variant="outline" 
                      onClick={() => onNavigate('notes')}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotes.map((note: any, index: number) => (
                      <motion.div 
                        key={note.id || index} 
                        className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 + index * 0.1 }}
                      >
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">{note.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                          {note.content || note.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {note.tags?.slice(0, 2).map((tag: string, tagIndex: number) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs bg-white/70 dark:bg-slate-600/70">
                                {tag}
                              </Badge>
                            ))}
                            {note.tags?.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-600/70">
                                +{note.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(note.updated_at || note.created_at)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600"
                      onClick={() => onNavigate('notes')}
                    >
                      View All Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <Card className="h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  Active Tasks
                </CardTitle>
                <CardDescription>What needs your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
                  </div>
                ) : activeTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-orange-500 opacity-60" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">No active tasks. Add your first task!</p>
                    <Button 
                      variant="outline" 
                      onClick={() => onNavigate('tasks')}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTasks.map((task: any, index: number) => (
                      <motion.div 
                        key={task.id || index} 
                        className="p-4 bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + index * 0.1 }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <h4 className="font-medium text-slate-900 dark:text-white flex-1 line-clamp-1">{task.title}</h4>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-600/70">
                              {task.priority}
                            </Badge>
                            {task.status && task.status !== 'pending' && (
                              <Badge variant="outline" className="text-xs bg-white/70 dark:bg-slate-600/70">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          {(task.due_at || task.due_date) && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              {formatDate(task.due_at || task.due_date)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600"
                      onClick={() => onNavigate('tasks')}
                    >
                      View All Tasks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
