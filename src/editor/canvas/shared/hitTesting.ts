/**
 * Canvas Hit Testing Utilities
 * Shared functions for element detection at screen coordinates
 *
 * @license BSD-3-Clause
 */

/** Hit expansion for small elements (in pixels) */
export const HIT_EXPANSION = 4;

/**
 * Build element stack at a given point
 * Returns element IDs sorted by z-order (top to bottom)
 */
export function buildElementStack(x: number, y: number): string[] {
  const elements = document.elementsFromPoint(x, y);
  return elements
    .filter((el) => el.hasAttribute("data-aqb-id"))
    .map((el) => el.getAttribute("data-aqb-id")!)
    .filter(Boolean);
}

/**
 * Find closest element with expanded hitbox for small elements
 * Prioritizes smaller/nested elements when multiple match
 */
export function findElementWithHitExpansion(
  target: HTMLElement,
  x: number,
  y: number
): HTMLElement | null {
  // First try direct hit
  const directHit = target.closest("[data-aqb-id]") as HTMLElement | null;
  if (directHit) return directHit;

  // Try expanded hitbox for nearby small elements
  const candidates = document.querySelectorAll("[data-aqb-id]");
  let closest: HTMLElement | null = null;
  let closestScore = Infinity;

  candidates.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // Expand rect by HIT_EXPANSION
    const expandedRect = {
      left: rect.left - HIT_EXPANSION,
      right: rect.right + HIT_EXPANSION,
      top: rect.top - HIT_EXPANSION,
      bottom: rect.bottom + HIT_EXPANSION,
    };

    if (
      x >= expandedRect.left &&
      x <= expandedRect.right &&
      y >= expandedRect.top &&
      y <= expandedRect.bottom
    ) {
      // Calculate distance to original rect center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      // Prefer smaller elements (more specific)
      const area = rect.width * rect.height;
      const score = distance + area / 10000;

      if (score < closestScore) {
        closest = el as HTMLElement;
        closestScore = score;
      }
    }
  });

  return closest;
}
