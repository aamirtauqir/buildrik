/**
 * useTokenUsageMap — scan the canvas for elements that reference design tokens.
 *
 * Returns Map<tokenId, Set<elementId>>.
 *
 * Two-pass scan:
 *   Pass 1 — element inline styles: element.getStyles() for every element in
 *             composer.elements.getAllElements(). Catches direct property bindings.
 *   Pass 2 — StyleEngine rules: composer.styles.exportStyles() covers hover/
 *             breakpoint rules that live outside inline styles.
 *
 * Memoization: recomputes only when element count or a version counter changes.
 * composer.elements.getAllElements() returns a new Array on every call (Map.values()),
 * so we never use array identity as a cache key.
 *
 * Edge cases:
 *   - composer=null → returns empty Map, no crash
 *   - element.getStyles() throws → skip element, continue scan
 *   - Zero elements → returns empty Map
 *
 * @license BSD-3-Clause
 */

import { useMemo } from "react";
import type { Composer } from "../../../engine/Composer";

// ============================================================================
// HELPERS
// ============================================================================

/** Test if a CSS value is a token var() binding */
const isTokenVarValue = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

/** Extract --buildrick-design-* var name from var(--buildrick-design-…). Returns null if not a token var. */
const extractCssVar = (val: string): string | null => {
  const m = val.match(/^var\((--buildrick-design-[^)]+)\)/);
  return m ? m[1] : null;
};

/**
 * Extract element ID from an [data-buildrick-id="..."] selector.
 * Handles pseudo selectors: [data-buildrick-id="foo"]:hover → "foo"
 */
const extractElementIdFromSelector = (selector: string): string | null => {
  const m = selector.match(/\[data-buildrick-id="([^"]+)"\]/);
  return m ? m[1] : null;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Scan all elements and style rules for token var() bindings.
 * @param composer - Current Composer instance (may be null during init)
 * @param versionCounter - Increment to force a rescan after element/style mutations
 */
export function useTokenUsageMap(
  composer: Composer | null,
  versionCounter: number
): Map<string, Set<string>> {
  const elementCount = composer ? composer.elements.getAllElements().length : 0;

  return useMemo(() => {
    const map = new Map<string, Set<string>>();

    if (!composer) return map;

    // Helper: record a token→element binding
    const record = (cssVar: string, elementId: string) => {
      // cssVar is "--buildrick-design-color-primary". Map key is token id derived from cssVar:
      // "--buildrick-design-color-primary" → "color-primary", "--buildrick-design-space-4" → "space-4"
      const tokenId = cssVar.replace(/^--buildrick-design-/, "");
      if (!map.has(tokenId)) map.set(tokenId, new Set());
      map.get(tokenId)!.add(elementId);
    };

    // Pass 1 — element inline styles
    let elements: ReturnType<typeof composer.elements.getAllElements>;
    try {
      elements = composer.elements.getAllElements();
    } catch {
      return map;
    }

    for (const element of elements) {
      let styles: Record<string, string>;
      try {
        styles = element.getStyles() ?? {};
      } catch {
        continue; // skip this element, keep scanning
      }

      const elementId = element.getId();
      for (const val of Object.values(styles)) {
        if (isTokenVarValue(val)) {
          const cssVar = extractCssVar(val);
          if (cssVar) record(cssVar, elementId);
        }
      }
    }

    // Pass 2 — StyleEngine rules (hover, breakpoint, pseudo-state)
    let rules: ReturnType<typeof composer.styles.exportStyles>;
    try {
      rules = composer.styles.exportStyles();
    } catch {
      return map;
    }

    for (const rule of rules) {
      const elementId = extractElementIdFromSelector(rule.selector);
      if (!elementId) continue;

      for (const val of Object.values(rule.properties)) {
        if (isTokenVarValue(val)) {
          const cssVar = extractCssVar(val);
          if (cssVar) record(cssVar, elementId);
        }
      }
    }

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer, elementCount, versionCounter]);
}
