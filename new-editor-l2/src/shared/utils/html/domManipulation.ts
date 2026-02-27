/**
 * DOM Manipulation Utilities
 * Functions for manipulating DOM elements
 *
 * @module utils/html/domManipulation
 * @license BSD-3-Clause
 */

/* eslint-disable no-redeclare */
// =============================================================================
// ELEMENT CREATION
// =============================================================================

/**
 * Create DOM element
 */
export function createDOMElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K];
export function createDOMElement(
  tag: string,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElement;
export function createDOMElement(
  tag: string,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElement {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key.startsWith("on") && typeof value === "string") {
      // Skip event handlers for security
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }

  return el;
}

// =============================================================================
// ELEMENT MANIPULATION
// =============================================================================

/**
 * Remove element from DOM
 */
export function removeElement(el: Element): void {
  el.parentNode?.removeChild(el);
}

/**
 * Replace element in DOM
 */
export function replaceElement(oldEl: Element, newEl: Element): void {
  oldEl.parentNode?.replaceChild(newEl, oldEl);
}

/**
 * Insert element before another
 */
export function insertBefore(newEl: Element, refEl: Element): void {
  refEl.parentNode?.insertBefore(newEl, refEl);
}

/**
 * Insert element after another
 */
export function insertAfter(newEl: Element, refEl: Element): void {
  refEl.parentNode?.insertBefore(newEl, refEl.nextSibling);
}

/**
 * Append multiple children
 */
export function appendChildren(parent: Element, children: Node[]): void {
  const fragment = document.createDocumentFragment();
  children.forEach((child) => fragment.appendChild(child));
  parent.appendChild(fragment);
}

/**
 * Clear element children
 */
export function clearChildren(el: Element): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Clone element with or without children
 */
export function cloneElement(el: Element, deep = true): Element {
  return el.cloneNode(deep) as Element;
}

// =============================================================================
// ELEMENT PROPERTIES
// =============================================================================

/**
 * Check if element is in viewport
 */
export function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

/**
 * Get element's bounding rect
 */
export function getRect(el: Element): DOMRect {
  return el.getBoundingClientRect();
}

/**
 * Get computed style value
 */
export function getStyle(el: Element, prop: string): string {
  return getComputedStyle(el).getPropertyValue(prop);
}

/**
 * Set inline styles
 */
export function setStyles(el: HTMLElement, styles: Record<string, string>): void {
  Object.assign(el.style, styles);
}

// =============================================================================
// CLASS MANIPULATION
// =============================================================================

/**
 * Toggle class
 */
export function toggleClass(el: Element, className: string, force?: boolean): boolean {
  return el.classList.toggle(className, force);
}

/**
 * Add classes
 */
export function addClass(el: Element, ...classes: string[]): void {
  el.classList.add(...classes);
}

/**
 * Remove classes
 */
export function removeClass(el: Element, ...classes: string[]): void {
  el.classList.remove(...classes);
}

/**
 * Check if element has class
 */
export function hasClass(el: Element, className: string): boolean {
  return el.classList.contains(className);
}
