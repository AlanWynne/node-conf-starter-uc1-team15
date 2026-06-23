// Feature: payment-dispute-triage
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { triageDispute, type TriageInput, type RecommendedAction } from '../src/triage-engine.js';
import {
  FRAUD_ESCALATION_AMOUNT_THRESHOLD,
  MISSING_PAYMENT_ESCALATION_DAYS,
} from '../src/constants.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const paymentTypeArb = fc.constantFrom<TriageInput['paymentType']>(
  'card_transaction',
  'bank_transfer',
  'direct_debit',
  'standing_order',
);

const issueCategoryArb = fc.constantFrom<TriageInput['issueCategory']>(
  'duplicate_charge',
  'failed_transfer',
  'missing_payment',
  'unauthorized_transaction',
  'incorrect_amount',
);

const transactionStatusArb = fc.constantFrom<TriageInput['transactionStatus']>(
  'pending',
  'completed',
  'failed',
  'reversed',
);

const validInputArb = fc.record<TriageInput>({
  paymentType: paymentTypeArb,
  issueCategory: issueCategoryArb,
  transactionStatus: transactionStatusArb,
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
  disputeAge: fc.integer({ min: 0, max: 3650 }),
});

// ---------------------------------------------------------------------------
// Helper: derive the expected action from the rules in declaration order
// ---------------------------------------------------------------------------

function expectedAction(input: TriageInput): RecommendedAction {
  const { issueCategory, transactionStatus, amount, disputeAge } = input;

  if (issueCategory === 'unauthorized_transaction' && amount > FRAUD_ESCALATION_AMOUNT_THRESHOLD)
    return 'escalate_to_fraud';
  if (issueCategory === 'unauthorized_transaction' && amount <= FRAUD_ESCALATION_AMOUNT_THRESHOLD)
    return 'manual_review';
  if (issueCategory === 'duplicate_charge' && transactionStatus === 'completed')
    return 'auto_refund';
  if (issueCategory === 'failed_transfer' && transactionStatus === 'failed')
    return 'contact_customer';
  if (issueCategory === 'missing_payment' && disputeAge > MISSING_PAYMENT_ESCALATION_DAYS)
    return 'escalate_to_fraud';
  if (issueCategory === 'missing_payment' && disputeAge <= MISSING_PAYMENT_ESCALATION_DAYS)
    return 'manual_review';
  if (issueCategory === 'incorrect_amount') return 'manual_review';
  return 'manual_review';
}

// ---------------------------------------------------------------------------
// Property 2: Rule priority — first matching rule wins
// Feature: payment-dispute-triage, Property 2: Rule priority — first matching rule wins
// Validates: Requirements 2.1
// ---------------------------------------------------------------------------

