/**
 * Shared Types for Pro Inspector
 * Common interfaces used across tabs and sections
 */

import type { Composer } from "../../../engine";
import type { PseudoStateId } from "../../../shared/types";

/**
 * Base props interface shared by all ProInspector tabs
 */
export interface BaseTabProps {
  /** Composer instance for element operations */
  composer: Composer | null | undefined;
  /** Currently selected element */
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  };
  /** Current pseudo-state (hover, focus, etc.) */
  currentPseudoState: PseudoStateId;
  /** Current styles for the element */
  styles: Record<string, string>;
  /** Handler for style changes */
  onChange: (property: string, value: string) => void;
  /** Handler for batch style changes */
  onBatchChange: (changes: Record<string, string>) => void;
}

/**
 * Property states for contextual UI
 */
export interface PropertyStates {
  [key: string]: {
    hidden?: boolean;
    disabled?: boolean;
    reason?: string;
    isOverridden?: boolean;
  };
}
