import { test, expect } from '@playwright/test';

/**
 * E2E — Dispute Form
 * Happy-path: fill all fields, submit, assert TriageResult is visible.
 * Requirements: 1.2, 3.1, 3.2
 */

test.describe('Dispute Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we're on the New Dispute tab
    await page.getByTestId('tab-new-dispute').click();
  });

  test('happy path: submitting a valid dispute shows the triage result', async ({ page }) => {
    // Fill in all required fields
    await page.getByTestId('customer-name').fill('Jane Smith');
    await page.getByTestId('transaction-ref').fill('TXN-E2E-001');
    await page.getByTestId('payment-type').selectOption('card_transaction');
    await page.getByTestId('issue-category').selectOption('unauthorized_transaction');
    await page.getByTestId('transaction-status').selectOption('completed');
    await page.getByTestId('amount').fill('750');
    await page.getByTestId('transaction-date').fill('2024-01-15');
    await page.getByTestId('description').fill('E2E test dispute — unauthorized charge.');

    await page.getByTestId('submit-dispute').click();

    // Triage result card must appear with a recommendation label
    const triageResult = page.getByTestId('triage-result');
    await expect(triageResult).toBeVisible();

    // The result card must show a human-readable label (not the raw enum value)
    await expect(triageResult).toContainText('Escalate to Fraud Team');

    // A success banner with the dispute ID must appear
    const successBanner = page.getByTestId('success-banner');
    await expect(successBanner).toBeVisible();
    // Dispute ID is present and non-empty — any non-blank id is valid
    const bannerText = await successBanner.textContent();
    expect(bannerText).toMatch(/dispute id/i);
    expect(bannerText).not.toMatch(/Dispute ID:\s*$/); // ID value must follow the label
  });

  test('shows per-field validation errors when submitting an empty form', async ({ page }) => {
    await page.getByTestId('submit-dispute').click();

    // Required field errors must be shown without page reload
    await expect(page.getByText(/customer name is required/i)).toBeVisible();
    await expect(page.getByText(/transaction reference is required/i)).toBeVisible();
    await expect(page.getByText(/payment type is required/i)).toBeVisible();
    await expect(page.getByText(/issue category is required/i)).toBeVisible();
    await expect(page.getByText(/transaction status is required/i)).toBeVisible();
    await expect(page.getByText(/amount is required/i)).toBeVisible();
    await expect(page.getByText(/transaction date is required/i)).toBeVisible();
  });

  test('shows amount validation error for out-of-range values', async ({ page }) => {
    await page.getByTestId('amount').fill('-1');
    await page.getByTestId('submit-dispute').click();

    await expect(page.getByText(/amount must be between/i)).toBeVisible();
  });

  test('description character count decrements as user types', async ({ page }) => {
    // 2000 chars remaining initially
    await expect(page.getByText('(2000 characters remaining)')).toBeVisible();

    await page.getByTestId('description').fill('Hello');

    // 5 chars typed → 1995 remaining
    await expect(page.getByText('(1995 characters remaining)')).toBeVisible();
  });
});
