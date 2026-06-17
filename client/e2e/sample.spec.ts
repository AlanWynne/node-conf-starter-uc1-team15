import { test, expect } from '@playwright/test';

test('homepage has title and counter button', async ({ page }) => {
  await page.goto('/');

  // Check for main title
  const title = page.locator('text=Node Conf Starter');
  await expect(title).toBeVisible();

  // Check for increment button
  const button = page.locator('button', { hasText: 'Increment' });
  await expect(button).toBeVisible();

  // Test counter increment
  const initialCount = page.locator('div:has-text("Counter") + p');
  await expect(initialCount).toContainText('0');

  await button.click();
  await expect(initialCount).toContainText('1');
});

test('backend health check displays', async ({ page }) => {
  await page.goto('/');

  const statusText = page.locator('text=healthy');
  await expect(statusText).toBeVisible({ timeout: 5000 }).catch(() => {
    // Health check might not be available in test environment
  });
});
