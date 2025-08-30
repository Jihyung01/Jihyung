import { test, expect } from '@playwright/test'

test.describe('API Health', () => {
  test('should return 200 for health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  test('should handle preflight requests', async ({ page }) => {
    const response = await page.request.fetch('/api/health', {
      method: 'OPTIONS'
    })
    expect(response.status()).toBe(204)
  })

  test('should return 200 for notes endpoint', async ({ page }) => {
    const response = await page.request.get('/api/notes')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('should return 200 for tasks endpoint', async ({ page }) => {
    const response = await page.request.get('/api/tasks')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('should return 200 for daily brief', async ({ page }) => {
    const response = await page.request.get('/api/daily-brief')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.date).toBeDefined()
    expect(data.top_tasks).toBeDefined()
    expect(Array.isArray(data.top_tasks)).toBeTruthy()
  })

  test('should create a note via API', async ({ page }) => {
    const noteData = {
      title: 'Test Note from API',
      content: 'This is a test note created via API',
      tags: ['test', 'api']
    }
    
    const response = await page.request.post('/api/notes', {
      data: noteData
    })
    
    expect(response.status()).toBe(201)
    
    const data = await response.json()
    expect(data.created).toBe(true)
    expect(data.data.title).toBe(noteData.title)
    expect(data.data.content).toBe(noteData.content)
  })

  test('should create a task via API', async ({ page }) => {
    const taskData = {
      title: 'Test Task from API',
      priority: 'high',
      status: 'pending'
    }
    
    const response = await page.request.post('/api/tasks', {
      data: taskData
    })
    
    expect(response.status()).toBe(201)
    
    const data = await response.json()
    expect(data.created).toBe(true)
    expect(data.data.title).toBe(taskData.title)
    expect(data.data.priority).toBe(taskData.priority)
  })
})