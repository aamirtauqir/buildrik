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
  /** Current element styles — used to auto-expand groups whose advanced props have values */
  styles?: Record<string, string>;
  /** Selected element id — auto-expand runs once per element so user collapses stick */
  elementId?: string | null;
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
  const { defaultExpanded = [], searchQuery, advancedPropsMap, styles, elementId } = options;

  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => new Set(defaultExpanded)
  );

  // Track which element IDs we've already auto-expanded for. Running once per
  // element ID means a user collapse sticks for the rest of that selection —
  // but re-selecting the element (or selecting a different one) re-computes.
  const autoExpandedIdsRef = React.useRef<Set<string>>(new Set());

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

  // Auto-expand groups whose advanced props already have non-empty values. Runs
  // once per element ID change so user collapses aren't overridden on every render.
  React.useEffect(() => {
    if (!elementId || !advancedPropsMap || !styles) return;
    if (autoExpandedIdsRef.current.has(elementId)) return;
    autoExpandedIdsRef.current.add(elementId);

    const groupsToExpand: string[] = [];
    for (const [groupId, props] of Object.entries(advancedPropsMap)) {
      const hasValue = props.some((prop) => {
        // advancedPropsMap sometimes uses dotted ids (e.g., "position.zIndex"); match
        // against the tail of the path, which is the CSS property name.
        const tail = prop.split(".").pop() ?? prop;
        const val = styles[tail];
        return val !== undefined && val !== "" && val !== "0" && val !== "none";
      });
      if (hasValue) groupsToExpand.push(groupId);
    }

    if (groupsToExpand.length > 0) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        groupsToExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [elementId, advancedPropsMap, styles]);

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
