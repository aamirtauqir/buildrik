/**
 * History Tab Types
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

export type HistoryView = "versions" | "activity";

export interface HistoryTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Panel pin state */
  isPinned?: boolean;
  /** Pin toggle callback */
  onPinToggle?: () => void;
  /** Help button callback */
  onHelpClick?: () => void;
  /** Close panel callback */
  onClose?: () => void;
}

export interface ActivityViewProps {
  composer: Composer | null;
  searchQuery?: string;
}
