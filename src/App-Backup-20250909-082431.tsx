import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { 
  Brain, 
  Calendar, 
  MagnifyingGlass, 
  Plus, 
  Command, 
  Microphone, 
  Link, 
  Graph,
  Sparkle,
  Robot,
  Shield,
  Globe,
  Timer,
  Lightbulb,
  Network,
  Eye,
  EyeSlash,
  Lightning,
  Target
} from '@phosphor-icons/react'

// UI Components
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog'
import { Switch } from './components/ui/switch'
import { Label } from './components/ui/label'
import { Progress } from './components/ui/progress'

// Core Components
import { CaptureModal } from './components/CaptureModal'
import { CommandPalette } from './components/CommandPalette'
import { HealthStatus } from './components/HealthStatus'
import { Router } from './components/Router'
import { ErrorFallback } from './ErrorFallback'

// Page Components  
import CalendarPageUltraModernEnhanced from './components/pages/CalendarPage-UltraModern-Enhanced'
import { NotesPage } from './components/pages/NotesPage-UltraModern'
import { TasksPage } from './components/pages/TasksPage-UltraModern'

// Dashboard
import DashboardView from './components/DashboardView-UltraModern'

// Advanced Components
import { AIOrchestrator } from './components/AI/AIOrchestrator'
import { KnowledgeGraph } from './components/Graph/KnowledgeGraph'
import { AutoScheduler } from './components/Calendar/AutoScheduler'
import CollaborationWorkspace from './components/Collaboration/CollaborationWorkspace'
import { MagicCapture } from './components/Capture/MagicCapture'
// import { PrivacyCenter } from './components/Privacy/PrivacyCenter'
// import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard'
// import { CollaborationHub } from './components/Collaboration/CollaborationHub'

// Hooks & Utils
import { useTheme } from './hooks/useTheme'
import { useOfflineSync } from './hooks/useOfflineSync'
import { useRealTimeCollaboration } from './hooks/useRealTimeCollaboration'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAIOrchestrator } from './hooks/useAIOrchestrator'
import { useAnalytics } from './hooks/useAnalytics'

// API
import enhancedAPI from '@/lib/enhanced-api.ts'
import { Note, Task, CalendarEvent, AIInsight } from '@/lib/enhanced-api.ts'

// Types
interface AppState {
  user: any
  currentPage: string
  notes: Note[]
  tasks: Task[]
  events: CalendarEvent[]
  insights: AIInsight[]
  loading: boolean
  error: string | null
  isOffline: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  aiMode: 'gpt4' | 'gpt4-mini'
  privacyMode: boolean
  collaborationActive: boolean
}

