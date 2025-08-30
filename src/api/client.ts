const API_BASE = '/api'

interface ApiConfig {
  useAuth: boolean
  token?: string
}

// Get config from environment
const config: ApiConfig = {
  useAuth: !!import.meta.env.VITE_API_TOKEN,
  token: import.meta.env.VITE_API_TOKEN
}

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
  payload?: unknown,
  controller?: AbortController
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'PUT',
      body: payload ? JSON.stringify(payload) : undefined
    },
    controller
  )
}

// PATCH helper
export async function patchJSON<T>(
  path: string,
  payload?: unknown,
  controller?: AbortController
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'PATCH',
      body: payload ? JSON.stringify(payload) : undefined
    },
    controller
  )
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

export const updateNote = (id: number, note: Partial<{ title: string; content: string; tags: string[] }>) =>
  putJSON<any>(`/notes/${id}`, note)

export const deleteNote = (id: number) => deleteJSON<void>(`/notes/${id}`)

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
  parent_id?: number
  note_id?: number
}) => postJSON<any>('/tasks', task)

export const updateTask = (id: number, task: Partial<{
  title: string
  status: string
  due_at: string
  priority: 'low' | 'medium' | 'high'
  energy: number
}>) => patchJSON<any>(`/tasks/${id}`, task)

export const deleteTask = (id: number) => deleteJSON<void>(`/tasks/${id}`)

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

// Calendar
export const getCalendarEvents = (from: string, to: string) =>
  getJSON<any[]>(`/calendar?from=${from}&to=${to}`)

export const createCalendarEvent = (event: {
  title: string
  start_at: string
  end_at: string
  description?: string
}) => postJSON<any>('/calendar', event)

export const updateCalendarEvent = (id: number, event: Partial<{
  title: string
  start_at: string
  end_at: string
  description: string
}>) => patchJSON<any>(`/calendar/${id}`, event)

export const deleteCalendarEvent = (id: number) => deleteJSON<void>(`/calendar/${id}`)

// Time blocking
export const suggestTimeBlocks = (tasks: number[]) =>
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

export const getWeeklyReview = () =>
  getJSON<{
    week_start: string
    week_end: string
    completed_tasks: any[]
    created_notes: any[]
    summary?: string
    next_week_suggestions?: string[]
  }>('/weekly-review')

// File upload (multipart)
export async function uploadFile(file: File, endpoint: string = '/upload'): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
    credentials: 'include'
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `HTTP ${response.status}`)
  }

  return response.json()
}

// Audio transcription
export const transcribeAudio = (file: File) => uploadFile(file, '/transcribe')

export default {
  healthCheck,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  listTasks,
  getTodayTasks,
  createTask,
  updateTask,
  deleteTask,
  summarize,
  extractTasks,
  summarizeYoutube,
  search,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  suggestTimeBlocks,
  applyTimeBlocks,
  getDailyBrief,
  getWeeklyReview,
  uploadFile,
  transcribeAudio
}