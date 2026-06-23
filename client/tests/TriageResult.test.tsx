// Feature: payment-dispute-triage, Property 12: Urgency indicator maps correctly to recommended action
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { TriageResult, type RecommendedAction } from '../src/components/TriageResult';

const ALL_ACTIONS: RecommendedAction[] = [
  'auto_refund',
  'manual_review',
  'escalate_to_fraud',
  'contact_customer',
  'reject_dispute',
];

const HUMAN_LABELS: Record<RecommendedAction, string> = {
  auto_refund: 'Auto Refund',
  manual_review: 'Manual Review',
  escalate_to_fraud: 'Escalate to Fraud Team',
  contact_customer: 'Contact Customer',
  reject_dispute: 'Reject Dispute',
};

describe('TriageResult', () => {
  // --- Property 12: Urgency indicator maps correctly to recommended action ---

  it('renders the high-urgency indicator only for escalate_to_fraud (property)', () => {
    // Feature: payment-dispute-triage, Property 12: Urgency indicator maps correctly to recommended action
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ACTIONS), (action) => {
        const { unmount } = render(<TriageResult action={action} />);

        const highUrgency = document.querySelector('[data-testid="triage-urgency-high"]');
        const standardPriority = document.querySelector(
          '[data-testid="triage-urgency-standard"]',
        );

        if (action === 'escalate_to_fraud') {
          expect(highUrgency).not.toBeNull();
          expect(standardPriority).toBeNull();
        } else {
          expect(highUrgency).toBeNull();
          expect(standardPriority).not.toBeNull();
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  // --- Example-based: triage-result testid is always present ---

  it('always renders the triage-result container', () => {
    for (const action of ALL_ACTIONS) {
      const { unmount } = render(<TriageResult action={action} />);
      expect(screen.getByTestId('triage-result')).toBeTruthy();
      unmount();
    }
  });

  // --- Human-readable labels ---

  it('displays the human-readable label for each action', () => {
    for (const action of ALL_ACTIONS) {
      const { unmount } = render(<TriageResult action={action} />);
      expect(screen.getByText(HUMAN_LABELS[action])).toBeTruthy();
      unmount();
    }
  });

  // --- Specific action examples ---

  it('renders high-urgency indicator for escalate_to_fraud', () => {
    render(<TriageResult action="escalate_to_fraud" />);
    expect(screen.getByTestId('triage-urgency-high')).toBeTruthy();
    expect(screen.queryByTestId('triage-urgency-standard')).toBeNull();
  });

  it('renders standard-priority indicator for auto_refund', () => {
    render(<TriageResult action="auto_refund" />);
    expect(screen.getByTestId('triage-urgency-standard')).toBeTruthy();
    expect(screen.queryByTestId('triage-urgency-high')).toBeNull();
  });

  it('renders standard-priority indicator for manual_review', () => {
    render(<TriageResult action="manual_review" />);
    expect(screen.getByTestId('triage-urgency-standard')).toBeTruthy();
    expect(screen.queryByTestId('triage-urgency-high')).toBeNull();
  });

  it('renders standard-priority indicator for contact_customer', () => {
    render(<TriageResult action="contact_customer" />);
    expect(screen.getByTestId('triage-urgency-standard')).toBeTruthy();
    expect(screen.queryByTestId('triage-urgency-high')).toBeNull();
  });

  it('renders standard-priority indicator for reject_dispute', () => {
    render(<TriageResult action="reject_dispute" />);
    expect(screen.getByTestId('triage-urgency-standard')).toBeTruthy();
    expect(screen.queryByTestId('triage-urgency-high')).toBeNull();
  });
});
