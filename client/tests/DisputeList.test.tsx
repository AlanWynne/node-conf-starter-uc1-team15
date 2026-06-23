import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisputeList } from '../src/components/DisputeList';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeDispute = (id: string, overrides = {}) => ({
  id,
  customerName: 'Jane Smith',
  paymentType: 'card_transaction',
  issueCategory: 'unauthorized_transaction',
  recommendedAction: 'escalate_to_fraud',
  disputeStatus: 'open',
  amount: 750,
  createdAt: new Date('2026-06-22T10:00:00.000Z').toISOString(),
  ...overrides,
});

function makePaginatedResponse(data: ReturnType<typeof makeDispute>[], total: number, page = 1) {
  return {
    data,
    pagination: { page, pageSize: 50, total },
  };
}

// ---------------------------------------------------------------------------
// Task 9.2: Example-based tests for DisputeList states
// ---------------------------------------------------------------------------

describe('DisputeList — empty state', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('renders the empty-state element when no disputes exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePaginatedResponse([], 0)),
    } as Response);

    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-list-empty')).toBeTruthy();
    });
  });
});

describe('DisputeList — error state', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('renders the error banner and retry button when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Server error' } }),
    } as Response);

    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-list-error')).toBeTruthy();
    });
    expect(screen.getByTestId('retry-list')).toBeTruthy();
  });

  it('retries the fetch when the Retry button is clicked', async () => {
    const disputes = [makeDispute('disp-1')];

    // First call fails, second call succeeds
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePaginatedResponse(disputes, 1)),
      } as Response);

    const user = userEvent.setup();
    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-list-error')).toBeTruthy();
    });

    await user.click(screen.getByTestId('retry-list'));

    await waitFor(() => {
      expect(screen.getByTestId(`dispute-row-disp-1`)).toBeTruthy();
    });
  });
});

describe('DisputeList — populated state', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('renders a row for each returned dispute', async () => {
    const disputes = [makeDispute('disp-1'), makeDispute('disp-2'), makeDispute('disp-3')];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePaginatedResponse(disputes, 3)),
    } as Response);

    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-disp-1')).toBeTruthy();
    });
    expect(screen.getByTestId('dispute-row-disp-2')).toBeTruthy();
    expect(screen.getByTestId('dispute-row-disp-3')).toBeTruthy();
  });

  it('calls onSelect with the dispute id when a row is clicked', async () => {
    const onSelect = vi.fn();
    const disputes = [makeDispute('disp-42')];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePaginatedResponse(disputes, 1)),
    } as Response);

    const user = userEvent.setup();
    render(<DisputeList onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-disp-42')).toBeTruthy();
    });

    await user.click(screen.getByTestId('dispute-row-disp-42'));
    expect(onSelect).toHaveBeenCalledWith('disp-42');
  });

  it('does not show pagination controls when total <= pageSize', async () => {
    const disputes = [makeDispute('disp-1')];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePaginatedResponse(disputes, 1)),
    } as Response);

    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-disp-1')).toBeTruthy();
    });

    expect(screen.queryByRole('button', { name: /previous/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
  });
});

describe('DisputeList — pagination', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('shows pagination controls when total > pageSize', async () => {
    // 51 total with pageSize 50 → 2 pages → show pagination
    const disputes = Array.from({ length: 50 }, (_, i) => makeDispute(`disp-${i}`));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makePaginatedResponse(disputes, 51)),
    } as Response);

    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-disp-0')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: /previous/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
  });

  it('fetches the next page when the Next button is clicked', async () => {
    const page1 = Array.from({ length: 50 }, (_, i) => makeDispute(`p1-disp-${i}`));
    const page2 = [makeDispute('p2-disp-0')];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePaginatedResponse(page1, 51, 1)),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makePaginatedResponse(page2, 51, 2)),
      } as Response);

    const user = userEvent.setup();
    render(<DisputeList onSelect={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-p1-disp-0')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dispute-row-p2-disp-0')).toBeTruthy();
    });
  });
});
