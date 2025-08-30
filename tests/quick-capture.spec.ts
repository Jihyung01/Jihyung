import { test, expect } from '@playwright/test'

test.describe('Quick Capture', () => {
  test('should open capture modal with keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    
    // Press Alt+C to open capture modal
    await page.keyboard.press('Alt+KeyC')
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('text=빠른 캡처')).toBeVisible()
  })

  test('should create a note', async ({ page }) => {
    await page.goto('/')
    
    // Open capture modal
    await page.getByTestId('quick-capture-open').click()
    
    // Enter text content
    const testContent = 'This is a test note from Playwright'
    await page.locator('textarea').fill(testContent)
    
    // Save the note
    await page.getByTestId('quick-capture-save').click()
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    
    // Note should appear in recent notes (with some delay for API)
    await page.waitForTimeout(1000)
    await expect(page.locator('text=This is a test note')).toBeVisible()
  })

  test('should summarize text', async ({ page }) => {
    await page.goto('/')
    
    // Open capture modal
    await page.getByTestId('quick-capture-open').click()
    
    // Enter longer text content
    const longContent = `
      Today we had a productive team meeting about the Q1 project roadmap.
      Key decisions made:
      1. We will prioritize the user authentication feature
      2. Database migration should be completed by end of month
      3. UI redesign will start in February
      
      Action items:
      - John will handle the backend API updates
      - Sarah will work on the frontend components
      - Mike will coordinate with the design team
    `
    
    await page.locator('textarea').fill(longContent)
    
    // Click summarize button
    await page.getByTestId('summarize').click()
    
    // Should show summarized content
    await expect(page.locator('text=AI 요약')).toBeVisible()
  })

  test('should extract tasks', async ({ page }) => {
    await page.goto('/')
    
    // Open capture modal
    await page.getByTestId('quick-capture-open').click()
    
    // Enter content with tasks
    const taskContent = `
      Meeting notes from project kickoff:
      
      TODO items:
      - Set up development environment
      - Create project repository
      - Schedule weekly standup meetings
      - Review technical requirements
      - Prepare project timeline
    `
    
    await page.locator('textarea').fill(taskContent)
    
    // Click extract tasks button
    await page.getByTestId('extract-tasks').click()
    
    // Should extract and create tasks
    await page.waitForTimeout(2000) // Wait for API call
    
    // Close modal
    await page.getByTestId('quick-capture-cancel').click()
    
    // Navigate to tasks page to verify
    await page.getByTestId('tasks-nav').click()
    
    // Should see extracted tasks
    await expect(page.locator('text=Set up development environment')).toBeVisible()
  })

  test('should handle keyboard shortcuts in modal', async ({ page }) => {
    await page.goto('/')
    
    // Open capture modal
    await page.keyboard.press('Alt+KeyC')
    
    // Enter some text
    await page.locator('textarea').fill('Test note for keyboard shortcut')
    
    // Use Ctrl+Enter to save
    await page.keyboard.press('Control+Enter')
    
    // Modal should close and note should be saved
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    await expect(page.locator('text=Test note for keyboard')).toBeVisible()
  })
})