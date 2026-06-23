import { describe, it, expect } from 'vitest';
import { validateDisputeInput } from '../src/validation.js';

const validInput = {
  customerName: 'Jane Smith',
  transactionRef: 'TXN-20240601-001',
  paymentType: 'card_transaction',
  issueCategory: 'unauthorized_transaction',
  transactionStatus: 'completed',
  amount: 750.0,
  transactionDate: '2024-01-15T00:00:00.000Z',
};

describe('validateDisputeInput', () => {
  it('returns an empty array for a fully valid input', () => {
    expect(validateDisputeInput(validInput)).toEqual([]);
  });

  // --- Required field presence ---

  it('reports an error when customerName is missing', () => {
    const errors = validateDisputeInput({ ...validInput, customerName: undefined });
    expect(errors.some((e) => e.field === 'customerName')).toBe(true);
  });

  it('reports an error when customerName is empty string', () => {
    const errors = validateDisputeInput({ ...validInput, customerName: '' });
    expect(errors.some((e) => e.field === 'customerName')).toBe(true);
  });

  it('reports an error when transactionRef is missing', () => {
    const errors = validateDisputeInput({ ...validInput, transactionRef: undefined });
    expect(errors.some((e) => e.field === 'transactionRef')).toBe(true);
  });

  it('reports an error when amount is missing', () => {
    const errors = validateDisputeInput({ ...validInput, amount: undefined });
    expect(errors.some((e) => e.field === 'amount')).toBe(true);
  });

  it('reports an error when transactionDate is missing', () => {
    const errors = validateDisputeInput({ ...validInput, transactionDate: undefined });
    expect(errors.some((e) => e.field === 'transactionDate')).toBe(true);
  });

  // --- Enum fields ---

  it('reports an error for invalid paymentType and includes valid values in message', () => {
    const errors = validateDisputeInput({ ...validInput, paymentType: 'wire_transfer' });
    const err = errors.find((e) => e.field === 'paymentType');
    expect(err).toBeDefined();
    expect(err?.message).toContain('card_transaction');
    expect(err?.message).toContain('bank_transfer');
    expect(err?.message).toContain('direct_debit');
    expect(err?.message).toContain('standing_order');
  });

  it('accepts all valid paymentType values', () => {
    for (const pt of ['card_transaction', 'bank_transfer', 'direct_debit', 'standing_order']) {
      const errors = validateDisputeInput({ ...validInput, paymentType: pt });
      expect(errors.some((e) => e.field === 'paymentType')).toBe(false);
    }
  });

  it('reports an error for invalid issueCategory and includes valid values in message', () => {
    const errors = validateDisputeInput({ ...validInput, issueCategory: 'bad_category' });
    const err = errors.find((e) => e.field === 'issueCategory');
    expect(err).toBeDefined();
    expect(err?.message).toContain('duplicate_charge');
    expect(err?.message).toContain('unauthorized_transaction');
  });

  it('accepts all valid issueCategory values', () => {
    for (const ic of [
      'duplicate_charge',
      'failed_transfer',
      'missing_payment',
      'unauthorized_transaction',
      'incorrect_amount',
    ]) {
      const errors = validateDisputeInput({ ...validInput, issueCategory: ic });
      expect(errors.some((e) => e.field === 'issueCategory')).toBe(false);
    }
  });

  it('reports an error for invalid transactionStatus and includes valid values in message', () => {
    const errors = validateDisputeInput({ ...validInput, transactionStatus: 'processing' });
    const err = errors.find((e) => e.field === 'transactionStatus');
    expect(err).toBeDefined();
    expect(err?.message).toContain('pending');
    expect(err?.message).toContain('completed');
    expect(err?.message).toContain('failed');
    expect(err?.message).toContain('reversed');
  });

  it('accepts all valid transactionStatus values', () => {
    for (const ts of ['pending', 'completed', 'failed', 'reversed']) {
      const errors = validateDisputeInput({ ...validInput, transactionStatus: ts });
      expect(errors.some((e) => e.field === 'transactionStatus')).toBe(false);
    }
  });

  // --- Amount ---

  it('accepts amount at the lower boundary 0.01', () => {
    const errors = validateDisputeInput({ ...validInput, amount: 0.01 });
    expect(errors.some((e) => e.field === 'amount')).toBe(false);
  });

  it('accepts amount at the upper boundary 999999999.99', () => {
    const errors = validateDisputeInput({ ...validInput, amount: 999999999.99 });
    expect(errors.some((e) => e.field === 'amount')).toBe(false);
  });

  it('rejects amount of 0', () => {
    const errors = validateDisputeInput({ ...validInput, amount: 0 });
    const err = errors.find((e) => e.field === 'amount');
    expect(err).toBeDefined();
    expect(err?.message).toBe('Must be between 0.01 and 999999999.99');
  });

  it('rejects negative amount', () => {
    const errors = validateDisputeInput({ ...validInput, amount: -1 });
    expect(errors.some((e) => e.field === 'amount')).toBe(true);
  });

  it('rejects amount above upper boundary', () => {
    const errors = validateDisputeInput({ ...validInput, amount: 1000000000 });
    expect(errors.some((e) => e.field === 'amount')).toBe(true);
  });

  it('rejects non-numeric amount', () => {
    const errors = validateDisputeInput({ ...validInput, amount: 'not-a-number' });
    expect(errors.some((e) => e.field === 'amount')).toBe(true);
  });

  // --- transactionDate ---

  it('accepts a valid ISO 8601 date in the past', () => {
    const errors = validateDisputeInput({ ...validInput, transactionDate: '2023-06-01T12:00:00Z' });
    expect(errors.some((e) => e.field === 'transactionDate')).toBe(false);
  });

  it('accepts a date-only ISO 8601 string in the past', () => {
    const errors = validateDisputeInput({ ...validInput, transactionDate: '2023-01-01' });
    expect(errors.some((e) => e.field === 'transactionDate')).toBe(false);
  });

  it('rejects a future transactionDate', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const errors = validateDisputeInput({ ...validInput, transactionDate: future });
    const err = errors.find((e) => e.field === 'transactionDate');
    expect(err).toBeDefined();
  });

  it('rejects an invalid date string', () => {
    const errors = validateDisputeInput({ ...validInput, transactionDate: 'not-a-date' });
    expect(errors.some((e) => e.field === 'transactionDate')).toBe(true);
  });

  it('rejects a non-ISO format date', () => {
    const errors = validateDisputeInput({ ...validInput, transactionDate: '15/06/2024' });
    expect(errors.some((e) => e.field === 'transactionDate')).toBe(true);
  });

  // --- Collect all errors in a single pass ---

  it('collects multiple errors in a single pass', () => {
    const errors = validateDisputeInput({
      ...validInput,
      customerName: '',
      paymentType: 'invalid',
      amount: -5,
    });
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('customerName');
    expect(fields).toContain('paymentType');
    expect(fields).toContain('amount');
  });

  it('returns empty array when input is valid — no false positives on valid fields', () => {
    const errors = validateDisputeInput(validInput);
    expect(errors).toHaveLength(0);
  });

  // --- Non-object inputs ---

  it('returns all field errors when body is null', () => {
    const errors = validateDisputeInput(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns all field errors when body is a string', () => {
    const errors = validateDisputeInput('bad input');
    expect(errors.length).toBeGreaterThan(0);
  });
});
