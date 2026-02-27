/**
 * DOM Utilities
 * Re-exports DOM query and manipulation functions
 *
 * @module utils/html/dom
 * @license BSD-3-Clause
 */

// Re-export query utilities
export {
  $,
  $$,
  byId,
  byClass,
  byTag,
  matches,
  closest,
  parent,
  parents,
  siblings,
  prevSibling,
  nextSibling,
  children,
  firstChild,
  lastChild,
  getIndex,
} from "./domQuery";

// Re-export manipulation utilities
export {
  createDOMElement,
  removeElement,
  replaceElement,
  insertBefore,
  insertAfter,
  appendChildren,
  clearChildren,
  cloneElement,
  isInViewport,
  getRect,
  getStyle,
  setStyles,
  toggleClass,
  addClass,
  removeClass,
  hasClass,
} from "./domManipulation";
