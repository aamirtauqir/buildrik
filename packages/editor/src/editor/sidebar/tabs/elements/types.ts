/**
 * Elements tab shared types
 * @license BSD-3-Clause
 */

import type { BlockData } from "../../../../shared/types";

export interface ElementsTabProps {
  searchQuery: string;
  onBlockClick?: (block: BlockData) => void;
  /** Filter to show only specific category (supports comma-separated values) */
  categoryFilter?: string;
}
