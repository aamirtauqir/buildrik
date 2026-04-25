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

export const FILTER_CHIPS: FilterChip[] = [
  { id: "all", label: "All" },
  { id: "ui", label: "UI" },
  { id: "sections", label: "Sections" },
  { id: "saved", label: "Saved" },
  { id: "favorites", label: "Favorites" },
];

export const FAVORITES_STORAGE_KEY = "buildrick-component-favorites";
