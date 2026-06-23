/**
 * Business rule thresholds for the payment dispute triage engine.
 * Named constants replace magic numbers in triage-engine.ts and validation.ts.
 */

// Triage rule thresholds
export const FRAUD_ESCALATION_AMOUNT_THRESHOLD = 500;
export const MISSING_PAYMENT_ESCALATION_DAYS = 30;

// Validation boundaries
export const MIN_DISPUTE_AMOUNT = 0.01;
export const MAX_DISPUTE_AMOUNT = 999999999.99;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_CUSTOMER_NAME_LENGTH = 200;
export const MAX_TRANSACTION_REF_LENGTH = 50;

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Dispute reference format: DSP-YYYYMMDD-XXXX (4 uppercase alphanumeric chars)
export const DISPUTE_REF_PREFIX = 'DSP';
export const DISPUTE_REF_SUFFIX_LENGTH = 4;
export const DISPUTE_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
