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

// Enhanced fetch wrapper with better error handling
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    }
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }
  
  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`, finalOptions.body ? JSON.parse(finalOptions.body as string) : null)
    
    const response = await fetch(url, finalOptions)
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`API Response:`, data)
    
    return data
  } catch (error) {
    console.error(`API Request failed:`, error)
    throw error
  }
}

// GET helper
async function get<T>(path: string, controller?: AbortController): Promise<T> {
  return apiRequest(path, { method: 'GET' })
}

// POST helper
async function post<T>(path: string, data?: any, controller?: AbortController): Promise<T> {
  return apiRequest(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })
}

// PUT helper
async function put<T>(path: string, data?: any, controller?: AbortController): Promise<T> {
  return apiRequest(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })
}

// DELETE helper
async function del<T>(path: string, controller?: AbortController): Promise<T> {
  return apiRequest(path, { method: 'DELETE' })
}

// Aliases for backward compatibility
export const getJSON = get
export const postJSON = post  
export const putJSON = put
export const deleteJSON = del

// PATCH helper
export async function patchJSON<T>(
  path: string, 
  data: any, 
  controller?: AbortController
): Promise<T> {
  return apiRequest(path, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}
}

// Health check
export const healthCheck = () => get<{ status: string }>('/health')

// Notes API
export const listNotes = (query?: string, tags?: string[]) => {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (tags?.length) params.set('tags', tags.join(','))
  return get<any[]>(`/notes?${params}`)
}

export const createNote = (note: { title?: string; content: string; tags?: string[] }) =>
  post<any>('/notes', note)

export const updateNote = (id: string, note: Partial<{ title: string; content: string; tags: string[] }>) =>
  put<any>(`/notes/${id}`, note)

export const deleteNote = (id: string) => del<void>(`/notes/${id}`)

// Tasks API  
export const listTasks = (from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  return get<any[]>(`/tasks?${params}`)
}

export const getTodayTasks = () => get<any[]>('/tasks/today')

export const createTask = (task: {
  title: string
  due_at?: string
  priority?: 'low' | 'medium' | 'high'
  energy?: number
  parent_id?: string
  note_id?: string
}) => post<any>('/tasks', task)

export const updateTask = (id: string, task: Partial<{
  title: string
  status: string
  due_at: string
  priority: 'low' | 'medium' | 'high'
  energy: number
}>) => {
  console.log('updateTask called with:', { id, task });
  return apiRequest(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(task)
  });
}

export const deleteTask = (id: string) => del<void>(`/tasks/${id}`)

// Calendar
export const getCalendarEvents = (from: string, to: string) =>
  get<any[]>(`/calendar?from=${from}&to=${to}`)

export const createCalendarEvent = (event: {
  title: string
  start_at?: string
  end_at?: string  
  description?: string
  location?: string
}) => post<any>('/calendar', event)

export const updateCalendarEvent = (id: string, event: Partial<{
  title: string
  start_at: string
  end_at: string
  description: string
}>) => apiRequest(`/calendar/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(event)
})

export const deleteCalendarEvent = (id: string) => del<void>(`/calendar/${id}`)

// AI Features
export const summarize = (text: string, style?: string) =>
  post<{ summary: string }>('/summarize', { text, style })

export const extractTasks = (text: string) =>
  post<{ tasks: any[]; created_ids: number[] }>('/extract-tasks', { text })

export const summarizeYoutube = (url: string) =>
  post<{ ok: boolean; video_id: string; transcript_text: string; chapters: any[] }>('/summarize/yt', { url })

// Search
export const search = (query: string, filters?: Record<string, any>) =>
  post<{ results: any[]; total: number }>('/search', { query, filters })

// Time blocking
export const suggestTimeBlocks = (tasks: string[]) =>
  post<{ suggestions: any[] }>('/timeblocks/suggest', { tasks })

export const applyTimeBlocks = (blocks: any[]) =>
  post<{ created: any[] }>('/timeblocks/apply', { blocks })

// Daily/Weekly briefing
export const getDailyBrief = () =>
  get<{
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
