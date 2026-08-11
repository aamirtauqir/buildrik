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
export type HistoryView = "saves" | "published";

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
