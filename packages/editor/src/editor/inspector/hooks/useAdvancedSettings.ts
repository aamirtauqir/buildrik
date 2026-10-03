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

  /* Which element the groups belong to. A NEW selection starts every group
     closed again, then opens the ones its own values call for (owner decision
     2026-10-02: "More settings" collapsed by default). The set used to only
     ever grow: an Image (max-width 100%) opened Size's More settings and every
     element selected after it showed Size open too, while selecting a Heading
     first and the Image second left the Image's closed.
     `staleStylesRef` is the style map that was current when the selection
     changed — the previous element's, until useStyleHandlers re-reads (its
     effect runs before this one, its state lands a render later). Scanning
     that map would open the old element's groups on the new one. */
  const seenIdRef = React.useRef<string | null>(null);
  const staleStylesRef = React.useRef<Record<string, string> | null>(null);
  const autoExpandedForRef = React.useRef<string | null>(null);

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

  // Auto-expand groups whose advanced props already have non-empty values —
  // once per selected element, so a user collapse sticks for that selection.
  React.useEffect(() => {
    if (!elementId || !advancedPropsMap || !styles) return;
    if (seenIdRef.current !== elementId) {
      const switching = seenIdRef.current !== null;
      seenIdRef.current = elementId;
      staleStylesRef.current = switching ? styles : null;
      autoExpandedForRef.current = null;
      if (switching) setExpandedGroups(new Set());
    }
    if (autoExpandedForRef.current === elementId) return;
    if (styles === staleStylesRef.current) return;
    /* Wait for the styles to arrive before spending the one-shot. `styles` is
       `{}` on the first render after a selection — useStyleHandlers fills it in
       an effect that runs later — and `{}` is truthy, so this used to mark the
       element as done, scan an empty object, find nothing, and return early on
       every later pass. The auto-expand could not fire for ANY property, which
       is why the casing bug below sat unnoticed: the second defect hid the
       first. */
    if (Object.keys(styles).length === 0) return;
    autoExpandedForRef.current = elementId;

    const groupsToExpand: string[] = [];
    for (const [groupId, props] of Object.entries(advancedPropsMap)) {
      const hasValue = props.some((prop) => {
        /* `prop` is a raw kebab CSS name now — the section declares what its
           advanced block renders (SectionEntry.advancedProps), so there is
           nothing to convert. It used to be a dotted, camelCase registry id
           ("size.minWidth") read straight against a kebab-keyed style map, so
           `styles["minWidth"]` came back undefined for 43 of the registry's 57
           advanced ids. Fixing the lookup was only half of it: the ids came
           from a set the sections did not draw. */
        const val = styles[prop];
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
