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
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// jsdom doesn't ship matchMedia. Skeleton's `useReducedMotion` hook (and
// any future code branching on prefers-reduced-motion) depends on it.
// Stub returns `matches: false` so animations are NOT suppressed in tests.
if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
