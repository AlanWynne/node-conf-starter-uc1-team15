import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisputeForm } from '../src/components/DisputeForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  return async () => {
    await user.type(screen.getByTestId('customer-name'), 'Jane Smith');
    await user.type(screen.getByTestId('transaction-ref'), 'TXN-001');
    await user.selectOptions(screen.getByTestId('payment-type'), 'card_transaction');
    await user.selectOptions(screen.getByTestId('issue-category'), 'unauthorized_transaction');
    await user.selectOptions(screen.getByTestId('transaction-status'), 'completed');
    await user.type(screen.getByTestId('amount'), '750');
    await user.type(screen.getByTestId('transaction-date'), '2024-01-15');
  };
}

// ---------------------------------------------------------------------------
// Task 8.2: Example-based tests — validation display
// ---------------------------------------------------------------------------

describe('DisputeForm — validation', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('shows per-field validation errors when required fields are missing on submit', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    // Submit without filling anything
    await user.click(screen.getByTestId('submit-dispute'));

    // All required field errors should be displayed
    await waitFor(() => {
      expect(screen.getByText(/customer name is required/i)).toBeTruthy();
    });
    expect(screen.getByText(/transaction reference is required/i)).toBeTruthy();
    expect(screen.getByText(/payment type is required/i)).toBeTruthy();
    expect(screen.getByText(/issue category is required/i)).toBeTruthy();
    expect(screen.getByText(/transaction status is required/i)).toBeTruthy();
    expect(screen.getByText(/amount is required/i)).toBeTruthy();
    expect(screen.getByText(/transaction date is required/i)).toBeTruthy();
  });

  it('does not clear already-populated fields when validation fails', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    // Fill some fields but not all
    await user.type(screen.getByTestId('customer-name'), 'Jane Smith');
    await user.type(screen.getByTestId('transaction-ref'), 'TXN-001');

    await user.click(screen.getByTestId('submit-dispute'));

    // Populated fields should retain their values
    await waitFor(() => {
      expect((screen.getByTestId('customer-name') as HTMLInputElement).value).toBe('Jane Smith');
    });
    expect((screen.getByTestId('transaction-ref') as HTMLInputElement).value).toBe('TXN-001');
  });

  it('shows amount range error when amount is out of bounds', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    await user.type(screen.getByTestId('amount'), '-5');
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByText(/amount must be between/i)).toBeTruthy();
    });
  });

  it('shows date error when transaction date is in the future', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    await user.type(screen.getByTestId('transaction-date'), '2099-12-31');
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByText(/transaction date cannot be in the future/i)).toBeTruthy();
    });
  });

  // Requirement 1.6 — description character counter and max-length enforcement
  it('displays the remaining character count for the description field', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    // Initially the full 2000 chars remain
    expect(screen.getByText(/2000 characters remaining/i)).toBeTruthy();

    // Type 5 characters — counter should decrement to 1995
    await user.type(screen.getByTestId('description'), 'Hello');

    await waitFor(() => {
      expect(screen.getByText(/1995 characters remaining/i)).toBeTruthy();
    });
  });

  it('shows a description validation error when description exceeds 2000 characters', async () => {
    const user = userEvent.setup();
    render(<DisputeForm />);

    // Use fireEvent to set a 2001-char value directly — avoids userEvent.type timeout
    const textarea = screen.getByTestId('description');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(2001) } });

    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByText(/description must not exceed 2000 characters/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Task 8.2: Example-based tests — success flow
// ---------------------------------------------------------------------------

describe('DisputeForm — success flow', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('renders TriageResult and the success banner with the dispute reference on successful submission', async () => {
    const mockResponse = {
      id: 'dispute-abc-123',
      disputeRef: 'DSP-20260622-K7M2',
      recommendedAction: 'escalate_to_fraud',
      customerName: 'Jane Smith',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const user = userEvent.setup();
    render(<DisputeForm />);

    await fillValidForm(user)();
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByTestId('success-banner')).toBeTruthy();
    });

    // Success banner contains the human-readable dispute reference
    expect(screen.getByTestId('success-banner').textContent).toContain('DSP-20260622-K7M2');

    // TriageResult is rendered
    expect(screen.getByTestId('triage-result')).toBeTruthy();
  });

  it('shows the API error message when submission fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: 'Request validation failed', code: 'VALIDATION_ERROR' },
        }),
    } as Response);

    const user = userEvent.setup();
    render(<DisputeForm />);

    await fillValidForm(user)();
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
    });
    expect(screen.getByTestId('error-banner').textContent).toContain('Request validation failed');
  });
});

// ---------------------------------------------------------------------------
// Task 8.2: Example-based tests — network timeout
// ---------------------------------------------------------------------------

describe('DisputeForm — network timeout', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('shows the timeout error banner with a Retry button when fetch is aborted', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }),
    );

    const user = userEvent.setup();
    render(<DisputeForm />);

    await fillValidForm(user)();
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
    });

    // Retry button must be present
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
  });

  it('clears the timeout banner when the Retry button is clicked', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }),
    );

    const user = userEvent.setup();
    render(<DisputeForm />);

    await fillValidForm(user)();
    await user.click(screen.getByTestId('submit-dispute'));

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    // Banner should be gone after clicking Retry
    await waitFor(() => {
      expect(screen.queryByTestId('error-banner')).toBeNull();
    });
  });
});
