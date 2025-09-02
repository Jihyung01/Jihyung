import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    
    // Should start on dashboard
    await expect(page.locator('h1')).toContainText('Jihyung')
    
    // Navigate to notes
    await page.getByTestId('notes-nav').click()
    await expect(page.locator('h1')).toContainText('노트')
    
    // Navigate to tasks
    await page.getByTestId('tasks-nav').click()
    await expect(page.locator('h1')).toContainText('태스크')
    
    // Navigate to calendar
    await page.getByTestId('calendar-nav').click()
    await expect(page.locator('h1')).toContainText('캘린더')
    
    // Navigate back to dashboard
    await page.getByTestId('dashboard-nav').click()
    await expect(page.locator('h1')).toContainText('Jihyung')
  })

  test('should show no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForTimeout(2000) // Wait for initial load
    
    // Allow some expected dev warnings but no real errors
    const realErrors = consoleErrors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('Development mode')
    )
    
    expect(realErrors).toHaveLength(0)
  })
})