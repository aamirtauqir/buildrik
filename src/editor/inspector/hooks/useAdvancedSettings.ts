/**
 * useAdvancedSettings - Manages advanced settings visibility state
 * Tracks which groups have their "More settings" expanded
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface UseAdvancedSettingsOptions {
  /** Initial groups that should be expanded */
  defaultExpanded?: string[];
  /** Search query - auto-expands when matching advanced prop */
  searchQuery?: string;
  /** List of advanced property IDs per group for search matching */
  advancedPropsMap?: Record<string, string[]>;
}

export interface UseAdvancedSettingsReturn {
  /** Check if a group's advanced section is expanded */
  isExpanded: (groupId: string) => boolean;
  /** Toggle a group's advanced section */
  toggle: (groupId: string) => void;
  /** Expand a specific group's advanced section */
  expand: (groupId: string) => void;
  /** Collapse a specific group's advanced section */
  collapse: (groupId: string) => void;
  /** Expand all groups */
  expandAll: () => void;
  /** Collapse all groups */
  collapseAll: () => void;
  /** Set of currently expanded group IDs */
  expandedGroups: Set<string>;
}

// ============================================================================
// SEARCH MATCHING
// ============================================================================

/**
 * Check if a search query matches any advanced property in a group
 */
function matchesAdvancedProps(
  query: string,
  groupId: string,
  advancedPropsMap?: Record<string, string[]>
): boolean {
  if (!query || !advancedPropsMap) return false;

  const advancedProps = advancedPropsMap[groupId];
  if (!advancedProps || advancedProps.length === 0) return false;

  const q = query.toLowerCase().trim();
  return advancedProps.some((prop) => {
    // Match against property path parts (e.g., "position.zIndex" -> ["position", "zIndex"])
    const parts = prop.split(".");
    return parts.some((part) => part.toLowerCase().includes(q));
  });
}

// ============================================================================
// HOOK
// ============================================================================

export function useAdvancedSettings(
  options: UseAdvancedSettingsOptions = {}
): UseAdvancedSettingsReturn {
  const { defaultExpanded = [], searchQuery, advancedPropsMap } = options;

  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => new Set(defaultExpanded)
  );

  // Auto-expand groups when search matches their advanced props
  React.useEffect(() => {
    if (!searchQuery || !advancedPropsMap) return;

    const groupsToExpand: string[] = [];
    for (const groupId of Object.keys(advancedPropsMap)) {
      if (matchesAdvancedProps(searchQuery, groupId, advancedPropsMap)) {
        groupsToExpand.push(groupId);
      }
    }

    if (groupsToExpand.length > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        groupsToExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [searchQuery, advancedPropsMap]);

  const isExpanded = React.useCallback(
    (groupId: string) => expandedGroups.has(groupId),
    [expandedGroups]
  );

  const toggle = React.useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const expand = React.useCallback((groupId: string) => {
    setExpandedGroups((prev) => new Set([...prev, groupId]));
  }, []);

  const collapse = React.useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    if (advancedPropsMap) {
      setExpandedGroups(new Set(Object.keys(advancedPropsMap)));
    }
  }, [advancedPropsMap]);

  const collapseAll = React.useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    expandedGroups,
  };
}

export default useAdvancedSettings;
