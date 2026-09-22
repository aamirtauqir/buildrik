/**
 * ComparePanel (B8, code-gap plan) — Picker + body selected by baseline.
 *
 * Wires the four existing Compare bodies behind the one ComparePicker:
 * - approved → ApprovedCompareView (panels/version-history)
 * - published → PublishDiffView (shell)
 * - saved    → CompareView (panels/version-history)
 * - current  → same `current` export path the saved body uses, so the user
 *              can also see the draft vs itself when they explicitly pick
 *              current (it lands on the body that says so)
 *
 * Bodies are NOT re-implemented here — the three doors used their own
 * diff engines (HTML stream, server deploy-payload diff, snapshot diff),
 * and unifying them would replace the diff, not just the picker chrome
 * (plan §16.1 / line 217, "B8 (three compares) — each item's whole point").
 *
 * When the picked version is identical to current the saved and approved
 * bodies already render a "No differences" message; the published body
 * returns an empty page list with `same` badges, which reads the same way.
 * Decision 31, board 4418:115592 shape.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, SkeletonBlock, EmptyState } from "@/editor/chrome-ui";
import { ComparePicker } from "./ComparePicker";
import type { CompareBaseline, ComparePickerProps } from "../types";

export interface ComparePanelProps extends ComparePickerProps {
  /** Composed bodies — keyed by baseline. The panel mounts whatever the
   *  picker currently selects. Bodies receive ONLY what they need; the
   *  panel does not pre-compute state for them. */
  bodies: Partial<Record<CompareBaseline, React.ReactNode>>;
  /** Loading-state placeholders keyed by baseline — drawn while a body is
   *  fetching. Empty = no loading. */
  loading?: Partial<Record<CompareBaseline, boolean>>;
  /** Error-state placeholders keyed by baseline. Empty = no error. */
  errors?: Partial<Record<CompareBaseline, { message: string; onRetry?: () => void } | undefined>>;
  /** Banner shown above the body when the picked baseline has no version
   *  (the picker chip itself is disabled + reason — Decision 31). Used when
   *  the picker falls through to a non-disabled option. */
  noVersionMessage?: string;
}

export const ComparePanel: React.FC<ComparePanelProps> = ({
  bodies,
  loading,
  errors,
  availability,
  value,
  onChange,
  noVersionMessage,
}) => {
  const currentBody = bodies[value];
  const currentLoading = loading?.[value] ?? false;
  const currentError = errors?.[value];

  return (
    <div className="tw:flex tw:flex-col tw:flex-1 tw:min-h-0" data-testid={`compare-panel-${value}`}>
      <ComparePicker availability={availability} value={value} onChange={onChange} />

      {noVersionMessage && (
        <p className="tw:mx-[var(--bk-space-12)] tw:mt-[var(--bk-space-8)] tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          {noVersionMessage}
        </p>
      )}

      {currentLoading && !currentBody && (
        <div className="tw:flex tw:flex-col tw:gap-2 tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-12)]">
          <SkeletonBlock className="tw:h-8 tw:w-full" />
          <SkeletonBlock className="tw:h-32 tw:w-full" />
        </div>
      )}

      {currentError && !currentLoading && (
        <div role="alert" className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-12)] tw:text-[12px] tw:text-[var(--bk-error)]">
          {currentError.message}
          {currentError.onRetry && (
            <>
              {" "}
              <Button
                type="button"
                color="light"
                size="xs"
                className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:text-[var(--bk-accent)] tw:underline"
                onClick={currentError.onRetry}
              >
                Try again
              </Button>
            </>
          )}
        </div>
      )}

      {!currentLoading && !currentError && !currentBody && (
        <div className="tw:flex-1 tw:flex tw:items-center tw:justify-center">
          <EmptyState
            title="Nothing to compare"
            body="Pick a saved milestone, a published version, or an approved snapshot to compare against your current draft."
          />
        </div>
      )}

      {currentBody && <div className="tw:flex-1 tw:min-h-0 tw:flex tw:flex-col">{currentBody}</div>}
    </div>
  );
};

export default ComparePanel;
