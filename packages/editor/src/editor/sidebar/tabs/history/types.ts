/**
 * History Tab Types
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

/**
 * Top-level History destinations — board 4418:73791's tab row, Session ·
 * Saves · Published (B8, G1-068), plus Activity (B6).
 *
 * `session` is the undo stack of this editing session. It was a filter chip
 * inside Saves ("This session", M1); the v3 IA boards give it back its own
 * tab, first in the row, and the chip is gone.
 *
 * `published` is new here and is a MOVE, not a new capability: the published-
 * version list already existed at two addresses (the Publish panel, and a
 * Settings screen that has now been removed). See M2 / Finding C.
 *
 * `backups` is drawn in Figma but deliberately absent — 7 `[design-ahead]`
 * boards with no backing service.
 */
export type HistoryView = "session" | "saves" | "published" | "activity";

export interface HistoryTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Project ID — scopes localStorage key so view preference is per-project */
  projectId?: string | null;
  /** Deep-link target — the sub-tab from `openLeftPanelToTab("history", …)`.
   *  Wins over the stored preference for one mount, so the ⋯ menu's "Publish
   *  history" lands on Published instead of wherever the user last was. */
  initialView?: HistoryView;
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

export interface ActivityLogViewProps {
  /** Site the rows are scoped to — comes from `TabRouter`'s resolved projectId
   *  or the URL fallback. Null = opened without a project; the view renders
   *  a banner and not a query. */
  siteId: string | null;
  /** Flow DRIFT: a row opens its subject in the editor — comments in Review,
   *  publishes in History › Published, edits in History › Session. */
  onOpenRow?: (kind: "edit" | "comment" | "publish") => void;
}

export interface ActivityViewProps {
  composer: Composer | null;
  searchQuery?: string;
  /** Error message to display in the error state */
  error?: string | null;
  /** Retry callback for the error state */
  onRetry?: () => void;
}
