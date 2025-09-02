import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Brain, 
  Target, 
  Sparkle, 
  Calendar,
  Graph,
  Users,
  Shield,
  Lightning,
  Lightbulb,
  Plus
} from '@phosphor-icons/react'

interface DashboardViewProps {
  stats: {
    totalNotes: number
    pendingTasks: number
    completedTasks: number
    todayEvents: number
    aiProcessed: number
    productivityScore: number
    collaborationActive: boolean
    ragIndexed: number
    sensitiveNotes: number
    autoScheduledTasks: number
  }
  insights?: any[]
  onNavigate?: (page: string) => void
  ragEnabled?: boolean
  crdtEnabled?: boolean
  aiMode?: string
}

export function DashboardView({ 
  stats, 
  insights = [], 
  onNavigate = () => {},
  ragEnabled = false,
  crdtEnabled = false,
  aiMode = 'balanced'
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to your Jihyung
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              State-of-the-art knowledge management with AI, CRDT collaboration, and RAG
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('notes')} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Quick Capture
            </Button>
            <Button onClick={() => onNavigate('graph')} variant="outline">
              <Graph className="h-4 w-4 mr-2" />
              Knowledge Graph
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Feature Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 flex-wrap"
      >
        <Badge variant={ragEnabled ? "default" : "secondary"}>
          <Brain className="w-3 h-3 mr-1" />
          RAG {ragEnabled ? 'Active' : 'Disabled'}
        </Badge>
        <Badge variant={crdtEnabled ? "default" : "secondary"}>
          <Users className="w-3 h-3 mr-1" />
          CRDT {crdtEnabled ? 'Connected' : 'Offline'}
        </Badge>
        <Badge variant="outline">
          <Sparkle className="w-3 h-3 mr-1" />
          AI Mode: {aiMode}
        </Badge>
        {stats.sensitiveNotes > 0 && (
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            {stats.sensitiveNotes} Private Notes
          </Badge>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" 
              onClick={() => onNavigate('notes')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalNotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ragEnabled ? `${stats.ragIndexed} indexed for RAG` : 'RAG disabled'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => onNavigate('tasks')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.autoScheduledTasks} auto-scheduled • {stats.productivityScore}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => onNavigate('calendar')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.todayEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Events scheduled • Auto-blocked
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkle className="h-4 w-4" />
              AI Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.aiProcessed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Notes enhanced • {insights.length} insights
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            AI Insights
          </h2>
          
          <div className="grid gap-4">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <h3 className="font-medium mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">{insight.content}</p>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" variant="ghost">
                          <Lightning className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate('notes')}>
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Browse Notes</h3>
            <p className="text-xs text-muted-foreground mt-1">Knowledge base</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate('tasks')}>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Manage Tasks</h3>
            <p className="text-xs text-muted-foreground mt-1">Auto-schedule</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate('calendar')}>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">View Calendar</h3>
            <p className="text-xs text-muted-foreground mt-1">Time blocks</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => onNavigate('graph')}>
          <CardContent className="p-4 text-center">
            <Graph className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium">Knowledge Graph</h3>
            <p className="text-xs text-muted-foreground mt-1">Connections</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