interface UIState {
  isCaptureOpen: boolean
  isCommandPaletteOpen: boolean
  isAIAssistantOpen: boolean
  isGraphViewOpen: boolean
  isAutoScheduleOpen: boolean
  isPrivacyCenterOpen: boolean
  isAnalyticsOpen: boolean
  isMagicCaptureOpen: boolean
  selectedNoteId: number | null
  focusMode: boolean
  theme: 'light' | 'dark' | 'system'
}

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Main App Component
function AISecondBrainApp() {
  // =====================
  // STATE MANAGEMENT
  // =====================
  const [appState, setAppState] = useState<AppState>({
    user: null,
    currentPage: 'dashboard',
    notes: [],
    tasks: [],
    events: [],
    insights: [],
    loading: true,
    error: null,
    isOffline: false,
    syncStatus: 'idle',
    aiMode: 'gpt4-mini',
    privacyMode: false,
    collaborationActive: false,
  })

  const [uiState, setUIState] = useState<UIState>({
    isCaptureOpen: false,
    isCommandPaletteOpen: false,
    isAIAssistantOpen: false,
    isGraphViewOpen: false,
    isAutoScheduleOpen: false,
    isPrivacyCenterOpen: false,
    isAnalyticsOpen: false,
    isMagicCaptureOpen: false,
    selectedNoteId: null,
    focusMode: false,
    theme: 'system',
  })

  // =====================
  // HOOKS
  // =====================
  const { theme, toggleTheme } = useTheme()
  const { status: syncStatus } = useOfflineSync()
  const isOffline = false // temporarily disabled
  const forcSync = () => {} // temporarily disabled
  const { isConnected, users: activeUsers, sendCursorUpdate: sendMessage } = useRealTimeCollaboration('main-room')
  const { trackEvent } = useAnalytics()
  
  const {
    isProcessing,
    summarizeContent,
    extractTasks,
    generateInsights,
    generateSuggestions,
    askAI
  } = useAIOrchestrator()

  // =====================
  // KEYBOARD SHORTCUTS
  // =====================
  useKeyboardShortcuts({
    // Global shortcuts
    'alt+c': () => setUIState(prev => ({ ...prev, isCaptureOpen: true })),
    'cmd+k': () => setUIState(prev => ({ ...prev, isCommandPaletteOpen: true })),
    'cmd+shift+a': () => setUIState(prev => ({ ...prev, isAIAssistantOpen: true })),
    'cmd+shift+g': () => setUIState(prev => ({ ...prev, isGraphViewOpen: true })),
    'cmd+shift+s': () => setUIState(prev => ({ ...prev, isAutoScheduleOpen: true })),
    'cmd+shift+p': () => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: true })),
    'cmd+shift+f': () => setUIState(prev => ({ ...prev, focusMode: !prev.focusMode })),
    'cmd+shift+t': () => toggleTheme(),
    
    // Navigation
    'cmd+1': () => setAppState(prev => ({ ...prev, currentPage: 'dashboard' })),
    'cmd+2': () => setAppState(prev => ({ ...prev, currentPage: 'notes' })),
    'cmd+3': () => setAppState(prev => ({ ...prev, currentPage: 'tasks' })),
    'cmd+4': () => setAppState(prev => ({ ...prev, currentPage: 'calendar' })),
    'cmd+5': () => setAppState(prev => ({ ...prev, currentPage: 'graph' })),
  })

  // =====================
  // DATA LOADING
  // =====================
  const loadInitialData = useCallback(async () => {
    setAppState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Health check first
      await enhancedAPI.healthCheck()
      
      // Load core data in parallel
      const [notesData, tasksData, eventsData] = await Promise.all([
        enhancedAPI.getNotes(),
        enhancedAPI.getTasks(),
        enhancedAPI.getCalendarEvents(
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        )
      ])

      // Generate AI insights
      const insights = generateInsights(appState.notes, appState.tasks, appState.events)

      setAppState(prev => ({
        ...prev,
        insights: insights || [],
        loading: false
      }))

      trackEvent('app_loaded', { 
        notes_count: appState.notes?.length || 0,
        tasks_count: appState.tasks?.length || 0 
      })

    } catch (err) {
      console.error('Failed to load initial data:', err)
      setAppState(prev => ({
        ...prev,
        error: '데이터 로딩에 실패했습니다. 네트워크를 확인해주세요.',
        loading: false
      }))
      toast.error('데이터 로딩 실패')
    }
  }, [generateInsights, trackEvent])

  // =====================
  // EFFECTS
  // =====================
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    setAppState(prev => ({ 
      ...prev, 
      isOffline, 
      syncStatus,
      collaborationActive: isConnected 
    }))
  }, [isOffline, syncStatus, isConnected])

  // =====================
  // EVENT HANDLERS
  // =====================
  const handleRefreshData = useCallback(async () => {
    await loadInitialData()
    toast.success('데이터가 새로고침되었습니다')
  }, [loadInitialData])

  const handleNoteCreated = useCallback((note: Note) => {
    setAppState(prev => ({
      ...prev,
      notes: [note, ...prev.notes]
    }))
    toast.success('노트가 생성되었습니다')
    trackEvent('note_created', { note_id: note.id })
  }, [trackEvent])

  const handleTasksCreated = useCallback((newTasks: Task[]) => {
    setAppState(prev => ({
      ...prev,
      tasks: [...newTasks, ...prev.tasks]
    }))
    toast.success(`${newTasks.length}개 태스크가 생성되었습니다`)
    trackEvent('tasks_created', { count: newTasks.length })
  }, [trackEvent])

  const handleEventCreated = useCallback((event: CalendarEvent) => {
    setAppState(prev => ({
      ...prev,
      events: [event, ...prev.events]
    }))
    toast.success('일정이 생성되었습니다')
    trackEvent('event_created', { event_id: event.id })
  }, [trackEvent])

  const handleAIModeToggle = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      aiMode: prev.aiMode === 'gpt4' ? 'gpt4-mini' : 'gpt4'
    }))
    toast.info(`AI 모드: ${appState.aiMode === 'gpt4' ? 'GPT-4' : 'GPT-4 Mini'}`)
  }, [appState.aiMode])

  const handlePrivacyToggle = useCallback(() => {
    setAppState(prev => ({ ...prev, privacyMode: !prev.privacyMode }))
    toast.info(`프라이버시 모드: ${appState.privacyMode ? 'OFF' : 'ON'}`)
  }, [appState.privacyMode])

  const handleMagicCapture = useCallback(async (content: string, type: string) => {
    try {
      // Auto-categorize and process content
      const result = extractTasks(content)
      
      if (result.tasks.length > 0) {
        handleTasksCreated(result.tasks)
      } else {
        const note = await enhancedAPI.createNote({
          title: content.substring(0, 50) + '...',
          content,
          tags: []
        })
        handleNoteCreated(note)
      }
      
      setUIState(prev => ({ ...prev, isMagicCaptureOpen: false }))
    } catch (error) {
      toast.error('매직 캡처 실패')
    }
  }, [extractTasks, handleTasksCreated, handleNoteCreated])

  // =====================
  // COMPUTED VALUES
  // =====================
  const stats = useMemo(() => ({
    totalNotes: appState.notes.length,
    todayNotes: appState.notes.filter(note => {
      const today = new Date().toDateString()
      const noteDate = new Date(note.created_at).toDateString()
      return today === noteDate
    }).length,
    totalTasks: appState.tasks.length,
    completedTasks: appState.tasks.filter(task => task.status === 'completed').length,
    pendingTasks: appState.tasks.filter(task => task.status === 'pending').length,
    todayEvents: appState.events.filter(event => {
      const today = new Date().toDateString()
      const eventDate = new Date(event.start_at).toDateString()
      return today === eventDate
    }).length,
    aiProcessed: appState.notes.filter(note => note.tags?.includes('ai')).length,
    connections: appState.notes.reduce((acc, note) => acc + (note.tags?.length || 0), 0),
    productivityScore: Math.round(
      (appState.tasks.filter(t => t.status === 'completed').length / Math.max(appState.tasks.length, 1)) * 100
    )
  }), [appState.notes, appState.tasks, appState.events])

  // =====================
  // LOADING STATE
  // =====================
  if (appState.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <Brain className="h-6 w-6 text-primary absolute top-3 left-3" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Jihyung 초기화 중...</h2>
            <p className="text-muted-foreground">
              지식 그래프와 AI 엔진을 준비하고 있습니다
            </p>
            <Progress value={65} className="w-64 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // =====================
  // ERROR STATE
  // =====================
  if (appState.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-destructive">
            <Brain className="h-16 w-16 mx-auto mb-4" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">연결 오류</h1>
            <p className="text-muted-foreground">{appState.error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadInitialData} className="gap-2">
              <Lightning className="h-4 w-4" />
              다시 시도
            </Button>
            <Button variant="outline" onClick={() => setAppState(prev => ({ ...prev, error: null }))}>
              오프라인 모드
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =====================
  // MAIN RENDER
  // =====================
  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ${uiState.focusMode ? 'focus-mode' : ''}`}>
      {/* ===================== */}
      {/* GLOBAL STATUS BAR     */}
      {/* ===================== */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" weight="bold" />
              <span className="font-semibold">Jihyung</span>
              <Badge variant="outline" className="text-xs">
                v2.0 Beta
              </Badge>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              
              {appState.collaborationActive && (
                <div className="flex items-center gap-1">
                  <Network className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">
                    {activeUsers.length} Active
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Robot className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-muted-foreground">
                  {appState.aiMode.toUpperCase()}
                </span>
              </div>
              
              {appState.privacyMode && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Privacy</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isAIAssistantOpen: true }))}
              className="gap-1"
            >
              <Sparkle className="h-3 w-3" />
              AI
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isMagicCaptureOpen: true }))}
              className="gap-1"
            >
              <Lightning className="h-3 w-3" />
              Quick
            </Button>
            
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* MAIN HEADER          */}
      {/* ===================== */}
      <header className="mt-12 border-b bg-card/50 backdrop-blur-sm sticky top-12 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Router 
                currentPage={appState.currentPage} 
                onNavigate={(page) => setAppState(prev => ({ ...prev, currentPage: page }))} 
              />
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stats.totalNotes} Notes</span>
                <span>{stats.pendingTasks} Tasks</span>
                <span>{stats.todayEvents} Events</span>
                <span className="text-primary">{stats.productivityScore}% Productive</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
                className="gap-2"
                data-testid="quick-capture-open"
              >
                <Plus className="h-4 w-4" />
                Capture
                <Badge variant="secondary" className="text-xs ml-1">Alt+C</Badge>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUIState(prev => ({ ...prev, isCommandPaletteOpen: true }))}
                className="gap-2"
              >
                <Command className="h-4 w-4" />
                Command
                <Badge variant="secondary" className="text-xs ml-1">⌘K</Badge>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUIState(prev => ({ ...prev, isGraphViewOpen: true }))}
                className="gap-2"
              >
                <Graph className="h-4 w-4" />
                Graph
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUIState(prev => ({ ...prev, isAutoScheduleOpen: true }))}
                className="gap-2"
              >
                <Target className="h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================== */}
      {/* MAIN CONTENT         */}
      {/* ===================== */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard */}
        {appState.currentPage === 'dashboard' && (
          <DashboardView 
            onNavigate={(page) => setAppState(prev => ({ ...prev, currentPage: page }))}
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
          />
        )}

        {/* Notes */}
        {appState.currentPage === 'notes' && <NotesPage onNoteCreated={handleNoteCreated} />}
        {appState.currentPage === 'tasks' && <TasksPage onTaskCreated={handleTasksCreated} />}
        {appState.currentPage === 'calendar' && (
          <CalendarPageUltraModernEnhanced 
            onEventCreated={handleEventCreated}
            onTaskCreated={handleTasksCreated}
          />
        )}
        {appState.currentPage === 'collaboration' && <CollaborationWorkspace />}
        {appState.currentPage === 'graph' && (
          <KnowledgeGraph 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
          />
        )}
      </main>

      {/* ===================== */}
      {/* MODALS & DIALOGS     */}
      {/* ===================== */}
      
      {/* Enhanced Capture Modal */}
      <CaptureModal 
        isOpen={uiState.isCaptureOpen} 
        onClose={() => setUIState(prev => ({ ...prev, isCaptureOpen: false }))}
        onNoteCreated={handleNoteCreated}
        onTasksCreated={handleTasksCreated}
      />
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={uiState.isCommandPaletteOpen}
        onClose={() => setUIState(prev => ({ ...prev, isCommandPaletteOpen: false }))}
        onNavigate={(page) => setAppState(prev => ({ ...prev, currentPage: page }))}
        onCreateNote={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
        onCreateTask={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
        onCreateEvent={() => setAppState(prev => ({ ...prev, currentPage: 'calendar' }))}
      />

      {/* AI Assistant Dialog */}
      <Dialog open={uiState.isAIAssistantOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAIAssistantOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle className="h-5 w-5" />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Your intelligent productivity companion
            </DialogDescription>
          </DialogHeader>
          <AIOrchestrator 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
            mode={appState.aiMode}
            privacyMode={appState.privacyMode}
          />
        </DialogContent>
      </Dialog>

      {/* Knowledge Graph Dialog */}
      <Dialog open={uiState.isGraphViewOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isGraphViewOpen: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Knowledge Graph
            </DialogTitle>
            <DialogDescription>
              Visualize connections between your notes, tasks, and events
            </DialogDescription>
          </DialogHeader>
          <KnowledgeGraph 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
          />
        </DialogContent>
      </Dialog>

      {/* Auto Scheduler Dialog */}
      <Dialog open={uiState.isAutoScheduleOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAutoScheduleOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Auto Scheduler
            </DialogTitle>
            <DialogDescription>
              Let AI optimize your schedule
            </DialogDescription>
          </DialogHeader>
          <AutoScheduler 
            tasks={appState.tasks}
            events={appState.events}
            onScheduled={(newEvents) => {
              setAppState(prev => ({
                ...prev,
                events: [...prev.events, ...newEvents]
              }))
              setUIState(prev => ({ ...prev, isAutoScheduleOpen: false }))
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Magic Capture Dialog */}
      <Dialog open={uiState.isMagicCaptureOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isMagicCaptureOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5" />
              Magic Capture
            </DialogTitle>
            <DialogDescription>
              Capture anything with AI-powered processing
            </DialogDescription>
          </DialogHeader>
          <MagicCapture 
            onCapture={(data) => {
              // Handle magic capture data
              console.log('Magic capture:', data)
              setUIState(prev => ({ ...prev, isMagicCaptureOpen: false }))
              toast.success('Content captured with AI magic!')
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Privacy Center Dialog */}
      <Dialog open={uiState.isPrivacyCenterOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Center
            </DialogTitle>
            <DialogDescription>
              Manage your data privacy and security settings
            </DialogDescription>
          </DialogHeader>
          {/* PrivacyCenter temporarily disabled */}
          <div className="p-4 text-center text-gray-500">
            Privacy Center coming soon...
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dashboard Dialog */}
      <Dialog open={uiState.isAnalyticsOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAnalyticsOpen: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Analytics Dashboard
            </DialogTitle>
            <DialogDescription>
              Productivity insights and performance metrics
            </DialogDescription>
          </DialogHeader>
          {/* AnalyticsDashboard temporarily disabled */}
          <div className="p-4 text-center text-gray-500">
            Analytics Dashboard coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =====================
// ERROR BOUNDARY WRAPPER
// =====================
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AISecondBrainApp />
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Accelerate your workflow with AI-powered tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
                    >
                      <Microphone className="h-4 w-4" />
                      Voice Notes
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setUIState(prev => ({ ...prev, isMagicCaptureOpen: true }))}
                    >
                      <Lightning className="h-4 w-4" />
                      Magic Capture
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setUIState(prev => ({ ...prev, isAutoScheduleOpen: true }))}
                    >
                      <Target className="h-4 w-4" />
                      Auto Schedule
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={() => setUIState(prev => ({ ...prev, isGraphViewOpen: true }))}
                    >
                      <Graph className="h-4 w-4" />
                      Knowledge Graph
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={handleRefreshData}
                    >
                      <Brain className="h-4 w-4" />
                      Refresh Data
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Robot className="h-5 w-5" />
                      AI Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ai-mode" className="flex items-center gap-2">
                        <Sparkle className="h-4 w-4" />
                        AI Mode
                      </Label>
                      <Button variant="outline" size="sm" onClick={handleAIModeToggle}>
                        {appState.aiMode === 'gpt4' ? 'GPT-4' : 'GPT-4 Mini'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="privacy-mode" className="flex items-center gap-2">
                        {appState.privacyMode ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        Privacy Mode
                      </Label>
                      <Switch
                        id="privacy-mode"
                        checked={appState.privacyMode}
                        onCheckedChange={handlePrivacyToggle}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: true }))}
                    >
                      <Shield className="h-4 w-4" />
                      Privacy Center
                    </Button>
                  </CardContent>
                </Card>

                {/* Collaboration */}
                {appState.collaborationActive && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Collaboration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {activeUsers.length} users online
                        </p>
                        <div className="flex -space-x-2">
                          {activeUsers.slice(0, 5).map((user, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                            >
                              {user.name?.[0] || 'U'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Page Routes */}
        {appState.currentPage === 'notes' && <NotesPage onNoteCreated={handleNoteCreated} />}
        {appState.currentPage === 'tasks' && <TasksPage onTaskCreated={handleTasksCreated} />}
        {appState.currentPage === 'calendar' && (
          <CalendarPageUltraModernEnhanced 
            onEventCreated={handleEventCreated}
            onTaskCreated={handleTasksCreated}
          />
        )}
        {appState.currentPage === 'collaboration' && <CollaborationWorkspace />}
        {appState.currentPage === 'graph' && (
          <KnowledgeGraph 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
          />
        )}
      </main>

      {/* ===================== */}
      {/* MODALS & DIALOGS     */}
      {/* ===================== */}
      
      {/* Enhanced Capture Modal */}
      <CaptureModal 
        isOpen={uiState.isCaptureOpen} 
        onClose={() => setUIState(prev => ({ ...prev, isCaptureOpen: false }))}
        onNoteCreated={handleNoteCreated}
        onTasksCreated={handleTasksCreated}
      />
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={uiState.isCommandPaletteOpen}
        onClose={() => setUIState(prev => ({ ...prev, isCommandPaletteOpen: false }))}
        onNavigate={(page) => setAppState(prev => ({ ...prev, currentPage: page }))}
        onCreateNote={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
        onCreateTask={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
        onCreateEvent={() => setAppState(prev => ({ ...prev, currentPage: 'calendar' }))}
      />

      {/* AI Assistant Dialog */}
      <Dialog open={uiState.isAIAssistantOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAIAssistantOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle className="h-5 w-5" />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Chat with your AI assistant or get intelligent insights
            </DialogDescription>
          </DialogHeader>
          <AIOrchestrator 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
            mode={appState.aiMode}
            privacyMode={appState.privacyMode}
          />
        </DialogContent>
      </Dialog>

      {/* Knowledge Graph Dialog */}
      <Dialog open={uiState.isGraphViewOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isGraphViewOpen: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Graph className="h-5 w-5" />
              Knowledge Graph
            </DialogTitle>
            <DialogDescription>
              Explore connections between your notes, tasks, and events
            </DialogDescription>
          </DialogHeader>
          <KnowledgeGraph 
            notes={appState.notes}
            tasks={appState.tasks}
            events={appState.events}
          />
        </DialogContent>
      </Dialog>

      {/* Auto Scheduler Dialog */}
      <Dialog open={uiState.isAutoScheduleOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAutoScheduleOpen: open }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Auto Scheduler
            </DialogTitle>
            <DialogDescription>
              Let AI optimize your schedule based on energy patterns and priorities
            </DialogDescription>
          </DialogHeader>
          <AutoScheduler 
            tasks={appState.tasks}
            events={appState.events}
            onSchedule={(suggestions) => console.log('Schedule suggestions:', suggestions)}
            onScheduleCreated={handleEventCreated}
          />
        </DialogContent>
      </Dialog>

      {/* Magic Capture Dialog */}
      <Dialog open={uiState.isMagicCaptureOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isMagicCaptureOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5" />
              Magic Capture
            </DialogTitle>
            <DialogDescription>
              AI-powered intelligent content processing
            </DialogDescription>
          </DialogHeader>
          <MagicCapture 
            onCapture={handleMagicCapture}
          />
        </DialogContent>
      </Dialog>

      {/* Privacy Center Dialog */}
      <Dialog open={uiState.isPrivacyCenterOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Center
            </DialogTitle>
            <DialogDescription>
              Manage your data privacy and AI processing preferences
            </DialogDescription>
          </DialogHeader>
          {/* PrivacyCenter temporarily disabled */}
          <div className="p-4 text-center text-gray-500">
            Privacy Center coming soon...
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dashboard Dialog */}
      <Dialog open={uiState.isAnalyticsOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isAnalyticsOpen: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Analytics Dashboard
            </DialogTitle>
            <DialogDescription>
              Productivity insights and performance metrics
            </DialogDescription>
          </DialogHeader>
          {/* AnalyticsDashboard temporarily disabled */}
          <div className="p-4 text-center text-gray-500">
            Analytics Dashboard coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =====================
// ERROR BOUNDARY WRAPPER
// =====================
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AISecondBrainApp />
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
