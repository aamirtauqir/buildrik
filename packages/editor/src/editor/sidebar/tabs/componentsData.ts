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

export const FAVORITES_STORAGE_KEY = "aqb-component-favorites";

// ============================================
// Utilities
// ============================================

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
