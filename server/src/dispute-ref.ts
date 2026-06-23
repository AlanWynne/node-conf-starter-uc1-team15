import { DISPUTE_REF_PREFIX, DISPUTE_REF_SUFFIX_LENGTH, DISPUTE_REF_ALPHABET } from './constants.js';

/**
 * Generates a human-readable, unique dispute reference in the format:
 *   DSP-YYYYMMDD-XXXX
 *
 * Where XXXX is a random string drawn from an unambiguous alphanumeric alphabet
 * (no 0/O or 1/I confusion). The date component comes from the current UTC date.
 *
 * Example: DSP-20260623-K7M2
 *
 * Uniqueness is enforced at the database level via a unique constraint.
 * Callers should regenerate and retry on a unique constraint violation.
 */
export function generateDisputeRef(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  let suffix = '';
  for (let i = 0; i < DISPUTE_REF_SUFFIX_LENGTH; i++) {
    suffix += DISPUTE_REF_ALPHABET[Math.floor(Math.random() * DISPUTE_REF_ALPHABET.length)];
  }

  return `${DISPUTE_REF_PREFIX}-${datePart}-${suffix}`;
}
