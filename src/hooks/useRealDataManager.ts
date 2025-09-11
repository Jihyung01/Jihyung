import { useState, useEffect, useCallback } from 'react'

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  collaborators?: string[]
  isEncrypted?: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  subtasks?: Task[]
  dependencies?: string[]
  assignee?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location?: string
  attendees?: string[]
  reminders?: any[]
  isAllDay?: boolean
  createdAt: string
  updatedAt: string
}

export function useRealDataManager() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<Event[]>([])

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('jihyung-notes')
      const savedTasks = localStorage.getItem('jihyung-tasks')
      const savedEvents = localStorage.getItem('jihyung-events')

      if (savedNotes) {
        setNotes(JSON.parse(savedNotes))
      } else {
        // 기본 노트 생성
        const defaultNotes: Note[] = [
          {
            id: '1',
            title: 'Welcome to Jihyung AI Brain 3.0',
            content: 'This is your quantum-powered second brain. Start creating notes, tasks, and events to boost your productivity!',
            tags: ['welcome', 'getting-started'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collaborators: [],
            isEncrypted: false
          }
        ]
        setNotes(defaultNotes)
        localStorage.setItem('jihyung-notes', JSON.stringify(defaultNotes))
      }

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      } else {
        // 기본 태스크 생성
        const defaultTasks: Task[] = [
          {
            id: '1',
            title: 'Explore Quantum Features',
            description: 'Try out the quantum processing capabilities of the app',
            status: 'todo',
            priority: 'medium',
            tags: ['quantum', 'exploration'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subtasks: [],
            dependencies: []
          }
        ]
        setTasks(defaultTasks)
        localStorage.setItem('jihyung-tasks', JSON.stringify(defaultTasks))
      }

      if (savedEvents) {
        setEvents(JSON.parse(savedEvents))
      } else {
        // 기본 이벤트 생성
        const defaultEvents: Event[] = [
          {
            id: '1',
            title: 'Welcome Event',
            description: 'Getting started with Jihyung AI',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            location: 'Virtual Space',
            attendees: [],
            reminders: [],
            isAllDay: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
        setEvents(defaultEvents)
        localStorage.setItem('jihyung-events', JSON.stringify(defaultEvents))
      }

      console.log('Data loaded successfully from localStorage')
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      // 기본 데이터로 초기화
      setNotes([])
      setTasks([])
      setEvents([])
    }
  }, [])

  const saveNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: note.tags || [],
      collaborators: note.collaborators || []
    }
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    localStorage.setItem('jihyung-notes', JSON.stringify(updatedNotes))
    return newNote
  }, [notes])

  const saveTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      dependencies: task.dependencies || []
    }
    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    localStorage.setItem('jihyung-tasks', JSON.stringify(updatedTasks))
    return newTask
  }, [tasks])

  const saveEvent = useCallback((event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attendees: event.attendees || [],
      reminders: event.reminders || []
    }
    const updatedEvents = [...events, newEvent]
    setEvents(updatedEvents)
    localStorage.setItem('jihyung-events', JSON.stringify(updatedEvents))
    return newEvent
  }, [events])

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    )
    setTasks(updatedTasks)
    localStorage.setItem('jihyung-tasks', JSON.stringify(updatedTasks))
  }, [tasks])

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    setTasks(updatedTasks)
    localStorage.setItem('jihyung-tasks', JSON.stringify(updatedTasks))
  }, [tasks])

  const deleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    setNotes(updatedNotes)
    localStorage.setItem('jihyung-notes', JSON.stringify(updatedNotes))
  }, [notes])

  const deleteEvent = useCallback((eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId)
    setEvents(updatedEvents)
    localStorage.setItem('jihyung-events', JSON.stringify(updatedEvents))
  }, [events])

  return {
    notes,
    tasks,
    events,
    saveNote,
    saveTask,
    saveEvent,
    updateTask,
    deleteTask,
    deleteNote,
    deleteEvent
  }
}
