import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { listNotes, createNote as apiCreateNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote, 
         listTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask, 
         getCalendarEvents, createCalendarEvent as apiCreateEvent, updateCalendarEvent as apiUpdateEvent, deleteCalendarEvent as apiDeleteEvent } from '../lib/api'

// Types
export interface Note {
  id: string
  title?: string
  content: string
  content_type: string
  summary?: string
  type: 'note' | 'idea' | 'project' | 'meeting' | 'personal'
  tags: string[]
  folder?: string
  color?: string
  is_pinned: boolean
  is_archived: boolean
  word_count: number
  character_count: number
  reading_time: number
  sentiment_score?: number
  ai_generated: boolean
  view_count: number
  last_viewed?: Date
  createdAt: Date
  updatedAt: Date
  // Keep legacy fields for compatibility
  starred?: boolean
  pinned?: boolean
  wordCount?: number
}

export interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high'
  urgency_score: number
  importance_score: number
  due_date?: Date
  reminder_date?: Date
  completed_at?: Date
  estimated_duration?: number
  actual_duration?: number
  assignee?: string
  project_id?: string
  parent_task_id?: string
  tags: string[]
  category?: string
  location?: string
  energy_level?: string
  context_tags: string[]
  recurrence_rule?: string
  ai_generated: boolean
  createdAt: Date
  updatedAt: Date
  // Keep legacy fields for compatibility
  completed?: boolean
  dueDate?: Date
  project?: string
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  all_day: boolean
  timezone: string
  color?: string
  location?: string
  meeting_url?: string
  event_type: string
  recurrence_rule?: string
  reminder_minutes: number[]
  attendees: Record<string, any>
  status: string
  visibility: string
  ai_generated: boolean
  createdAt: Date
  updatedAt: Date
  // Keep legacy fields for compatibility
  allDay?: boolean
  type?: 'meeting' | 'deadline' | 'reminder' | 'personal'
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    autoSave: boolean
  }
}

interface AppState {
  user: User | null
  notes: Note[]
  tasks: Task[]
  events: CalendarEvent[]
  isLoading: boolean
  lastSync: Date | null
}

// Actions
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: { notes: Note[]; tasks: Task[]; events: CalendarEvent[] } }
  | { type: 'SET_LAST_SYNC'; payload: Date }

// Initial state
const initialState: AppState = {
  user: null,
  notes: [],
  tasks: [],
  events: [],
  isLoading: false,
  lastSync: null,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    
    case 'ADD_NOTE':
      return { 
        ...state, 
        notes: [action.payload, ...state.notes],
        lastSync: new Date()
      }
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id ? action.payload : note
        ),
        lastSync: new Date()
      }
    
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        lastSync: new Date()
      }
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        lastSync: new Date()
      }
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
        lastSync: new Date()
      }
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        lastSync: new Date()
      }
    
    case 'ADD_EVENT':
      return {
        ...state,
        events: [action.payload, ...state.events],
        lastSync: new Date()
      }
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
        lastSync: new Date()
      }
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        lastSync: new Date()
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'LOAD_DATA':
      return {
        ...state,
        notes: action.payload.notes,
        tasks: action.payload.tasks,
        events: action.payload.events,
        lastSync: new Date()
      }
    
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload }
    
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: {
    setUser: (user: User | null) => void
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    updateNote: (note: Note) => Promise<void>
    deleteNote: (id: string) => Promise<void>
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    updateTask: (task: Task) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    updateEvent: (event: CalendarEvent) => Promise<void>
    deleteEvent: (id: string) => Promise<void>
    saveData: () => Promise<void>
    loadData: () => Promise<void>
  }
} | null>(null)

// Storage utilities
const STORAGE_KEYS = {
  NOTES: 'spark-ai-notes',
  TASKS: 'spark-ai-tasks',
  EVENTS: 'spark-ai-events',
  USER: 'spark-ai-user',
  LAST_SYNC: 'spark-ai-last-sync'
}

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

const loadFromStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return null
  }
}

// Date serialization utilities
const serializeDates = (obj: any): any => {
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDates)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = serializeDates(obj[key])
    }
    return result
  }
  return obj
}

