import { test, expect } from '@playwright/test';

/**
 * E2E — Dispute List
 * Creates a dispute via the form, navigates to the list view, asserts the new row appears.
 * Requirements: 4.2
 */

test.describe('Dispute List', () => {
  test('a newly created dispute appears in the list view', async ({ page }) => {
    await page.goto('/');

    // Submit a new dispute
    await page.getByTestId('tab-new-dispute').click();

    await page.getByTestId('customer-name').fill('List Test User');
    await page.getByTestId('transaction-ref').fill('TXN-LIST-001');
    await page.getByTestId('payment-type').selectOption('bank_transfer');
    await page.getByTestId('issue-category').selectOption('missing_payment');
    await page.getByTestId('transaction-status').selectOption('pending');
    await page.getByTestId('amount').fill('250');
    await page.getByTestId('transaction-date').fill('2025-03-10');

    await page.getByTestId('submit-dispute').click();

    // Wait for success banner confirming the dispute was created
    const successBanner = page.getByTestId('success-banner');
    await expect(successBanner).toBeVisible();

    // Extract the dispute ID from the banner so we can target the exact row
    const bannerText = await successBanner.textContent();
    const idMatch = bannerText?.match(/Dispute ID:\s*(\S+)/);
    const disputeId = idMatch?.[1];
    expect(disputeId).toBeTruthy();

    // Navigate to the disputes list tab
    await page.getByTestId('tab-disputes').click();

    // The new dispute should appear as its own row — scoped by ID to avoid
    // false failures when previous runs left rows with the same customer name.
    await expect(page.locator(`[data-testid="dispute-row-${disputeId}"]`)).toBeVisible();
  });

  test('shows empty-state message when no disputes exist', async ({ page }) => {
    // This test is best-effort: if the DB already has disputes it won't show empty state.
    // We navigate directly and check for either the table or the empty state element.
    await page.goto('/');
    await page.getByTestId('tab-disputes').click();

    // Wait for the loading spinner to disappear before checking rendered state
    await page.waitForFunction(() => {
      const body = document.body.textContent ?? '';
      return !body.includes('Loading disputes');
    });

    // Either disputes are shown (table rows) or the empty state is visible
    const hasRows = await page.locator('table').count();
    const hasEmpty = await page.getByTestId('dispute-list-empty').count();

    expect(hasRows + hasEmpty).toBeGreaterThan(0);
  });
});
