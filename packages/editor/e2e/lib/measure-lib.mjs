/**
 * Shared measurement primitives for the two harnesses that read computed style
 * out of a real browser.
 *
 * WHY THIS EXISTS
 * `e2e/style-parity.spec.ts` and `scripts/conformance/measure.mjs` both boot a
 * browser, wait for the page to settle, and read computed styles. They ask
 * different QUESTIONS — parity asks "did this change since the last commit"
 * against `e2e/baselines/`, conformance asks "does this match the Figma board"
 * against `scripts/conformance/specs/` — but the mechanics of getting a
 * trustworthy read are identical, and until 2026-08-03 they were duplicated.
 * That duplication had already cost: the font bug (see `themes/fonts.css`) had
 * to be understood twice, and the `channel: "chrome"` fallback below existed in
 * one of them and not the other.
 *
 * WHAT IS SHARED, AND WHAT DELIBERATELY IS NOT
 * Shared here: the browser pin, the font gate, and the tracked-property list.
 * NOT shared: the in-page DOM walk. Parity walks every node under
 * `[data-probe]` plus the overlay root and keys by probe-name + index;
 * conformance reads a recipe's named targets. Those are genuinely different
 * traversals, not duplication. They also cannot be shared cheaply: code inside
 * `page.evaluate` runs in the browser context and cannot close over an imported
 * module, so sharing it would mean stringifying functions and rebuilding them
 * with `new Function`. That is clever rather than explicit, so it is not done.
 *
 * This file is `.mjs`, not `.ts`, so `measure.mjs` can import it without a
 * build step. Playwright transpiles the `.ts` spec and imports it fine.
 *
 * @license BSD-3-Clause
 */

/**
 * Properties that carry the look: layout + colour + type + edges.
 *
 * SSOT for both harnesses. Two entries were added late and are worth keeping
 * labelled, because each was added after a real miss:
 *   - `text-decoration-line`: a completed onboarding step's strike-through moved
 *     from an inline `textDecoration` to a class. Without this the probe
 *     measured 43 nodes and none of the property it was added to protect.
 *   - `min-width` / `overflow-x`: the canvas footer toolbar's containment
 *     contract. `overflow-x` is not implied by `overflow`.
 *   - `text-transform` / `letter-spacing` (T1, 2026-08-04): the panel header's
 *     case treatment. `8160d7d3` moved all seven drawers to UPPERCASE with
 *     0.08em tracking and every instrument in this repo was blind to it — the
 *     one property the header decision turns on was untracked, so the change
 *     landed with nothing watching and the reversal would have too. Added
 *     BEFORE the header is changed back, not after.
 *
 * Adding to this list invalidates every committed baseline — the new property
 * is absent from the old records, so the diff reports it on every node. That
 * already happened once silently: 120 baseline nodes carried no `min-width` or
 * `overflow-x` because the list grew and nothing re-captured. Re-capture in the
 * same commit that extends this array.
 */
export const TRACKED = [
  "display", "flex-direction", "align-items", "justify-content", "gap",
  "width", "height", "min-height", "max-width",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "color", "background-color",
  "border-top-width", "border-top-style", "border-top-color",
  "border-bottom-width", "border-bottom-color",
  "border-radius",
  "font-family", "font-size", "font-weight", "line-height",
  "opacity", "box-shadow", "overflow", "text-overflow", "white-space",
  "text-decoration-line",
  "min-width", "overflow-x",
  "text-transform", "letter-spacing",
];

/**
 * Launch the browser the harness is allowed to measure in.
 *
 * Playwright's own bundled Chromium ONLY. `measure.mjs` used to fall back to
 * `channel: "chrome"` when the bundled build was missing, which meant the same
 * commit could be measured in two different renderers — and since CI is Ubuntu
 * while development is macOS, that is a font-rendering and layout difference
 * dressed up as a conformance result. A harness that silently changes its own
 * instrument cannot be trusted, so an absent bundled browser is a hard failure
 * with an actionable message.
 *
 * @param {import("playwright-core")} playwright - the module, injected so this
 *   file does not force a dependency on callers that already hold one.
 * @returns {Promise<import("playwright-core").Browser>}
 * @throws {Error} tagged `MISSING_BROWSER` when the bundled build is absent.
 */
export async function launchPinnedBrowser(playwright) {
  try {
    return await playwright.chromium.launch();
  } catch (cause) {
    const err = new Error(
      "Playwright's bundled Chromium is not installed, and this harness refuses " +
      "to fall back to the system Chrome: measuring in a different renderer " +
      "produces numbers that cannot be compared to CI. Run: npx playwright install chromium"
    );
    err.code = "MISSING_BROWSER";
    err.cause = cause;
    throw err;
  }
}

/**
 * Block until webfonts have resolved, and prove it.
 *
 * `await page.evaluate(() => document.fonts.ready)` looks like it waits, and it
 * does — but it serializes the resolved FontFaceSet to `{}`, so if the
 * expression is ever broken by a refactor the await degrades to a no-op with no
 * signal. Every text-dependent measurement after that point would then be taken
 * mid-load. Returning the status makes the failure visible.
 *
 * Callers decide severity: the parity spec asserts, `measure.mjs` exits 3
 * (a measurement it cannot trust is MISSING, never a pass).
 *
 * @param {import("playwright-core").Page} page
 * @returns {Promise<string>} `document.fonts.status` — "loaded" when good.
 */
export async function fontsLoadedStatus(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.status;
  });
}

/**
 * Wait until every stylesheet — including nested CSS `@import`s — is loaded.
 *
 * Vite injects imported CSS as <style> tags synchronously with module eval,
 * but `@import` chains INSIDE that CSS (default.css → design-system/index.css
 * → a11y.css) are separate async fetches. A measurement taken before they
 * land reads a page without a11y's reduced-motion rules — the skeleton pulse
 * runs and every opacity is a mid-cycle lottery — or without the cascade at
 * all, which is how 106 baseline entries once recorded browser defaults
 * (16px/400/"Times"). A CSSImportRule whose .styleSheet is still null is a
 * fetch in flight; recurse because @imports nest.
 */
export async function stylesheetsSettled(page) {
  await page.waitForFunction(() => {
    const loaded = (ss) => {
      let rules;
      try {
        rules = ss.cssRules;
      } catch {
        return false; // cross-origin or still parsing — not settled
      }
      for (const r of rules) {
        if (r instanceof CSSImportRule) {
          if (!r.styleSheet || !loaded(r.styleSheet)) return false;
        }
      }
      return true;
    };
    return Array.from(document.styleSheets).every(loaded);
  });
}
