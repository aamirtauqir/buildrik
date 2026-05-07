/**
 * Modal contract types — async-aware ModalSubmit + AsyncModalProps.
 *
 * Closes the audit-flagged "async/void onClose mismatch" pattern: modals
 * with `onConfirm`/`onSave`/`onResolve` returning `Promise<T>` whose
 * thrown errors were swallowed because the modal's `onClose` returned
 * `void` and no parent caught the rejection.
 *
 * Eng-review-corrected (2026-05-07): generic over args so each modal's
 * known submit shape is type-checked end-to-end. The original
 * `(...args: unknown[])` form defeated the purpose.
 *
 * Usage:
 *   interface CollectionSetupModalProps
 *     extends AsyncModalProps<[CollectionConfig], void> {
 *     defaultName?: string;
 *   }
 *
 * Inside the modal:
 *   const handleConfirm = async () => {
 *     try {
 *       await onSubmit(config);
 *       onClose();
 *     } catch (err) {
 *       if (onError) onError(err);
 *       else console.error("[Modal] submit failed (no onError handler)", err);
 *       // modal stays open so user can retry or correct input
 *     }
 *   };
 *
 * @license BSD-3-Clause
 */

/** Async modal submit handler. Generic over arg tuple + result type. */
export type ModalSubmit<
  TArgs extends readonly unknown[] = [],
  TResult = void,
> = (...args: TArgs) => Promise<TResult>;

/**
 * Base props for modals whose primary action is async.
 *
 * - `onClose` is sync: dismisses the modal without committing the action.
 * - `onSubmit` is async: commits the action; thrown errors must reach the user.
 * - `onError` is optional but strongly recommended in production: parent wires
 *   it to a toast/snackbar via `useToast().addToast(...)`. When omitted, the
 *   modal logs to console — visible in dev, NOT user-visible. Production
 *   modal-mounting code MUST pass `onError`.
 */
export interface AsyncModalProps<
  TArgs extends readonly unknown[] = [],
  TResult = void,
> {
  onClose: () => void;
  onSubmit: ModalSubmit<TArgs, TResult>;
  onError?: (err: unknown) => void;
}

/**
 * Helper for the standard modal submit flow: try → close-on-success,
 * try → onError-and-stay-open on failure. Modals can use this directly
 * or inline the pattern.
 */
export async function runModalSubmit<
  TArgs extends readonly unknown[],
  TResult,
>(
  args: TArgs,
  onSubmit: ModalSubmit<TArgs, TResult>,
  onClose: () => void,
  onError?: (err: unknown) => void,
): Promise<void> {
  try {
    await onSubmit(...args);
    onClose();
  } catch (err) {
    if (onError) {
      onError(err);
    } else {
      // Surface in dev. Production callers should always pass onError.
      // eslint-disable-next-line no-console
      console.error("[Modal] submit failed (no onError handler)", err);
    }
    // Intentionally do not call onClose — modal stays open for retry.
  }
}