const deserializeDates = (obj: any): any => {
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    return new Date(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeDates)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      result[key] = deserializeDates(obj[key])
    }
    return result
  }
  return obj
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action creators with API integration
  const actions = {
    setUser: (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user })
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Optimistic update
        const tempNote: Note = {
          ...noteData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          word_count: noteData.content?.length || 0,
          character_count: noteData.content?.length || 0,
          reading_time: Math.max(1, Math.floor((noteData.content?.length || 0) / 1000)),
          view_count: 0,
          ai_generated: false,
          // Set default values for required fields
          content_type: noteData.content_type || 'markdown',
          is_pinned: noteData.is_pinned || false,
          is_archived: false,
          tags: noteData.tags || [],
          // Legacy compatibility
          wordCount: noteData.content?.length || 0,
          starred: noteData.is_pinned || false,
          pinned: noteData.is_pinned || false
        }
        dispatch({ type: 'ADD_NOTE', payload: tempNote })

        // Convert data for API call
        const apiNoteData = {
          title: noteData.title,
          content: noteData.content,
          content_type: noteData.content_type || 'markdown',
          type: noteData.type || 'note',
          tags: noteData.tags || [],
          folder: noteData.folder,
          color: noteData.color,
          is_pinned: noteData.is_pinned || false
        }

        // API call
        const createdNote = await apiCreateNote(apiNoteData)
        
        // Update with server response
        dispatch({ type: 'UPDATE_NOTE', payload: {
          ...createdNote,
          createdAt: new Date(createdNote.createdAt),
          updatedAt: new Date(createdNote.updatedAt),
          last_viewed: createdNote.last_viewed ? new Date(createdNote.last_viewed) : undefined,
          // Legacy compatibility
          starred: createdNote.is_pinned,
          pinned: createdNote.is_pinned,
          wordCount: createdNote.word_count
        }})
      } catch (error) {
        console.error('Failed to create note:', error)
        // Could implement rollback logic here
      }
    },

    updateNote: async (note: Note) => {
      try {
        const updatedNote = {
          ...note,
          updatedAt: new Date(),
          wordCount: note.content.length
        }
        
        // Optimistic update
        dispatch({ type: 'UPDATE_NOTE', payload: updatedNote })
        
        // API call
        await apiUpdateNote(note.id, updatedNote)
      } catch (error) {
        console.error('Failed to update note:', error)
        // Could implement rollback logic here
      }
    },

    deleteNote: async (id: string) => {
      try {
        // Optimistic update
        dispatch({ type: 'DELETE_NOTE', payload: id })
        
        // API call
        await apiDeleteNote(id)
      } catch (error) {
        console.error('Failed to delete note:', error)
        // Could implement rollback logic here
      }
    },

    addTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Optimistic update
        const tempTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        dispatch({ type: 'ADD_TASK', payload: tempTask })

        // API call
        const createdTask = await apiCreateTask(taskData)
        
        // Update with server response
        dispatch({ type: 'UPDATE_TASK', payload: {
          ...createdTask,
          createdAt: new Date(createdTask.createdAt),
          updatedAt: new Date(createdTask.updatedAt),
          dueDate: createdTask.dueDate ? new Date(createdTask.dueDate) : undefined
        }})
      } catch (error) {
        console.error('Failed to create task:', error)
      }
    },

    updateTask: async (task: Task) => {
      try {
        const updatedTask = {
          ...task,
          updatedAt: new Date()
        }
        
        // Optimistic update
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        
        // API call
        await apiUpdateTask(task.id, updatedTask)
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    },

    deleteTask: async (id: string) => {
      try {
        // Optimistic update
        dispatch({ type: 'DELETE_TASK', payload: id })
        
        // API call
        await apiDeleteTask(id)
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    },

    addEvent: async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Optimistic update
        const tempEvent: CalendarEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        dispatch({ type: 'ADD_EVENT', payload: tempEvent })

        // API call
        const createdEvent = await apiCreateEvent(eventData)
        
        // Update with server response
        dispatch({ type: 'UPDATE_EVENT', payload: {
          ...createdEvent,
          createdAt: new Date(createdEvent.createdAt),
          updatedAt: new Date(createdEvent.updatedAt),
          start: new Date(createdEvent.start),
          end: new Date(createdEvent.end)
        }})
      } catch (error) {
        console.error('Failed to create event:', error)
      }
    },

    updateEvent: async (event: CalendarEvent) => {
      try {
        const updatedEvent = {
          ...event,
          updatedAt: new Date()
        }
        
        // Optimistic update
        dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent })
        
        // API call
        await apiUpdateEvent(event.id, updatedEvent)
      } catch (error) {
        console.error('Failed to update event:', error)
      }
    },

    deleteEvent: async (id: string) => {
      try {
        // Optimistic update
        dispatch({ type: 'DELETE_EVENT', payload: id })
        
        // API call
        await apiDeleteEvent(id)
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    },

    saveData: async () => {
      // Force save current state
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() })
    },

    loadData: async () => {
      try {
        console.log('🔄 Starting loadData...'); // 디버깅용
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // Load from API
        console.log('📡 Making API calls...'); // 디버깅용
        const [notes, tasks, events] = await Promise.all([
          listNotes(),
          listTasks(),
          getCalendarEvents()
        ])
        
        console.log('✅ API calls successful:', { notes: notes.length, tasks: tasks.length, events: events.length }); // 디버깅용
        
        // Convert date strings to Date objects and handle field mapping
        const processedNotes = notes.map(note => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          last_viewed: note.last_viewed ? new Date(note.last_viewed) : undefined,
          // Map legacy fields for compatibility
          starred: note.is_pinned,
          pinned: note.is_pinned,
          wordCount: note.word_count
        }))
        
        const processedTasks = tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          due_date: task.due_date ? new Date(task.due_date) : undefined,
          reminder_date: task.reminder_date ? new Date(task.reminder_date) : undefined,
          completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
          // Map legacy fields for compatibility
          completed: task.status === 'completed',
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          project: task.project_id,
          subtasks: []
        }))
        
        const processedEvents = events.map(event => ({
          ...event,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          start: new Date(event.start),
          end: new Date(event.end),
          // Map legacy fields for compatibility
          allDay: event.all_day,
          type: event.event_type as 'meeting' | 'deadline' | 'reminder' | 'personal'
        }))
        
        dispatch({ 
          type: 'LOAD_DATA', 
          payload: { 
            notes: processedNotes, 
            tasks: processedTasks, 
            events: processedEvents 
          }
        })
      } catch (error) {
        console.error('❌ Failed to load data from API:', error)
        console.error('Error details:', error instanceof Error ? error.message : error);
        
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('401')) {
          console.log('🔐 Authentication error detected - clearing stored tokens');
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_USER', payload: null });
        }
        
        // Fallback to localStorage
        console.log('📁 Falling back to localStorage data...');
        const notes = loadFromStorage(STORAGE_KEYS.NOTES) || []
        const tasks = loadFromStorage(STORAGE_KEYS.TASKS) || []
        const events = loadFromStorage(STORAGE_KEYS.EVENTS) || []
        
        const deserializedNotes = deserializeDates(notes)
        const deserializedTasks = deserializeDates(tasks)
        const deserializedEvents = deserializeDates(events)
        
        dispatch({ type: 'LOAD_DATA', payload: { 
          notes: deserializedNotes, 
          tasks: deserializedTasks, 
          events: deserializedEvents 
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }

  // Load data on mount - try API first, fallback to localStorage
  useEffect(() => {
    const loadInitialData = async () => {
      // Check if user is logged in
      const token = localStorage.getItem('token')
      if (token) {
        // Try to load from API
        try {
          await actions.loadData()
        } catch (error) {
          console.error('Failed to load from API, using localStorage:', error)
          // Fallback to localStorage
          const loadStoredData = () => {
            try {
              const notes = loadFromStorage(STORAGE_KEYS.NOTES) || []
              const tasks = loadFromStorage(STORAGE_KEYS.TASKS) || []
              const events = loadFromStorage(STORAGE_KEYS.EVENTS) || []
              const user = loadFromStorage(STORAGE_KEYS.USER)
              
              // Deserialize dates
              const deserializedNotes = deserializeDates(notes)
              const deserializedTasks = deserializeDates(tasks)
              const deserializedEvents = deserializeDates(events)
              
              dispatch({ type: 'LOAD_DATA', payload: { 
                notes: deserializedNotes, 
                tasks: deserializedTasks, 
                events: deserializedEvents 
              }})
              
              if (user) {
                dispatch({ type: 'SET_USER', payload: user })
              }
              
              const lastSync = loadFromStorage(STORAGE_KEYS.LAST_SYNC)
              if (lastSync) {
                dispatch({ type: 'SET_LAST_SYNC', payload: new Date(lastSync) })
              }
            } catch (error) {
              console.error('Failed to load stored data:', error)
            }
          }
          
          loadStoredData()
        }
      } else {
        // No token, load from localStorage only
        const loadStoredData = () => {
          try {
            const notes = loadFromStorage(STORAGE_KEYS.NOTES) || []
            const tasks = loadFromStorage(STORAGE_KEYS.TASKS) || []
            const events = loadFromStorage(STORAGE_KEYS.EVENTS) || []
            const user = loadFromStorage(STORAGE_KEYS.USER)
            
            // Deserialize dates
            const deserializedNotes = deserializeDates(notes)
            const deserializedTasks = deserializeDates(tasks)
            const deserializedEvents = deserializeDates(events)
            
            dispatch({ type: 'LOAD_DATA', payload: { 
              notes: deserializedNotes, 
              tasks: deserializedTasks, 
              events: deserializedEvents 
            }})
            
            if (user) {
              dispatch({ type: 'SET_USER', payload: user })
            }
            
            const lastSync = loadFromStorage(STORAGE_KEYS.LAST_SYNC)
            if (lastSync) {
              dispatch({ type: 'SET_LAST_SYNC', payload: new Date(lastSync) })
            }
          } catch (error) {
            console.error('Failed to load stored data:', error)
          }
        }
        
        loadStoredData()
      }
    }

    loadInitialData()
  }, [])

  // Auto-save data when state changes
  useEffect(() => {
    if (state.lastSync) {
      const serializedNotes = serializeDates(state.notes)
      const serializedTasks = serializeDates(state.tasks)
      const serializedEvents = serializeDates(state.events)
      
      saveToStorage(STORAGE_KEYS.NOTES, serializedNotes)
      saveToStorage(STORAGE_KEYS.TASKS, serializedTasks)
      saveToStorage(STORAGE_KEYS.EVENTS, serializedEvents)
      saveToStorage(STORAGE_KEYS.LAST_SYNC, state.lastSync.toISOString())
      
      if (state.user) {
        saveToStorage(STORAGE_KEYS.USER, state.user)
      }
    }
  }, [state.notes, state.tasks, state.events, state.user, state.lastSync])

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Export types
export type { AppState, AppAction }
