import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

// Default fetch stub — returns empty disputes list for DisputeList,
// and an empty disputes array for any /api/disputes call.
function stubFetch(overrides?: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/api/disputes')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              overrides ?? { data: [], pagination: { page: 1, pageSize: 50, total: 0 } }
            ),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      } as Response);
    })
  );
}

describe('App', () => {
  beforeEach(() => {
    stubFetch();
  });

  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByText('Payment Dispute Triage')).toBeInTheDocument();
  });

  it('renders the New Dispute and Disputes tabs', () => {
    render(<App />);
    expect(screen.getByTestId('tab-new-dispute')).toBeInTheDocument();
    expect(screen.getByTestId('tab-disputes')).toBeInTheDocument();
  });

  it('shows the New Dispute form by default', () => {
    render(<App />);
    expect(screen.getByTestId('tab-new-dispute')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('submit-dispute')).toBeInTheDocument();
  });

  it('switches to the disputes list when the Disputes tab is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('tab-disputes'));

    expect(screen.getByTestId('tab-disputes')).toHaveAttribute('aria-selected', 'true');
    // DisputeList renders an empty-state message when no disputes exist
    expect(await screen.findByTestId('dispute-list-empty')).toBeInTheDocument();
  });

  it('hides the tab bar and shows a back button when a dispute is selected', async () => {
    const disputeId = 'clx-test-001';
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (typeof url === 'string' && url.includes(`/api/disputes/${disputeId}`)) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: disputeId,
                customerName: 'Test User',
                transactionRef: 'TXN-001',
                paymentType: 'card_transaction',
                issueCategory: 'incorrect_amount',
                transactionStatus: 'completed',
                amount: 120.0,
                transactionDate: '2026-01-01T00:00:00.000Z',
                description: '',
                recommendedAction: 'manual_review',
                disputeStatus: 'open',
                createdAt: '2026-06-01T00:00:00.000Z',
                updatedAt: '2026-06-01T00:00:00.000Z',
                statusHistory: [],
              }),
          } as Response);
        }
        // disputes list
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: disputeId,
                  customerName: 'Test User',
                  paymentType: 'card_transaction',
                  issueCategory: 'incorrect_amount',
                  recommendedAction: 'manual_review',
                  disputeStatus: 'open',
                  amount: 120.0,
                  createdAt: '2026-06-01T00:00:00.000Z',
                },
              ],
              pagination: { page: 1, pageSize: 50, total: 1 },
            }),
        } as Response);
      })
    );

    const user = userEvent.setup();
    render(<App />);

    // Navigate to the disputes list
    await user.click(screen.getByTestId('tab-disputes'));
    const row = await screen.findByTestId(`dispute-row-${disputeId}`);
    await user.click(row);

    // Tab bar should be gone; back button should appear
    expect(screen.queryByTestId('tab-new-dispute')).not.toBeInTheDocument();
    expect(screen.getByTestId('back-to-list')).toBeInTheDocument();
  });

  it('returns to the disputes list when the back button is clicked', async () => {
    const disputeId = 'clx-test-002';
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (typeof url === 'string' && url.includes(`/api/disputes/${disputeId}`)) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: disputeId,
                customerName: 'Back Test',
                transactionRef: 'TXN-002',
                paymentType: 'bank_transfer',
                issueCategory: 'missing_payment',
                transactionStatus: 'pending',
                amount: 50.0,
                transactionDate: '2026-02-01T00:00:00.000Z',
                description: '',
                recommendedAction: 'manual_review',
                disputeStatus: 'open',
                createdAt: '2026-06-02T00:00:00.000Z',
                updatedAt: '2026-06-02T00:00:00.000Z',
                statusHistory: [],
              }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: disputeId,
                  customerName: 'Back Test',
                  paymentType: 'bank_transfer',
                  issueCategory: 'missing_payment',
                  recommendedAction: 'manual_review',
                  disputeStatus: 'open',
                  amount: 50.0,
                  createdAt: '2026-06-02T00:00:00.000Z',
                },
              ],
              pagination: { page: 1, pageSize: 50, total: 1 },
            }),
        } as Response);
      })
    );

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('tab-disputes'));
    const row = await screen.findByTestId(`dispute-row-${disputeId}`);
    await user.click(row);

    // Confirm we are in the detail view
    expect(await screen.findByTestId('back-to-list')).toBeInTheDocument();

    // Click back
    await user.click(screen.getByTestId('back-to-list'));

    // Tab bar should be visible again; detail back button gone
    expect(screen.getByTestId('tab-disputes')).toBeInTheDocument();
    expect(screen.queryByTestId('back-to-list')).not.toBeInTheDocument();
  });
});
