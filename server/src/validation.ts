import { MIN_DISPUTE_AMOUNT, MAX_DISPUTE_AMOUNT } from './constants.js';

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_PAYMENT_TYPES = [
  'card_transaction',
  'bank_transfer',
  'direct_debit',
  'standing_order',
] as const;

const VALID_ISSUE_CATEGORIES = [
  'duplicate_charge',
  'failed_transfer',
  'missing_payment',
  'unauthorized_transaction',
  'incorrect_amount',
] as const;

const VALID_TRANSACTION_STATUSES = [
  'pending',
  'completed',
  'failed',
  'reversed',
] as const;

const REQUIRED_FIELDS = [
  'customerName',
  'transactionRef',
  'paymentType',
  'issueCategory',
  'transactionStatus',
  'amount',
  'transactionDate',
] as const;

export function validateDisputeInput(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (body === null || typeof body !== 'object') {
    for (const field of REQUIRED_FIELDS) {
      errors.push({ field, message: `${field} is required` });
    }
    return errors;
  }

  const input = body as Record<string, unknown>;

  // Validate required string fields (customerName, transactionRef)
  for (const field of ['customerName', 'transactionRef'] as const) {
    const value = input[field];
    if (value === undefined || value === null || value === '') {
      errors.push({ field, message: `${field} is required` });
    }
  }

  // Validate paymentType enum
  const paymentType = input['paymentType'];
  if (paymentType === undefined || paymentType === null || paymentType === '') {
    errors.push({ field: 'paymentType', message: 'paymentType is required' });
  } else if (!VALID_PAYMENT_TYPES.includes(paymentType as (typeof VALID_PAYMENT_TYPES)[number])) {
    errors.push({
      field: 'paymentType',
      message: `Must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`,
    });
  }

  // Validate issueCategory enum
  const issueCategory = input['issueCategory'];
  if (issueCategory === undefined || issueCategory === null || issueCategory === '') {
    errors.push({ field: 'issueCategory', message: 'issueCategory is required' });
  } else if (
    !VALID_ISSUE_CATEGORIES.includes(issueCategory as (typeof VALID_ISSUE_CATEGORIES)[number])
  ) {
    errors.push({
      field: 'issueCategory',
      message: `Must be one of: ${VALID_ISSUE_CATEGORIES.join(', ')}`,
    });
  }

  // Validate transactionStatus enum
  const transactionStatus = input['transactionStatus'];
  if (transactionStatus === undefined || transactionStatus === null || transactionStatus === '') {
    errors.push({ field: 'transactionStatus', message: 'transactionStatus is required' });
  } else if (
    !VALID_TRANSACTION_STATUSES.includes(
      transactionStatus as (typeof VALID_TRANSACTION_STATUSES)[number],
    )
  ) {
    errors.push({
      field: 'transactionStatus',
      message: `Must be one of: ${VALID_TRANSACTION_STATUSES.join(', ')}`,
    });
  }

  // Validate amount
  const amount = input['amount'];
  if (amount === undefined || amount === null || amount === '') {
    errors.push({ field: 'amount', message: 'amount is required' });
  } else {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(numericAmount) || numericAmount < MIN_DISPUTE_AMOUNT || numericAmount > MAX_DISPUTE_AMOUNT) {
      errors.push({ field: 'amount', message: `Must be between ${MIN_DISPUTE_AMOUNT} and ${MAX_DISPUTE_AMOUNT}` });
    }
  }

  // Validate transactionDate
  const transactionDate = input['transactionDate'];
  if (transactionDate === undefined || transactionDate === null || transactionDate === '') {
    errors.push({ field: 'transactionDate', message: 'transactionDate is required' });
  } else if (typeof transactionDate !== 'string') {
    errors.push({
      field: 'transactionDate',
      message: 'Must be a valid ISO 8601 date and must not be in the future',
    });
  } else {
    const parsed = new Date(transactionDate);
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (isNaN(parsed.getTime()) || !iso8601Regex.test(transactionDate)) {
      errors.push({
        field: 'transactionDate',
        message: 'Must be a valid ISO 8601 date and must not be in the future',
      });
    } else if (parsed.getTime() > Date.now()) {
      errors.push({
        field: 'transactionDate',
        message: 'Must be a valid ISO 8601 date and must not be in the future',
      });
    }
  }

  return errors;
}
