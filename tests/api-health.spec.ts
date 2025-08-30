import { test, expect } from '@playwright/test';

test.describe('API Health Tests', () => {
  test('should have working health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('timestamp');
  });

  test('should handle preflight OPTIONS requests', async ({ page }) => {
    const response = await page.request.fetch('/api/health', {
      method: 'OPTIONS'
    });
    
    expect(response.status()).toBe(204);
  });

  test('should return JSON error for 404', async ({ page }) => {
    const response = await page.request.get('/api/nonexistent');
    expect(response.status()).toBe(404);
    
    const json = await response.json();
    expect(json).toHaveProperty('error', 'not found');
  });
});