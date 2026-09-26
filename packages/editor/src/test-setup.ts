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
import { configure } from "@testing-library/react";
// flowbite-bigbang Task 2: configure flowbite-react's tw: class prefix
// (spec §4.1) before any flowbite-react component renders in a test.
import "./editor/chrome-ui/flowbiteStore";

// A20-13: `waitFor`/`findBy*` default to a 1000ms timeout. Under a loaded CI
// runner (multiple suites sharing 4 cores) that's tight enough to flake —
// RedirectsScreen.test.tsx failed a different assertion each run in the
// inventory's loaded pass despite being deterministic in isolation. 3000ms
// gives async state (IndexedDB seeds, accordion mounts) enough headroom
// without masking a genuinely broken wait.
configure({ asyncUtilTimeout: 3000 });

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

// jsdom doesn't ship document.fonts. FontManager / TypeTokenList /
// FontFamilyRow probe it for availability + fallback warnings. Resolve to
// an empty array (= "font available, no fallback") to keep tests quiet.
if (
  typeof document !== "undefined" &&
  !(document as Document & { fonts?: unknown }).fonts
) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      load: () => Promise.resolve([]),
      ready: Promise.resolve(),
    },
  });
}
