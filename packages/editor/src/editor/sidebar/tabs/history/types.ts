/**
 * History Tab Types
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

export type HistoryView = "saves" | "changes";

export interface HistoryTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Project ID — scopes localStorage key so view preference is per-project */
  projectId?: string | null;
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
