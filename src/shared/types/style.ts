/**
 * Style Types
 * Types for CSS styles, pseudo-states, and style rules
 *
 * @module types/style
 * @license BSD-3-Clause
 */

// ============================================
// Style Types
// ============================================

export interface StyleData {
  /** Style ID */
  id: string;
  /** CSS selector */
  selector: string;
  /** Style properties */
  properties: Record<string, string>;
  /** Media query */
  mediaQuery?: string;
  /** Pseudo selector */
  pseudo?: string;
}

/**
 * Pseudo-state identifiers for element styling
 * Used for hover, focus, active, and disabled state styling
 */
export type PseudoStateId = "normal" | "hover" | "focus" | "active" | "disabled";

/**
 * Pseudo-state style configuration
 * Maps pseudo-states to their style overrides
 */
export type PseudoStateStyles = Partial<Record<PseudoStateId, Record<string, string>>>;

export interface StyleRule {
  /** Property name */
  property: string;
  /** Property value */
  value: string;
  /** Is important */
  important?: boolean;
}
