/**
 * QuickSwitcher - Type definitions
 *
 * Types and interfaces for the Quick Switcher (Cmd+K) component.
 *
 * @module components/ui/QuickSwitcher.types
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================
// Types
// ============================================

/** Item type for categorization */
export type QuickSwitcherItemType = "recent" | "page" | "element" | "template" | "command";

/** Individual searchable item */
export interface QuickSwitcherItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Item type for categorization */
  type: QuickSwitcherItemType;
  /** Icon (emoji or component) */
  icon?: string | React.ReactNode;
  /** Subtitle/description */
  subtitle?: string;
  /** Keyboard shortcut (for commands) */
  shortcut?: string;
  /** Search keywords */
  keywords?: string[];
  /** Handler when selected */
  onSelect: () => void;
  /** Optional metadata for advanced filtering */
  meta?: Record<string, unknown>;
}

/** Props for QuickSwitcher component */
export interface QuickSwitcherProps {
  /** Whether switcher is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** All available items */
  items: QuickSwitcherItem[];
  /** Placeholder text */
  placeholder?: string;
}

/** Section configuration */
export interface QuickSwitcherSection {
  type: QuickSwitcherItemType;
  label: string;
  icon: string;
  emptyMessage: string;
}

/** Result interface for the useQuickSwitcher hook */
export interface UseQuickSwitcherResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
