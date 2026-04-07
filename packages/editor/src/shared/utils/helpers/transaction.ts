/**
 * Aquibra Helpers - Transaction Helper
 * Composer transaction wrapper
 *
 * @module utils/helpers/transaction
 * @license BSD-3-Clause
 */

// =============================================================================
// TRANSACTION HELPER
// =============================================================================

/**
 * Run a function wrapped in a transaction
 */
export function runTransaction(
  composer:
    | {
        beginTransaction?: (label: string) => void;
        endTransaction?: () => void;
      }
    | null
    | undefined,
  label: string,
  fn: () => void
): void {
  if (!composer) {
    fn();
    return;
  }

  if (typeof composer.beginTransaction === "function") {
    composer.beginTransaction(label);
  }
  try {
    fn();
  } finally {
    if (typeof composer.endTransaction === "function") {
      composer.endTransaction();
    }
  }
}
