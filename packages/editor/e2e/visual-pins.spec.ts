/**
 * Visual pins — Playwright screenshot baselines per eye-accepted surface (T3).
 *
 * The parity spec asserts computed VALUES; this asserts the PIXELS. The two
 * fail differently: parity catches a token or cascade change on a tracked
 * property, a screenshot catches everything parity does not track — paint
 * order, clipping, z-order, overflow — the invisible-but-healthy class that
 * cost this arc seven live finds. A surface is pinned here only after a
 * human has accepted it against its Figma board (the ledger records which
 * and when). Refresh with UPDATE_SNAPSHOTS (--update-snapshots) ONLY for a
 * deliberate, eye-re-accepted change, and say why in the commit.
 *
 * Same three gates as style-parity before any capture: reduced-motion
 * emulated explicitly (Playwright 1.61 drops the context option silently),
 * fonts resolved, and the CSS @import chain settled. `animations: "disabled"`
 * on top, so even an animation the reduce rules miss cannot wobble a pixel.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "@playwright/test";
import { fontsLoadedStatus, stylesheetsSettled } from "./lib/measure-lib.mjs";

const CASES = [
  "content-collection-rows",
  "content-field-rows",
  "content-root-rows",
  "onboarding-steps",
  "canvas-footer-toolbar",
  "panel-frame-header",
  "media-drawer-grid",
  "media-drawer-single",
  "media-drawer-loading",
  "media-drawer-load-error",
  "media-drawer-empty",
  "media-drawer-no-results",
  "content-loading",
  "content-load-error",
  "media-drawer-folder-scoped",
  "media-drawer-bulk-select",
  "media-drawer-uploading",
  "media-drawer-upload-failed",
  "media-drawer-quota-full",
] as const;

test.describe("visual pin", () => {
  for (const name of CASES) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/e2e/probe/probe.html?case=${name}`);

      expect(
        await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
        "reduced-motion emulation must be active before capturing"
      ).toBe(true);
      await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", name);
      expect(await fontsLoadedStatus(page), "fonts must be loaded").toBe("loaded");
      await stylesheetsSettled(page);

      // Full page, not the [data-probe] subtree: portalled content
      // (#bk-overlay-root) must be in frame, and clipping/overflow defects
      // live OUTSIDE the component's own box by definition.
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        animations: "disabled",
        /* Default threshold 0.2 (YIQ per-pixel) waves through exactly the
           changes a DS pin exists to catch: a gray-100 skeleton dimmed to
           40% opacity blends to a near-white the default calls "same".
           0.02 keeps antialiasing tolerance (pixelmatch's AA detection is
           separate) while an off-tint fails. Negative-tested: inline
           opacity 0.4 on SkeletonBlock passed at 0.2, fails at 0.02. */
        threshold: 0.02,
      });
    });
  }
});
