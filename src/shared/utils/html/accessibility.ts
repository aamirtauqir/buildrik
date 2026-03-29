/**
 * Accessibility Helpers
 * ARIA and accessibility utilities
 *
 * @module utils/html/accessibility
 * @license BSD-3-Clause
 */

// Re-export ARIA constants
export { ARIA_ROLES, ARIA_ATTRS } from "./ariaConstants";

// =============================================================================
// ARIA FUNCTIONS
// =============================================================================

/**
 * Set ARIA attribute
 */
export function setAriaAttr(el: Element, attr: string, value: string | boolean): void {
  const name = attr.startsWith("aria-") ? attr : `aria-${attr}`;
  el.setAttribute(name, String(value));
}

/**
 * Get ARIA attribute
 */
export function getAriaAttr(el: Element, attr: string): string | null {
  const name = attr.startsWith("aria-") ? attr : `aria-${attr}`;
  return el.getAttribute(name);
}

/**
 * Remove ARIA attribute
 */
export function removeAriaAttr(el: Element, attr: string): void {
  const name = attr.startsWith("aria-") ? attr : `aria-${attr}`;
  el.removeAttribute(name);
}

/**
 * Set role attribute
 */
export function setRole(el: Element, role: string): void {
  el.setAttribute("role", role);
}

/**
 * Get role attribute
 */
export function getRole(el: Element): string | null {
  return el.getAttribute("role");
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Check if element is focusable
 */
export function isFocusable(el: Element): boolean {
  const focusableTags = ["a", "button", "input", "select", "textarea"];
  const tag = el.tagName.toLowerCase();

  if (focusableTags.includes(tag)) {
    const htmlEl = el as HTMLElement;
    return !htmlEl.hasAttribute("disabled") && htmlEl.tabIndex >= 0;
  }

  return (el as HTMLElement).tabIndex >= 0;
}

/**
 * Get all focusable elements within container
 */
export function getFocusableElements(container: Element): HTMLElement[] {
  const focusable = container.querySelectorAll(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  );
  return Array.from(focusable) as HTMLElement[];
}

/**
 * Trap focus within container
 */
export function trapFocus(container: Element): () => void {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeydown = (e: Event): void => {
    const event = e as KeyboardEvent;
    if (event.key !== "Tab") return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", handleKeydown);
  first.focus();

  return () => container.removeEventListener("keydown", handleKeydown);
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.style.cssText =
    "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; " +
    "overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";

  document.body.appendChild(el);

  // Delay to ensure screen reader picks up the message
  setTimeout(() => {
    el.textContent = message;
  }, 100);

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(el);
  }, 1000);
}

/**
 * Generate accessible label
 */
export function getAccessibleName(el: Element): string {
  // Check aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labels = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean);
    if (labels.length) return labels.join(" ");
  }

  // Check for associated label (for form elements)
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    const id = el.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label?.textContent) return label.textContent;
    }
  }

  // Check alt attribute (for images)
  if (el instanceof HTMLImageElement) {
    return el.alt || "";
  }

  // Fall back to text content
  return el.textContent || "";
}
