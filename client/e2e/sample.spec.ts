import { test, expect } from '@playwright/test';

test('homepage shows the app title', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Payment Dispute Triage')).toBeVisible();
});

test('shows the backend health status', async ({ page }) => {
  await page.goto('/');

  // The Playwright config starts the API server, so the health check resolves to "healthy".
  const response = await page.request.get('http://localhost:3001/api/health');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe('healthy');
});
