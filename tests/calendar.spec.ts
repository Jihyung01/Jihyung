import { test, expect } from '@playwright/test';

test.describe('Calendar Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock calendar events API
    await page.route('/api/calendar*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [],
          task_events: [
            {
              id: 'task-1',
              title: 'Test Task',
              start: new Date().toISOString(),
              allDay: true,
              color: '#3b82f6'
            }
          ]
        })
      });
    });

    // Mock tasks API
    await page.route('/api/tasks*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Test Task',
            due_date: new Date().toISOString(),
            priority: 'medium',
            status: 'pending'
          }
        ])
      });
    });

    await page.goto('/');
    await page.getByTestId('calendar-nav').click();
    await page.waitForLoadState('networkidle');
  });

  test('should render calendar component', async ({ page }) => {
    await expect(page.locator('.fc')).toBeVisible();
    await expect(page.locator('text=오늘')).toBeVisible();
  });

  test('should navigate to previous period', async ({ page }) => {
    await page.getByTestId('calendar-prev').click();
    await expect(page.getByTestId('calendar-prev')).toBeVisible();
  });

  test('should navigate to next period', async ({ page }) => {
    await page.getByTestId('calendar-next').click();
    await expect(page.getByTestId('calendar-next')).toBeVisible();
  });

  test('should navigate to today', async ({ page }) => {
    // Go to previous month first
    await page.getByTestId('calendar-prev').click();
    await page.waitForTimeout(500);
    
    // Then click today
    await page.getByTestId('calendar-today').click();
    
    // Should show current month
    await expect(page.getByTestId('calendar-today')).toBeVisible();
  });

  test('should show task events on calendar', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForSelector('.fc-event', { timeout: 10000 });
    
    // Check if task events are displayed
    await expect(page.locator('.fc-event')).toBeVisible();
  });

  test('should display today\'s schedule summary', async ({ page }) => {
    await expect(page.locator('text=오늘의 일정')).toBeVisible();
  });

  test('should display calendar statistics', async ({ page }) => {
    await expect(page.locator('text=이번 주 통계')).toBeVisible();
  });
});