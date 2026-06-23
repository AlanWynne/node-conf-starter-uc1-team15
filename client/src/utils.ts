/**
 * Shared UI utility functions used across components.
 * Centralised here to avoid duplication and make caching easy.
 */

/**
 * Converts a snake_case or underscore-separated value into a human-readable
 * title-cased label.
 *
 * Example: "card_transaction" → "Card Transaction"
 */
export function formatLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
