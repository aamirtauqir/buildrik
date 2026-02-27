/**
 * DOM Query Utilities
 * Functions for querying DOM elements
 *
 * @module utils/html/domQuery
 * @license BSD-3-Clause
 */

/**
 * Query selector with type
 */
export function $(selector: string, context: Document | Element = document): Element | null {
  return context.querySelector(selector);
}

/**
 * Query selector all with type
 */
export function $$(selector: string, context: Document | Element = document): Element[] {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Find element by ID
 */
export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

/**
 * Find elements by class name
 */
export function byClass(className: string, context: Document | Element = document): HTMLElement[] {
  return Array.from(context.getElementsByClassName(className)) as HTMLElement[];
}

/**
 * Find elements by tag name
 */
export function byTag(tag: string, context: Document | Element = document): HTMLElement[] {
  return Array.from(context.getElementsByTagName(tag)) as HTMLElement[];
}

/**
 * Check if element matches selector
 */
export function matches(el: Element, selector: string): boolean {
  return el.matches(selector);
}

/**
 * Find closest ancestor matching selector
 */
export function closest(el: Element, selector: string): Element | null {
  return el.closest(selector);
}

/**
 * Get parent element
 */
export function parent(el: Element): Element | null {
  return el.parentElement;
}

/**
 * Get all parent elements
 */
export function parents(el: Element): Element[] {
  const result: Element[] = [];
  let current = el.parentElement;
  while (current) {
    result.push(current);
    current = current.parentElement;
  }
  return result;
}

/**
 * Get sibling elements
 */
export function siblings(el: Element): Element[] {
  if (!el.parentElement) return [];
  return Array.from(el.parentElement.children).filter((c) => c !== el);
}

/**
 * Get previous sibling element
 */
export function prevSibling(el: Element): Element | null {
  return el.previousElementSibling;
}

/**
 * Get next sibling element
 */
export function nextSibling(el: Element): Element | null {
  return el.nextElementSibling;
}

/**
 * Get child elements
 */
export function children(el: Element): Element[] {
  return Array.from(el.children);
}

/**
 * Get first child element
 */
export function firstChild(el: Element): Element | null {
  return el.firstElementChild;
}

/**
 * Get last child element
 */
export function lastChild(el: Element): Element | null {
  return el.lastElementChild;
}

/**
 * Get element index within parent
 */
export function getIndex(el: Element): number {
  if (!el.parentElement) return -1;
  return Array.from(el.parentElement.children).indexOf(el);
}
