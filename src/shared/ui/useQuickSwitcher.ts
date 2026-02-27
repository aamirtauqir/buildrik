/**
 * useQuickSwitcher - Hook & utilities for Quick Switcher
 *
 * Manages Quick Switcher open/close state with Cmd+K shortcut,
 * plus fuzzy search scoring utilities.
 *
 * @module components/ui/useQuickSwitcher
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { QuickSwitcherItem, UseQuickSwitcherResult } from "./QuickSwitcher.types";

// ============================================
// Hook: useQuickSwitcher
// ============================================

/**
 * Hook to manage Quick Switcher state with Cmd+K shortcut
 */
export function useQuickSwitcher(): UseQuickSwitcherResult {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input (unless it's our own input)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape to close even from our input
        if (e.key === "Escape" && isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        return;
      }

      // Cmd+K or Ctrl+K opens Quick Switcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape closes
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// ============================================
// Utility: Fuzzy Search
// ============================================

/**
 * Simple fuzzy match scoring
 * Returns score (higher = better match), or 0 if no match
 */
export function fuzzyScore(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  // Exact match is highest score
  if (lowerText === lowerQuery) return 1000;

  // Starts with is high score
  if (lowerText.startsWith(lowerQuery)) return 500;

  // Contains is medium score
  if (lowerText.includes(lowerQuery)) return 100;

  // Fuzzy character match
  let score = 0;
  let queryIdx = 0;

  for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIdx]) {
      score += 10;
      queryIdx++;
    }
  }

  // All query characters must be found
  return queryIdx === lowerQuery.length ? score : 0;
}

/**
 * Get fuzzy search score for an item
 */
export function getItemScore(item: QuickSwitcherItem, query: string): number {
  if (!query) return 0;

  const labelScore = fuzzyScore(query, item.label) * 3; // Label is most important
  const subtitleScore = item.subtitle ? fuzzyScore(query, item.subtitle) * 2 : 0;
  const keywordScores = (item.keywords || []).reduce((acc, kw) => acc + fuzzyScore(query, kw), 0);

  return labelScore + subtitleScore + keywordScores;
}
