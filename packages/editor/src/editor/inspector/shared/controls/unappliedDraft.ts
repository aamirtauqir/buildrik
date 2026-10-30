/**
 * The number field holding an entry it could not read (2L9 I05, 161:10541):
 * one at a time — the field with focus. Leaving the tab with it asks first
 * ("Unapplied font size · Keep editing / Revert and switch"); the field
 * registers itself while invalid and clears itself once fixed or gone.
 *
 * @license BSD-3-Clause
 */
export interface UnappliedDraft {
  /** The row's label, "Font size". */
  label: string;
  /** What was typed, "24pxx". */
  draft: string;
  /** What the element still has, "24px". */
  applied: string;
  /** Put the field back to the applied value. */
  revert: () => void;
}

let current: { owner: symbol; draft: UnappliedDraft } | null = null;

export function setUnappliedDraft(owner: symbol, draft: UnappliedDraft | null): void {
  if (draft) current = { owner, draft };
  else if (current?.owner === owner) current = null;
}

export const getUnappliedDraft = (): UnappliedDraft | null => current?.draft ?? null;
