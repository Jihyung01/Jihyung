const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8006/api'

interface ApiConfig {
  useAuth: boolean
  token?: string
}

// Get config from environment or demo token
let config: ApiConfig = {
  useAuth: true,
  token: import.meta.env.VITE_API_TOKEN || localStorage.getItem('demo_token')
}

// Initialize demo token if needed
async function initializeDemoToken() {
  if (!config.token) {
    try {
      const response = await fetch(`${API_BASE}/auth/create-demo-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        const token = data.access_token || data.token || 'demo'
        config.token = token
        localStorage.setItem('demo_token', token)
        console.log('Demo token initialized successfully:', token)
      }
    } catch (error) {
      console.warn('Failed to initialize demo token:', error)
      config.token = 'demo'
      localStorage.setItem('demo_token', 'demo')
    }
  }
}

// Initialize demo token on import
initializeDemoToken()

// Auth headers helper
function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers = { ...extra }
  if (config.useAuth && config.token) {
    headers['Authorization'] = `Bearer ${config.token}`
  }
  return headers
}

// Generic fetch wrapper with error handling
async function request<T>(
  path: string,
  options: RequestInit = {},
  controller?: AbortController
): Promise<T> {
  try {
    // Initialize demo token if not available
    if (!config.token) {
      await initializeDemoToken()
    }
    
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...options.headers
      },
      credentials: 'include',
      signal: controller?.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    
    return response.text() as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    console.error('API request failed:', error)
    throw error
  }
}

// GET helper
export async function getJSON<T>(path: string, controller?: AbortController): Promise<T> {
  return request<T>(path, { method: 'GET' }, controller)
}

// POST helper
export async function postJSON<T>(
  path: string,
  payload?: unknown,
  controller?: AbortController
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined
    },
    controller
  )
}

// PUT helper
export async function putJSON<T>(
  path: string, 
  data: any, 
  controller?: AbortController
): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, controller)
}

// PATCH helper
export async function patchJSON<T>(
  path: string, 
  data: any, 
  controller?: AbortController
): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, controller)
}

// DELETE helper
export async function deleteJSON<T>(path: string, controller?: AbortController): Promise<T> {
  return request<T>(path, { method: 'DELETE' }, controller)
}

// Health check
export const healthCheck = () => getJSON<{ status: string }>('/health')

// Notes API
export const listNotes = (query?: string, tags?: string[]) => {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (tags?.length) params.set('tags', tags.join(','))
  return getJSON<any[]>(`/notes?${params}`)
}

export const createNote = (note: { title?: string; content: string; tags?: string[] }) =>
  postJSON<any>('/notes', note)

export const updateNote = (id: string, note: Partial<{ title: string; content: string; tags: string[] }>) =>
  putJSON<any>(`/notes/${id}`, note)

export const deleteNote = (id: string) => deleteJSON<void>(`/notes/${id}`)

// Tasks API  
export const listTasks = (from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return getJSON<any[]>(`/tasks?${params}`)
}

export const getTodayTasks = () => getJSON<any[]>('/tasks/today')

export const createTask = (task: {
  title: string
  due_at?: string
  priority?: 'low' | 'medium' | 'high'
  energy?: number
  parent_id?: string
  note_id?: string
}) => postJSON<any>('/tasks', task)

export const updateTask = (id: string, task: Partial<{
  title: string
  status: string
  due_at: string
  priority: 'low' | 'medium' | 'high'
  energy: number
}>) => patchJSON<any>(`/tasks/${id}`, task)

export const deleteTask = (id: string) => deleteJSON<void>(`/tasks/${id}`)

// Calendar
export const getCalendarEvents = (from: string, to: string) =>
  getJSON<any[]>(`/calendar?from=${from}&to=${to}`)

export const createCalendarEvent = (event: {
  title: string
  start?: string
  end?: string  
  description?: string
}) => postJSON<any>('/calendar', event)

export const updateCalendarEvent = (id: string, event: Partial<{
  title: string
  start_at: string
  end_at: string
  description: string
}>) => patchJSON<any>(`/calendar/${id}`, event)

export const deleteCalendarEvent = (id: string) => deleteJSON<void>(`/calendar/${id}`)

// AI Features
export const summarize = (text: string, style?: string) =>
  postJSON<{ summary: string }>('/summarize', { text, style })

export const extractTasks = (text: string) =>
  postJSON<{ tasks: any[]; created_ids: number[] }>('/extract-tasks', { text })

export const summarizeYoutube = (url: string) =>
  postJSON<{ ok: boolean; video_id: string; transcript_text: string; chapters: any[] }>('/summarize/yt', { url })

// Search
export const search = (query: string, filters?: Record<string, any>) =>
  postJSON<{ results: any[]; total: number }>('/search', { query, filters })

// Time blocking
export const suggestTimeBlocks = (tasks: string[]) =>
  postJSON<{ suggestions: any[] }>('/timeblocks/suggest', { tasks })

export const applyTimeBlocks = (blocks: any[]) =>
  postJSON<{ created: any[] }>('/timeblocks/apply', { blocks })

// Daily/Weekly briefing
export const getDailyBrief = () =>
  getJSON<{
    date: string
    top_tasks: any[]
    time_blocks: any[]
    recent_notes: any[]
    summary?: string
  }>('/daily-brief')

export const getWeeklyBrief = () =>
  getJSON<{
    start_date: string
    end_date: string
    task_completion_rate: number
    productivity_score: number
    top_categories: any[]
    summary?: string
  }>('/weekly-brief')

// Export config for external use
export { config }
