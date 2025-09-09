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
import { Progress } from './components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/dialog'
import { Switch } from './components/ui/switch'
import { Label } from './components/ui/label'
import { Separator } from './components/ui/separator'

// Core Components
import { CaptureModal } from './components/CaptureModal'
import { CommandPalette } from './components/CommandPalette'
import { HealthStatus } from './components/HealthStatus'
import { ErrorFallback } from './ErrorFallback'

// Page Components  
import CalendarPageUltraModernEnhanced from './components/pages/CalendarPage-UltraModern-Enhanced'
import { NotesPage } from './components/pages/NotesPage-UltraModern'
import { TasksPage } from './components/pages/TasksPage-UltraModern'

// Dashboard
import DashboardView from './components/DashboardView-UltraModern'

// Advanced Components
import { SmartAIAssistant } from './components/AI/SmartAIAssistant'
import { KnowledgeGraph } from './components/Graph/KnowledgeGraph'
import { AutoScheduler } from './components/Calendar/AutoScheduler'
import CollaborationWorkspace from './components/Collaboration/CollaborationWorkspace'
import { MagicCapture } from './components/Capture/MagicCapture'

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
  const { theme, setTheme } = useTheme()
  const { isOffline, syncData } = useOfflineSync()
  const { isConnected, connectedUsers } = useRealTimeCollaboration()
  const { } = useKeyboardShortcuts({
    onCommandPalette: () => setUIState(prev => ({ ...prev, isCommandPaletteOpen: true })),
    onQuickCapture: () => setUIState(prev => ({ ...prev, isCaptureOpen: true })),
    onAIAssistant: () => setUIState(prev => ({ ...prev, isAIAssistantOpen: true })),
    onFocusMode: () => setUIState(prev => ({ ...prev, focusMode: !prev.focusMode })),
  })
  const { orchestrateTask, aiMetrics } = useAIOrchestrator()
  const { trackEvent, getInsights } = useAnalytics()

  // =====================
  // DATA LOADING
  // =====================
  const loadInitialData = useCallback(async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true, error: null }))
      
      const [notes, tasks, events, insights] = await Promise.all([
        enhancedAPI.notes.getAll(),
        enhancedAPI.tasks.getAll(),
        enhancedAPI.calendar.getEvents(),
        enhancedAPI.ai.getInsights()
      ])

      setAppState(prev => ({
        ...prev,
        notes,
        tasks,
        events,
        insights,
        loading: false,
      }))
    } catch (error) {
      console.error('Failed to load initial data:', error)
      setAppState(prev => ({
        ...prev,
        error: 'Failed to load data. Please refresh the page.',
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // =====================
  // EVENT HANDLERS
  // =====================
  const handleNoteCreated = useCallback((note: Note) => {
    setAppState(prev => ({
      ...prev,
      notes: [note, ...prev.notes],
    }))
    trackEvent('note_created', { note_id: note.id })
    toast.success('Note created successfully!')
  }, [trackEvent])

  const handleTasksCreated = useCallback((task: Task) => {
    setAppState(prev => ({
      ...prev,
      tasks: [task, ...prev.tasks],
    }))
    trackEvent('task_created', { task_id: task.id })
    toast.success('Task created successfully!')
  }, [trackEvent])

  const handleEventCreated = useCallback((event: CalendarEvent) => {
    setAppState(prev => ({
      ...prev,
      events: [event, ...prev.events],
    }))
    trackEvent('event_created', { event_id: event.id })
    toast.success('Event created successfully!')
  }, [trackEvent])

  // =====================
  // COMPUTED VALUES
  // =====================
  const stats = useMemo(() => {
    const totalNotes = appState.notes.length
    const pendingTasks = appState.tasks.filter(t => t.status !== 'completed').length
    const completedTasks = appState.tasks.filter(t => t.status === 'completed').length
    const todayEvents = appState.events.filter(e => 
      new Date(e.start_time).toDateString() === new Date().toDateString()
    ).length
    const productivityScore = appState.tasks.length > 0 
      ? Math.round((completedTasks / appState.tasks.length) * 100) 
      : 0

    return {
      totalNotes,
      pendingTasks,
      completedTasks,
      todayEvents,
      productivityScore,
      aiProcessed: aiMetrics?.processed || 0,
      todayNotes: appState.notes.filter(n => 
        new Date(n.created_at).toDateString() === new Date().toDateString()
      ).length,
      connections: appState.notes.reduce((acc, note) => 
        acc + (note.tags?.length || 0), 0
      ),
    }
  }, [appState.notes, appState.tasks, appState.events, aiMetrics])

  // =====================
  // LOADING STATE
  // =====================
  if (appState.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <Brain className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Starting your AI Second Brain</h2>
            <p className="text-muted-foreground">Loading your personalized workspace...</p>
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
            <Lightbulb className="h-16 w-16 mx-auto mb-4" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">{appState.error}</p>
          </div>
          <Button onClick={loadInitialData} className="w-full">
            Try Again
          </Button>
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
              
              {isConnected && (
                <div className="flex items-center gap-1">
                  <Network className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {connectedUsers.length} connected
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isCommandPaletteOpen: true }))}
              className="text-xs"
            >
              <Command className="h-3 w-3 mr-1" />
              Cmd+K
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isCaptureOpen: true }))}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Capture
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isAIAssistantOpen: true }))}
              className="text-xs"
            >
              <Sparkle className="h-3 w-3 mr-1" />
              AI
            </Button>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* NAVIGATION            */}
      {/* ===================== */}
      <nav className="fixed top-12 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            {(['dashboard', 'notes', 'tasks', 'calendar', 'collaboration', 'graph'] as const).map((page) => (
              <button
                key={page}
                onClick={() => setAppState(prev => ({ ...prev, currentPage: page }))}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  appState.currentPage === page
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-muted-foreground'
                }`}
              >
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, focusMode: !prev.focusMode }))}
            >
              {uiState.focusMode ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isGraphViewOpen: true }))}
            >
              <Graph className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: true }))}
            >
              <Shield className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUIState(prev => ({ ...prev, isAnalyticsOpen: true }))}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ===================== */}
      {/* MAIN CONTENT          */}
      {/* ===================== */}
      <main className="container mx-auto px-6 py-8 pt-32">
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
              Your intelligent second brain powered by advanced AI
            </DialogDescription>
          </DialogHeader>
          <SmartAIAssistant 
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
              Visualize connections between your notes, tasks, and ideas
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
              AI Auto Scheduler
            </DialogTitle>
            <DialogDescription>
              Let AI optimize your schedule based on your tasks and preferences
            </DialogDescription>
          </DialogHeader>
          <AutoScheduler 
            tasks={appState.tasks}
            events={appState.events}
          />
        </DialogContent>
      </Dialog>

      {/* Magic Capture Dialog */}
      <Dialog open={uiState.isMagicCaptureOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isMagicCaptureOpen: open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5" />
              Magic Capture
            </DialogTitle>
            <DialogDescription>
              Capture anything with AI-powered intelligence
            </DialogDescription>
          </DialogHeader>
          <MagicCapture 
            onCapture={(data) => {
              console.log('Magic capture:', data)
              setUIState(prev => ({ ...prev, isMagicCaptureOpen: false }))
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Privacy Center Dialog */}
      <Dialog open={uiState.isPrivacyCenterOpen} onOpenChange={(open) => setUIState(prev => ({ ...prev, isPrivacyCenterOpen: open }))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Center
            </DialogTitle>
            <DialogDescription>
              Control your data privacy and security settings
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
