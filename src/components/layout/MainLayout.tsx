import React from 'react'
import { motion } from 'framer-motion'
import { 
  Brain,
  Calendar,
  Note,
  CheckSquare,
  Robot,
  Graph,
  Search,
  Settings,
  Plus,
  Command as CommandIcon,
  Lightning,
  Target,
  Bell,
  User
} from '@phosphor-icons/react'

import { Button, IconButton } from '../ui/button-next'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Progress } from '../ui/progress'
import { cn } from '../../lib/utils'
import { 
  PageTransition, 
  StaggerContainer, 
  HoverCard, 
  SkeletonLoader 
} from '../animations/PageTransition'

interface MainLayoutProps {
  children: React.ReactNode
  currentPage: string
  isLoading?: boolean
  stats?: {
    totalNotes: number
    pendingTasks: number
    completedTasks: number
    todayEvents: number
    aiProcessed: number
    productivityScore: number
  }
  onPageChange: (page: string) => void
  onQuickCapture: () => void
  onCommandPalette: () => void
  onAIAssistant: () => void
  className?: string
}

// Quick stats card component
const QuickStatsCard: React.FC<{
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: string
  isLoading?: boolean
}> = ({ title, value, subtitle, icon, color = 'primary', isLoading }) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <SkeletonLoader className="h-4 w-20" />
        </CardHeader>
        <CardContent>
          <SkeletonLoader className="h-8 w-16 mb-2" />
          <SkeletonLoader className="h-3 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <HoverCard className="group">
      <Card className="transition-all duration-200 group-hover:shadow-lg group-hover:border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className={cn("text-current", `text-${color}`)}>{icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className={cn("text-3xl font-bold mb-1", `text-${color}`)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </HoverCard>
  )
}

// Global status bar component
const GlobalStatusBar: React.FC<{
  isOnline: boolean
  syncStatus: string
  aiMode: string
  privacyMode: boolean
  collaborationActive: boolean
  activeUsers: any[]
  onQuickCapture: () => void
  onCommandPalette: () => void
  onAIAssistant: () => void
}> = ({
  isOnline,
  syncStatus,
  aiMode,
  privacyMode,
  collaborationActive,
  activeUsers,
  onQuickCapture,
  onCommandPalette,
  onAIAssistant
}) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50"
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Branding and status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" weight="bold" />
            <span className="font-bold text-lg">Jihyung</span>
            <Badge variant="outline" className="text-xs font-medium">
              v3.0
            </Badge>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-4 text-xs">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full",
              isOnline 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-success animate-pulse" : "bg-destructive"
              )} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-spin border border-transparent border-t-current" />
                Syncing
              </div>
            )}
            
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
              <Robot className="w-3 h-3" />
              {aiMode.toUpperCase()}
            </div>
            
            {privacyMode && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 text-warning">
                <div className="w-2 h-2 rounded-full bg-warning" />
                Private
              </div>
            )}
            
            {collaborationActive && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {activeUsers.length} Active
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Quick actions */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={<Plus className="w-4 h-4" />}
            onClick={onQuickCapture}
            variant="ghost"
            size="icon-sm"
            label="Quick Capture (Alt+C)"
          />
          
          <IconButton
            icon={<CommandIcon className="w-4 h-4" />}
            onClick={onCommandPalette}
            variant="ghost"
            size="icon-sm"
            label="Command Palette (⌘K)"
          />
          
          <IconButton
            icon={<Robot className="w-4 h-4" />}
            onClick={onAIAssistant}
            variant="subtle"
            size="icon-sm"
            label="AI Assistant"
          />
          
          <IconButton
            icon={<Bell className="w-4 h-4" />}
            variant="ghost"
            size="icon-sm"
            label="Notifications"
          />
          
          <IconButton
            icon={<User className="w-4 h-4" />}
            variant="ghost"
            size="icon-sm"
            label="Profile"
          />
        </div>
      </div>
    </motion.div>
  )
}

