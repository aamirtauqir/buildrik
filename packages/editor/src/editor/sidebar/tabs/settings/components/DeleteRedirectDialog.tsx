/**
 * DeleteRedirectDialog — `Delete redirect /a → /b?` · Cancel / Delete.
 *
 * OWNER OVERRIDE 2026-10-04 (boards to update: 8136:215838 deleted-undo,
 * Clone 4254:75747 Edit redirect): every redirect delete asks first — the
 * Edit dialog's `Delete redirect` and a table row's `Delete` alike. The
 * boards drew a delete at once with an Undo toast; the toast stays, after
 * the confirm. No board draws this confirm yet.
 *
 * Built on chrome-ui's ConfirmDialog (destructive: red button, the scrim
 * does not dismiss), the same confirm Form submissions uses.
 *
 * @license BSD-3-Clause
 */

import { ConfirmDialog } from "@/editor/chrome-ui";

export interface DeleteRedirectDialogProps {
  /** The rule to delete; `null` keeps the dialog closed. */
  rule: { fromPath: string; toUrl: string } | null;
  onCancel(): void;
  onConfirm(): void;
}

export function DeleteRedirectDialog({ rule, onCancel, onConfirm }: DeleteRedirectDialogProps) {
  return (
    <ConfirmDialog
      open={rule !== null}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={rule ? `Delete redirect ${rule.fromPath} → ${rule.toUrl}?` : ""}
      message={rule ? `Visitors to ${rule.fromPath} will no longer be sent to ${rule.toUrl}.` : null}
      confirmLabel="Delete"
      tone="destructive"
      testId="set-rd-confirm"
    />
  );
}
