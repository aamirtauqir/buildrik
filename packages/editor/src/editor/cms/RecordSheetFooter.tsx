/**
 * RecordSheetFooter — the record editor's actions (design-2l9 122:43331):
 * Save record first, then Cancel (or what Cancel is while a save runs),
 * then what blocks the save. A page waiting on this record (125:35023 /
 * 125:36161) turns the footer into "After saving: Open {page}" with
 * Cancel navigation · Save and leave. RecordSheet owns every state.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

/* 165:520 footer: Cancel 96 × 32, Save record 160 × 32. */
const FOOT_BTN_SECONDARY = "tw:h-8 tw:w-24 tw:px-3 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
const FOOT_BTN_PRIMARY = "tw:h-8 tw:w-40 tw:px-3 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";

export interface RecordSheetFooterProps {
  /** The page waiting on this record, or null. */
  pendingPage: string | null;
  onCancelNavigation: () => void;
  saveDisabled: boolean;
  saveLeaveDisabled: boolean;
  saveLabel: string;
  onSave: () => void;
  /** stay: a way out runs with the save (168:21620) · unavailable: the submitted
   *  save owns the record (126:37330) · drop-return: a paused way out · close. */
  cancel: "stay" | "unavailable" | "drop-return" | "close";
  onStay: () => void;
  onDropReturn: () => void;
  onClose: () => void;
  requiredNote: string | null;
  newHint: string | null;
}

export function RecordSheetFooter(p: RecordSheetFooterProps) {
  return (
    <footer className="tw:flex tw:h-14 tw:flex-none tw:items-center tw:gap-3 tw:pl-6 tw:pr-[44px]">
      {p.pendingPage ? (
        <>
          <span className="tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" data-testid="cms-sheet-pending">
            {`After saving: Open ${p.pendingPage}`}
          </span>
          <Button size="xs" variant="secondary" className={`${FOOT_BTN_SECONDARY} tw:w-auto!`} data-testid="cms-sheet-cancel-nav" onClick={p.onCancelNavigation}>
            Cancel navigation
          </Button>
          <Button size="xs" variant="secondary" className={`${FOOT_BTN_SECONDARY} tw:w-auto!`} disabled={p.saveLeaveDisabled} data-testid="cms-sheet-save-leave" onClick={p.onSave}>
            Save and leave
          </Button>
        </>
      ) : (
        <>
          <Button size="xs" className={FOOT_BTN_PRIMARY} disabled={p.saveDisabled} data-testid="cms-sheet-save" onClick={p.onSave}>
            {p.saveLabel}
          </Button>
          {p.cancel === "stay" ? (
            <Button size="xs" variant="secondary" className={FOOT_BTN_SECONDARY} data-testid="cms-sheet-stay" onClick={p.onStay}>
              Cancel
            </Button>
          ) : p.cancel === "unavailable" ? (
            <>
              <Button size="xs" variant="secondary" className={`${FOOT_BTN_SECONDARY} tw:w-auto!`} disabled data-testid="cms-sheet-cancel-unavailable">
                Cancel unavailable
              </Button>
              <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">This submitted save can’t be cancelled.</span>
            </>
          ) : p.cancel === "drop-return" ? (
            <Button size="xs" variant="secondary" className={FOOT_BTN_SECONDARY} data-testid="cms-sheet-cancel-return" onClick={p.onDropReturn}>
              Cancel
            </Button>
          ) : (
            /* 165:797 — Cancel stays usable while a save runs. */
            <Button size="xs" variant="secondary" className={FOOT_BTN_SECONDARY} data-testid="cms-sheet-cancel" onClick={p.onClose}>
              Cancel
            </Button>
          )}
          <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            {p.requiredNote ? (
              /* 128:39389 — what stops the save, beside it. */
              <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" data-testid="cms-sheet-required">
                {p.requiredNote}
              </span>
            ) : null}
            {/* 6749:59940 — a new record says what Save needs and what it does. */}
            {p.newHint ? (
              <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="cms-sheet-new-hint">
                {p.newHint}
              </span>
            ) : null}
          </span>
        </>
      )}
    </footer>
  );
}