// Main dashboard content
const DashboardContent: React.FC<{
  stats: any
  isLoading: boolean
}> = ({ stats, isLoading }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <StaggerContainer className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            Good {getTimeOfDay()}, {getUserName()}
          </h1>
          <p className="text-muted-foreground">
            Let's make today productive with your AI-powered second brain.
          </p>
        </motion.div>
      </StaggerContainer>

      {/* Quick Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard
          title="Total Notes"
          value={stats.totalNotes}
          subtitle="Knowledge base"
          icon={<Note className="w-4 h-4" />}
          color="blue-600"
          isLoading={isLoading}
        />
        
        <QuickStatsCard
          title="Active Tasks"
          value={stats.pendingTasks}
          subtitle={`${stats.completedTasks} completed • ${stats.productivityScore}% rate`}
          icon={<CheckSquare className="w-4 h-4" />}
          color="green-600"
          isLoading={isLoading}
        />
        
        <QuickStatsCard
          title="AI Processing"
          value={stats.aiProcessed}
          subtitle="This week • Auto insights"
          icon={<Lightning className="w-4 h-4" />}
          color="purple-600"
          isLoading={isLoading}
        />
        
        <QuickStatsCard
          title="Today's Events"
          value={stats.todayEvents}
          subtitle="Scheduled • Auto-blocked"
          icon={<Calendar className="w-4 h-4" />}
          color="orange-600"
          isLoading={isLoading}
        />
      </StaggerContainer>

      {/* Quick Actions */}
      <StaggerContainer>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Note className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Create Note</div>
                  <div className="text-xs text-muted-foreground">Start writing</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Add Task</div>
                  <div className="text-xs text-muted-foreground">Stay organized</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">Schedule Event</div>
                  <div className="text-xs text-muted-foreground">Plan ahead</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Robot className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Ask AI</div>
                  <div className="text-xs text-muted-foreground">Get insights</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Graph className="w-5 h-5 text-pink-600" />
                <div className="text-left">
                  <div className="font-medium">Knowledge Graph</div>
                  <div className="text-xs text-muted-foreground">Explore connections</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Lightning className="w-5 h-5 text-yellow-600" />
                <div className="text-left">
                  <div className="font-medium">Auto Schedule</div>
                  <div className="text-xs text-muted-foreground">Optimize time</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </StaggerContainer>
    </div>
  )
}

// Main layout component
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPage,
  isLoading = false,
  stats = {
    totalNotes: 0,
    pendingTasks: 0,
    completedTasks: 0,
    todayEvents: 0,
    aiProcessed: 0,
    productivityScore: 0
  },
  onPageChange,
  onQuickCapture,
  onCommandPalette,
  onAIAssistant,
  className
}) => {
  return (
    <div className={cn("min-h-screen bg-background font-display", className)}>
      {/* Global Status Bar */}
      <GlobalStatusBar
        isOnline={true}
        syncStatus="idle"
        aiMode="gpt4"
        privacyMode={false}
        collaborationActive={false}
        activeUsers={[]}
        onQuickCapture={onQuickCapture}
        onCommandPalette={onCommandPalette}
        onAIAssistant={onAIAssistant}
      />
      
      {/* Main Content */}
      <main className="pt-16 px-6 py-8 max-w-7xl mx-auto">
        <PageTransition key={currentPage} variant="slideScale" speed="medium">
          {currentPage === 'dashboard' ? (
            <DashboardContent stats={stats} isLoading={isLoading} />
          ) : (
            children
          )}
        </PageTransition>
      </main>
      
      {/* Floating Action Button for Mobile */}
      <div className="md:hidden">
        <IconButton
          icon={<Plus className="w-6 h-6" />}
          onClick={onQuickCapture}
          variant="gradient"
          size="icon-lg"
          className="fixed bottom-6 right-6 z-40 shadow-xl"
          label="Quick Capture"
        />
      </div>
    </div>
  )
}

// Helper functions
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function getUserName(): string {
  return 'User' // TODO: Get from auth context
}
