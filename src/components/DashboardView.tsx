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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Welcome back! 👋
        </motion.h1>
        <p className="text-muted-foreground">
          Here's what's happening in your AI-powered workspace
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Notes"
          value={stats.totalNotes}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={<CheckSquare className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="Productivity"
          value={`${stats.productivity}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="AI Interactions"
          value={stats.aiInteractions}
          icon={<Brain className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into your most common workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center gap-2"
                  onClick={action.action}
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Intelligent recommendations based on your activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet. Start creating content to see AI recommendations!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.content}</p>
                  <Badge variant="secondary" className="mt-2">
                    {insight.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your latest thoughts and ideas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : recentNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notes yet. Create your first note!</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => onNavigate('notes')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note: any, index: number) => (
                  <div key={note.id || index} className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                    <h4 className="font-medium mb-1">{note.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content || note.summary}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {note.tags?.slice(0, 2).map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.updated_at || note.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => onNavigate('notes')}
                >
                  View All Notes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>What needs your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active tasks. Add your first task!</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => onNavigate('tasks')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task: any, index: number) => (
                  <div key={task.id || index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <h4 className="font-medium flex-1">{task.title}</h4>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.status && task.status !== 'pending' && (
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      {(task.due_at || task.due_date) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(task.due_at || task.due_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => onNavigate('tasks')}
                >
                  View All Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
