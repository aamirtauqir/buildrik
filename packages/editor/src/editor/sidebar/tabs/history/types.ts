/**
 * History Tab Types
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

/**
 * Top-level History destinations.
 *
 * `changes` used to sit here as a third peer. It is now a filter INSIDE Saves
 * (`SavesFilter`) — the Figma file already modelled it that way as
 * `History · Saves · changes`, one of nine states under `History · Saves`, and
 * a filter over the same list with the same entry point and the same
 * permissions is not a separate destination. See M1 in
 * docs/audits/2026-08-11-editor-job-architecture.md.
 *
 * `published` is new here and is a MOVE, not a new capability: the published-
 * version list already existed at two addresses (the Publish panel, and a
 * Settings screen that has now been removed). See M2 / Finding C.
 *
 * `backups` is drawn in Figma but deliberately absent — 7 `[design-ahead]`
 * boards with no backing service.
 */
export type HistoryView = "saves" | "published" | "activity" | "session";

/**
 * B8 — the four canonical Compare baselines. `current` is the working draft
 * and is always present, so the picker treats it as the constant peer of
 * whichever historical baseline the user picks. `approved` / `published` are
 * site-scoped and live on the dashboard; `saved` is composer-scoped
 * (IndexedDB on this device). The picker disables each option with a reason
 * when the baseline does not exist (Decision 31, board 4418:115592 shape).
 */
export type CompareBaseline = "approved" | "published" | "saved" | "current";

/** Which list the Saves pane shows. `changes` is the old Changes tab. */
export type SavesFilter = "milestones" | "changes";

export interface HistoryTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Project ID — scopes localStorage key so view preference is per-project */
  projectId?: string | null;
  /** Deep-link target — the sub-tab from `openLeftPanelToTab("history", …)`.
   *  Wins over the stored preference for one mount, so the ⋯ menu's "Publish
   *  history" lands on Published instead of wherever the user last was. */
  initialView?: HistoryView;
  /** B8 (code-gap plan) — when `initialView === "session"`, preselect the
   *  Compare picker to this baseline. Falls back to the first enabled
   *  baseline in SessionView if the requested one doesn't exist. Ignored
   *  when `initialView` is anything other than `"session"`. */
  initialBaseline?: CompareBaseline;
  /** The shell's publish job, forwarded to the Published view so boards
   *  184:37 / 184:45 / 453:4064 can run off one state. Null = no feed. */
  rollbackJob?: { state: "publishing" | "published" | "failed"; progress: number } | null;
  /** The server-created rollback job, handed up so the shell polls it. */
  onRollbackStarted?: (jobId: string) => void;
  /** Panel pin state */
  isExpanded?: boolean;
  /** Pin toggle callback */
  onExpandToggle?: () => void;
  /** Help button callback */
  onHelpClick?: () => void;
  /** Close panel callback */
  onClose?: () => void;
}

export interface ActivityViewProps {
  composer: Composer | null;
  searchQuery?: string;
  /** Error message to display in the error state */
  error?: string | null;
  /** Retry callback for the error state */
  onRetry?: () => void;
}

/** B6 (code-gap plan) — Activity tab reads site-scoped rows from the
 *  dashboard activity log; the shape mirrors the dashboard-side reader
 *  so editor + dashboard use the same vocabulary. */
export interface ActivityLogViewProps {
  /** Site the rows are scoped to — comes from `TabRouter`'s resolved projectId
   *  or the URL fallback. Null = opened without a project; the view renders
   *  a banner and not a query. */
  siteId: string | null;
}

/** B8 (code-gap plan) — Session tab. The composer is the working draft, so
 *  the diff is always against `current`; the picker chooses the OTHER side. */
export interface SessionViewProps {
  composer: Composer | null;
  /** Site the approved/published baselines are scoped to. Null = opened
   *  without a project; the picker disables approved/published with reasons
   *  and the saved-only path still works (composer-saved is per-device). */
  siteId: string | null;
  /** Preselect a baseline when one of the three Compare doors opened us. The
   *  picker falls back to the first ENABLED option if the requested one
   *  doesn't exist — a deep link can never strand the user on a dead chip. */
  initialBaseline?: CompareBaseline;
}

/** B8 (code-gap plan) — picker for the four Compare baselines. Disabled
 *  state carries a reason per Decision 31 (board 4418:115592). */
export interface ComparePickerProps {
  /** Which baselines are available on this site/device. The picker disables
   *  any baseline missing from this object and renders its reason. */
  availability: Record<CompareBaseline, { available: boolean; reason?: string }>;
  /** Currently selected baseline. `current` is always selectable. */
  value: CompareBaseline;
  onChange: (next: CompareBaseline) => void;
}
