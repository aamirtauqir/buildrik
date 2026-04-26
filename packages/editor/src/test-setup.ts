/**
 * Vitest setup — polyfills for jsdom environment.
 *
 * jsdom doesn't ship ResizeObserver / matchMedia / scrollIntoView. cmdk
 * (CommandPalette engine) needs ResizeObserver; some Radix primitives need
 * scrollIntoView. Polyfilled with no-op stubs sufficient for component tests.
 *
 * @license BSD-3-Clause
 */
import "@testing-library/jest-dom";

if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - jsdom polyfill
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
