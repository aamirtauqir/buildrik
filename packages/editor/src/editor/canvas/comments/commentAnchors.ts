/**
 * commentAnchors — pure helpers for canvas comment pins (S5 shell state 6).
 *
 * A pin is anchored two ways at once:
 *   - targetSelector: `[data-buildrick-id="…"]` — survives layout shifts,
 *     dies with the element (that death is the orphan-comment flow).
 *   - x/y: page-relative fractions 0..1 (schema contract) — position the pin
 *     and let the account-less client page place it without an engine.
 *
 * @license BSD-3-Clause
 */

export interface AnchoredComment {
  id: string;
  pageId: string | null;
  x: number | null;
  y: number | null;
  targetSelector: string | null;
  status: "OPEN" | "RESOLVED";
}

/** Selector stored for a pin on an engine element. */
export function anchorSelector(elementId: string): string {
  // Engine ids are generated (letters/digits/dashes) but escape defensively —
  // a quote in an id must not break out of the attribute selector.
  return `[data-buildrick-id="${elementId.replace(/["\\]/g, "\\$&")}"]`;
}

/** Inverse of `anchorSelector` — the engine element id a stored selector
 *  points at, or null for anything else (unpinned notes, a hand-edited or
 *  otherwise malformed selector). Used to look up a deleted element's label
 *  for the orphan-comment modal (board 184:56). */
export function elementIdFromSelector(selector: string | null): string | null {
  if (!selector) return null;
  const m = /^\[data-buildrick-id="((?:[^"\\]|\\.)*)"\]$/.exec(selector);
  return m ? m[1].replace(/\\(.)/g, "$1") : null;
}

/** Resolve a stored selector inside the canvas content root. Invalid selectors
 *  (crafted or from an older format) resolve to null, never throw. */
export function resolveAnchor(root: ParentNode, selector: string): HTMLElement | null {
  try {
    const el = root.querySelector(selector);
    return el instanceof HTMLElement ? el : null;
  } catch {
    return null;
  }
}

/** Pin position in content-root pixel coordinates.
 *  Priority: stored page fractions (the exact click point) → anchored element's
 *  top-center → null (unpinned "General" note, not drawn on canvas). */
export function pinPosition(
  comment: Pick<AnchoredComment, "x" | "y" | "targetSelector">,
  contentRoot: HTMLElement,
): { left: number; top: number } | null {
  const { scrollWidth, scrollHeight } = contentRoot;
  if (comment.x != null && comment.y != null) {
    return {
      left: Math.min(Math.max(comment.x, 0), 1) * scrollWidth,
      top: Math.min(Math.max(comment.y, 0), 1) * scrollHeight,
    };
  }
  if (comment.targetSelector) {
    const el = resolveAnchor(contentRoot, comment.targetSelector);
    if (el) {
      const rootRect = contentRoot.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left - rootRect.left + rect.width / 2,
        top: rect.top - rootRect.top,
      };
    }
  }
  return null;
}

/** Click point → page fractions for the create payload. */
export function pointToFractions(
  clientX: number,
  clientY: number,
  contentRoot: HTMLElement,
): { x: number; y: number } {
  const rect = contentRoot.getBoundingClientRect();
  const w = rect.width || 1;
  const h = rect.height || 1;
  return {
    x: Math.min(Math.max((clientX - rect.left) / w, 0), 1),
    y: Math.min(Math.max((clientY - rect.top) / h, 0), 1),
  };
}

/**
 * Orphans: OPEN comments pinned (targetSelector set) to THIS page whose anchor
 * no longer resolves — the element was deleted. Only the active page is
 * decidable (other pages aren't in the DOM), so callers run this per page view.
 * pageId null matches an engine with no registered pages (raw-HTML sites) —
 * both sides null compares equal, which is exactly that case.
 */
export function detectOrphans(
  comments: readonly AnchoredComment[],
  contentRoot: ParentNode,
  activePageId: string | null,
): string[] {
  return comments
    .filter(
      (c) =>
        c.status === "OPEN" &&
        c.targetSelector != null &&
        c.pageId === activePageId &&
        resolveAnchor(contentRoot, c.targetSelector) === null,
    )
    .map((c) => c.id);
}
