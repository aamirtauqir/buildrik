/**
 * Components Data - Types, constants, and utilities for ComponentsTab
 * Extracted from ComponentsTab.tsx for maintainability
 * @license BSD-3-Clause
 */

// ============================================
// Types
// ============================================

export type ComponentFilter = "all" | "ui" | "sections" | "saved" | "favorites";

export interface FilterChip {
  id: ComponentFilter;
  label: string;
}

// ============================================
// Constants
// ============================================
export const FAVORITES_STORAGE_KEY = "buildrick-component-favorites";
