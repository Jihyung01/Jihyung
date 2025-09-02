import React, { createContext, useContext, useReducer, useEffect } from 'react'
import enhancedAPI from '../lib/api'

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
        const createdNote = await enhancedAPI.createNote(apiNoteData)
        
        // Update with server response
        const formattedNote: Note = {
          ...createdNote,
          createdAt: new Date(createdNote.created_at),
          updatedAt: new Date(createdNote.updated_at),
          // Map required Note fields
          content_type: 'markdown',
          type: 'note',
          is_pinned: false,
          is_archived: createdNote.is_archived || false,
          word_count: createdNote.content?.length || 0,
          character_count: createdNote.content?.length || 0,
          reading_time: Math.max(1, Math.floor((createdNote.content?.length || 0) / 1000)),
          ai_generated: false,
          view_count: 0,
          // Legacy compatibility
          starred: false,
          pinned: false,
          wordCount: createdNote.content?.length || 0
        }
        dispatch({ type: 'UPDATE_NOTE', payload: formattedNote })
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
        await enhancedAPI.updateNote(note.id, updatedNote)
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
        await enhancedAPI.deleteNote(id)
      } catch (error) {
        console.error('Failed to delete note:', error)
        // Could implement rollback logic here
      }
    },

    addTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Create optimistic temp task with proper field mapping
        const tempTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          urgency_score: taskData.urgency_score || 5,
          importance_score: taskData.importance_score || 5,
          tags: taskData.tags || [],
          context_tags: taskData.context_tags || [],
          ai_generated: false,
          // Map legacy fields
          completed: false,
          dueDate: taskData.due_date,
          project: taskData.project_id,
          subtasks: []
        }
        
        // Immediate UI update
        dispatch({ type: 'ADD_TASK', payload: tempTask })

        // Convert taskData for API call
        const apiTaskData = {
          title: taskData.title,
          description: taskData.description,
          status: (taskData.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          priority: taskData.priority || 'medium',
          due_at: taskData.due_date?.toISOString(),
          energy: taskData.energy_level === 'high' ? 80 : taskData.energy_level === 'low' ? 30 : 50
        }

        // API call
        const createdTask = await enhancedAPI.createTask(apiTaskData)
        
        // Update with server response, ensuring proper field mapping
        const updatedTask: Task = {
          ...createdTask,
          id: createdTask.id || tempTask.id,
          createdAt: new Date(createdTask.created_at),
          updatedAt: new Date(createdTask.updated_at),
          due_date: createdTask.due_at ? new Date(createdTask.due_at) : undefined,
          reminder_date: taskData.reminder_date,
          completed_at: createdTask.completed_at ? new Date(createdTask.completed_at) : undefined,
          urgency_score: taskData.urgency_score || 5,
          importance_score: taskData.importance_score || 5,
          tags: taskData.tags || [],
          context_tags: taskData.context_tags || [],
          ai_generated: false,
          // Legacy compatibility
          completed: createdTask.status === 'completed',
          dueDate: createdTask.due_at ? new Date(createdTask.due_at) : undefined,
          project: taskData.project_id,
          subtasks: []
        }
        
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      } catch (error) {
        console.error('Failed to create task:', error)
        // Could implement rollback logic here
      }
    },

    updateTask: async (task: Task) => {
      try {
        const updatedTask = {
          ...task,
          updatedAt: new Date(),
          status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
        }
        
        // Optimistic update
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        
        // API call
        await enhancedAPI.updateTask(task.id, {
          title: task.title,
          status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          priority: task.priority,
          due_at: task.due_date?.toISOString(),
          energy: task.energy_level === 'high' ? 80 : task.energy_level === 'low' ? 30 : 50
        })
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    },

    deleteTask: async (id: string) => {
      try {
        // Optimistic update
        dispatch({ type: 'DELETE_TASK', payload: id })
        
        // API call
        await enhancedAPI.deleteTask(id)
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

        // Convert for API
        const apiEventData = {
          title: eventData.title,
          description: eventData.description,
          start_at: eventData.start.toISOString(),
          end_at: eventData.end.toISOString(),
          location: eventData.location
        }

        // API call
        const createdEvent = await enhancedAPI.createCalendarEvent(apiEventData)
        
        // Update with server response
        const formattedEvent: CalendarEvent = {
          ...createdEvent,
          createdAt: new Date(createdEvent.created_at),
          updatedAt: new Date(createdEvent.updated_at),
          start: new Date(createdEvent.start_at),
          end: new Date(createdEvent.end_at),
          // Fill required fields
          all_day: eventData.all_day || false,
          timezone: eventData.timezone || 'UTC',
          event_type: eventData.event_type || 'event',
          reminder_minutes: eventData.reminder_minutes || [],
          attendees: eventData.attendees || {},
          status: eventData.status || 'confirmed',
          visibility: eventData.visibility || 'private',
          ai_generated: false,
          // Legacy compatibility
          allDay: eventData.all_day || false,
          type: eventData.event_type as 'meeting' | 'deadline' | 'reminder' | 'personal' || 'personal'
        }
        dispatch({ type: 'UPDATE_EVENT', payload: formattedEvent })
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
        await enhancedAPI.updateCalendarEvent(event.id, {
          title: event.title,
          description: event.description,
          start_at: event.start.toISOString(),
          end_at: event.end.toISOString()
        })
      } catch (error) {
        console.error('Failed to update event:', error)
      }
    },

    deleteEvent: async (id: string) => {
      try {
        // Optimistic update
        dispatch({ type: 'DELETE_EVENT', payload: id })
        
        // API call
        await enhancedAPI.deleteCalendarEvent(id)
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
          enhancedAPI.getNotes(),
          enhancedAPI.getTasks(),
          enhancedAPI.getCalendarEvents(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()  // 1 year from now
          )
        ])
        
        console.log('✅ API calls successful:', { notes: notes.length, tasks: tasks.length, events: events.length }); // 디버깅용
        
        // Convert date strings to Date objects and handle field mapping
        const processedNotes = notes.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          content_type: note.content_type || 'markdown',
          summary: note.summary,
          type: note.type || 'note',
          tags: note.tags || [],
          folder: note.folder,
          color: note.color,
          is_pinned: note.is_pinned || false,
          is_archived: note.is_archived || false,
          word_count: note.word_count || 0,
          character_count: note.character_count || 0,
          reading_time: note.reading_time || 0,
          sentiment_score: note.sentiment_score,
          ai_generated: note.ai_generated || false,
          view_count: note.view_count || 0,
          last_viewed: note.last_viewed ? new Date(note.last_viewed) : undefined,
          createdAt: new Date(note.createdAt || note.created_at),
          updatedAt: new Date(note.updatedAt || note.updated_at),
          // Legacy fields for compatibility
          starred: note.is_pinned || false,
          pinned: note.is_pinned || false,
          wordCount: note.word_count || 0
        } as Note))
        
        const processedTasks = tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority || 'medium',
          urgency_score: task.urgency_score || 5,
          importance_score: task.importance_score || 5,
          due_date: task.due_at ? new Date(task.due_at) : undefined,
          reminder_date: task.reminder_date ? new Date(task.reminder_date) : undefined,
          completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
          estimated_duration: task.estimated_duration,
          actual_duration: task.actual_duration || 0,
          assignee: task.assignee,
          project_id: task.project_id,
          parent_task_id: task.parent_task_id,
          tags: task.tags || [],
          category: task.category,
          location: task.location,
          energy_level: task.energy_level,
          context_tags: task.context_tags || [],
          recurrence_rule: task.recurrence_rule,
          ai_generated: task.ai_generated || false,
          createdAt: new Date(task.createdAt || task.created_at),
          updatedAt: new Date(task.updatedAt || task.updated_at),
          // Legacy fields for compatibility
          completed: task.status === 'completed',
          dueDate: task.due_at ? new Date(task.due_at) : undefined,
          project: task.project_id || null
        } as Task))
        
        const processedEvents = events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start: new Date(event.start || event.start_time),
          end: new Date(event.end || event.end_time),
          all_day: event.all_day || false,
          timezone: event.timezone || 'UTC',
          color: event.color,
          location: event.location,
          meeting_url: event.meeting_url,
          event_type: event.event_type || 'event',
          recurrence_rule: event.recurrence_rule,
          reminder_minutes: event.reminder_minutes || [],
          attendees: event.attendees || {},
          status: event.status || 'confirmed',
          visibility: event.visibility || 'private',
          ai_generated: event.ai_generated || false,
          createdAt: new Date(event.createdAt || event.created_at),
          updatedAt: new Date(event.updatedAt || event.updated_at),
          // Legacy fields for compatibility
          allDay: event.all_day || false,
          type: (event.event_type as 'meeting' | 'deadline' | 'reminder' | 'personal') || 'personal'
        } as CalendarEvent))
        
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
