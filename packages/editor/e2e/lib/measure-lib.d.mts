/**
 * Types for `measure-lib.mjs`.
 *
 * The implementation is `.mjs` so `scripts/conformance/measure.mjs` — plain
 * node, no build step — can import it directly. This declaration exists so the
 * TypeScript side (`e2e/style-parity.spec.ts`) gets a real contract instead of
 * `any`, which is what `tsc` reported the moment the spec started importing it.
 * Keep the two in sync by hand; there are three exports.
 *
 * @license BSD-3-Clause
 */
import type { Browser, Page } from "playwright-core";

/** Computed-style properties both harnesses read. SSOT — see the .mjs for why
 *  extending this array invalidates every committed baseline. */
export declare const TRACKED: string[];

/**
 * Launch Playwright's bundled Chromium. Never falls back to the system Chrome:
 * measuring in a second renderer makes CI (Ubuntu) and dev (macOS) results
 * incomparable. Rejects with `err.code === "MISSING_BROWSER"` when absent.
 */
export declare function launchPinnedBrowser(
  playwright: typeof import("playwright-core")
): Promise<Browser>;

/**
 * Await webfont resolution and return `document.fonts.status`. Returns the
 * status rather than void so a broken await surfaces as a failed assertion
 * instead of silently measuring mid-load. "loaded" is the good value.
 */
export declare function fontsLoadedStatus(page: Page): Promise<string>;
