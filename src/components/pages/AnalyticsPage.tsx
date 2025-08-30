import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, Brain } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface AnalyticsPageProps {
  stats: any
}

export function AnalyticsPage({ stats }: AnalyticsPageProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Analytics Dashboard
        </motion.h1>
        <p className="text-muted-foreground">
          Insights into your productivity patterns and AI interactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Productivity Overview
          </CardTitle>
          <CardDescription>
            Track your productivity metrics and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-600">{stats.productivity}%</h3>
              <p className="text-sm text-muted-foreground">Task Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <h3 className="text-2xl font-bold text-green-600">{stats.aiInteractions}</h3>
              <p className="text-sm text-muted-foreground">AI Interactions</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <h3 className="text-2xl font-bold text-purple-600">{stats.knowledgeConnections}</h3>
              <p className="text-sm text-muted-foreground">Knowledge Connections</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analytics
          </CardTitle>
          <CardDescription>
            How AI is enhancing your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
            <div className="text-center space-y-4">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Advanced Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed insights into your AI-enhanced productivity
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