describe('triageDispute — Property 2: Rule priority (first matching rule wins)', () => {
  it('always returns the action from the first matching rule', () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        expect(triageDispute(input)).toBe(expectedAction(input));
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Unauthorized transaction threshold
// Feature: payment-dispute-triage, Property 3: Unauthorized transaction threshold
// Validates: Requirements 2.2, 2.3
// ---------------------------------------------------------------------------

describe('triageDispute — Property 3: Unauthorized transaction threshold', () => {
  it('returns escalate_to_fraud when unauthorized_transaction amount > 500', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          transactionStatus: transactionStatusArb,
          // amount strictly above threshold
          amount: fc.float({ min: Math.fround(500.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        ({ paymentType, transactionStatus, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'unauthorized_transaction',
            transactionStatus,
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('escalate_to_fraud');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns manual_review when unauthorized_transaction amount <= 500', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          transactionStatus: transactionStatusArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        ({ paymentType, transactionStatus, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'unauthorized_transaction',
            transactionStatus,
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('manual_review');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Missing payment age threshold
// Feature: payment-dispute-triage, Property 4: Missing payment age threshold
// Validates: Requirements 2.6, 2.7
// ---------------------------------------------------------------------------

describe('triageDispute — Property 4: Missing payment age threshold', () => {
  it('returns escalate_to_fraud when missing_payment disputeAge > 30', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          transactionStatus: transactionStatusArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 31, max: 3650 }),
        }),
        ({ paymentType, transactionStatus, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'missing_payment',
            transactionStatus,
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('escalate_to_fraud');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns manual_review when missing_payment disputeAge <= 30', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          transactionStatus: transactionStatusArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 30 }),
        }),
        ({ paymentType, transactionStatus, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'missing_payment',
            transactionStatus,
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('manual_review');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Specific rule branches produce correct actions
// Feature: payment-dispute-triage, Property 5: Specific rule branches produce correct actions
// Validates: Requirements 2.4, 2.5, 2.8
// ---------------------------------------------------------------------------

describe('triageDispute — Property 5: Specific rule branches', () => {
  it('returns auto_refund for duplicate_charge + completed', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        ({ paymentType, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'duplicate_charge',
            transactionStatus: 'completed',
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('auto_refund');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns contact_customer for failed_transfer + failed', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        ({ paymentType, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'failed_transfer',
            transactionStatus: 'failed',
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('contact_customer');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns manual_review for incorrect_amount regardless of other fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: paymentTypeArb,
          transactionStatus: transactionStatusArb,
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        ({ paymentType, transactionStatus, amount, disputeAge }) => {
          const input: TriageInput = {
            paymentType,
            issueCategory: 'incorrect_amount',
            transactionStatus,
            amount,
            disputeAge,
          };
          expect(triageDispute(input)).toBe('manual_review');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Default fallback to manual_review
// Feature: payment-dispute-triage, Property 6: Default fallback to manual_review
// Validates: Requirements 2.9
// ---------------------------------------------------------------------------

describe('triageDispute — Property 6: Default fallback to manual_review', () => {
  it('returns manual_review for inputs that match no specific rule branch', () => {
    // Inputs that fall through all rules:
    //   duplicate_charge + non-completed status
    //   failed_transfer + non-failed status
    const nonCompletedStatusArb = fc.constantFrom<TriageInput['transactionStatus']>(
      'pending',
      'failed',
      'reversed',
    );
    const nonFailedStatusArb = fc.constantFrom<TriageInput['transactionStatus']>(
      'pending',
      'completed',
      'reversed',
    );

    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            paymentType: paymentTypeArb,
            issueCategory: fc.constant('duplicate_charge' as const),
            transactionStatus: nonCompletedStatusArb,
            amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
            disputeAge: fc.integer({ min: 0, max: 3650 }),
          }),
          fc.record({
            paymentType: paymentTypeArb,
            issueCategory: fc.constant('failed_transfer' as const),
            transactionStatus: nonFailedStatusArb,
            amount: fc.float({ min: Math.fround(0.01), max: Math.fround(999999999), noNaN: true }),
            disputeAge: fc.integer({ min: 0, max: 3650 }),
          }),
        ),
        (input) => {
          expect(triageDispute(input)).toBe('manual_review');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Task 2.7: Example-based boundary tests
// ---------------------------------------------------------------------------

describe('triageDispute — boundary conditions', () => {
  const base = {
    paymentType: 'card_transaction' as const,
    transactionStatus: 'completed' as const,
    disputeAge: 0,
  };

  // unauthorized_transaction amount boundary
  it('returns manual_review when unauthorized_transaction amount is exactly 500', () => {
    expect(triageDispute({ ...base, issueCategory: 'unauthorized_transaction', amount: 500 })).toBe(
      'manual_review',
    );
  });

  it('returns escalate_to_fraud when unauthorized_transaction amount is 500.01', () => {
    expect(
      triageDispute({ ...base, issueCategory: 'unauthorized_transaction', amount: 500.01 }),
    ).toBe('escalate_to_fraud');
  });

  // missing_payment disputeAge boundary
  it('returns manual_review when missing_payment disputeAge is exactly 30', () => {
    expect(triageDispute({ ...base, issueCategory: 'missing_payment', amount: 100, disputeAge: 30 })).toBe(
      'manual_review',
    );
  });

  it('returns escalate_to_fraud when missing_payment disputeAge is 31', () => {
    expect(
      triageDispute({ ...base, issueCategory: 'missing_payment', amount: 100, disputeAge: 31 }),
    ).toBe('escalate_to_fraud');
  });

  // default fallback
  it('returns manual_review for duplicate_charge + pending (default fallback)', () => {
    expect(
      triageDispute({
        ...base,
        issueCategory: 'duplicate_charge',
        transactionStatus: 'pending',
        amount: 100,
      }),
    ).toBe('manual_review');
  });

  it('returns manual_review for failed_transfer + completed (default fallback)', () => {
    expect(
      triageDispute({
        ...base,
        issueCategory: 'failed_transfer',
        transactionStatus: 'completed',
        amount: 100,
      }),
    ).toBe('manual_review');
  });
});
