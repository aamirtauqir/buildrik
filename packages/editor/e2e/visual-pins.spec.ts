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
  // Pins are recorded on darwin. CI runs linux, where Playwright looks for a
  // `-chromium-linux.png` that no one has ever recorded, and a missing platform
  // snapshot fails every case ("A snapshot doesn't exist ... writing actual").
  // That was 20 of the 51 red rows in every CI run through 2026-09-02. The
  // computed-style parity and Figma conformance steps carry the CI verdict;
  // pins stay a local, by-eye aid.
  test.skip(!!process.env.CI, "visual pins are recorded on darwin only");
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

/* 2L9 Task 1.3 — bottom-bar page switcher (Shell/BottomBar 497:99485, menu
   Shell/PageSwitcherMenu 558:4419), closed and open, at the three supported
   widths. The bar must not overflow at 1024 and 1280 (plan Review Focus 4). */
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
]) {
  test.describe(`visual pin · page switcher @${viewport.width}`, () => {
    test.skip(!!process.env.CI, "visual pins are recorded on darwin only");
    test.use({ viewport });
    for (const open of [false, true]) {
      const name = `page-switcher-${open ? "open" : "closed"}-${viewport.width}`;
      test(name, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(`/e2e/probe/probe.html?case=page-switcher${open ? "&open=1" : ""}`);
        await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", "page-switcher");
        await page.evaluate(() => document.fonts.ready);
        expect(await fontsLoadedStatus(page), "fonts must be loaded").toBe("loaded");
        await stylesheetsSettled(page);

        const bar = page.locator("footer.layout-shell__footer");
        const fit = await bar.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, height: el.getBoundingClientRect().height }));
        expect(fit.scroll, "bottom bar content overflows").toBeLessThanOrEqual(fit.client);
        expect(fit.height).toBe(32);
        if (open) {
          const menu = page.getByTestId("page-switcher-menu");
          await expect(menu).toBeVisible();
          const box = await menu.evaluate((el) => el.closest('[role="dialog"]')!.getBoundingClientRect().toJSON());
          expect(box.width).toBe(260);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 32);
        }

        await expect(page).toHaveScreenshot(`${name}.png`, {
          fullPage: true,
          animations: "disabled",
          threshold: 0.02,
          maxDiffPixelRatio: 0.002,
        });
      });
    }
  });
}

/* Behaviour pin: choosing "About" in the open menu changes the page the bar
   shows (the probe's stand-in for the canvas page). */
test("page switcher · pick About from the menu", async ({ page }) => {
  test.skip(!!process.env.CI, "visual pins are recorded on darwin only");
  await page.goto("/e2e/probe/probe.html?case=page-switcher&open=1");
  await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", "page-switcher");
  await expect(page.getByRole("combobox", { name: "Search pages" })).toBeFocused();
  await page.getByTestId("page-switcher-row-about").click();
  await expect(page.getByTestId("page-switcher-menu")).toHaveCount(0);
  await expect(page.getByTestId("page-switcher-trigger")).toContainText("About");
  await expect(page.getByTestId("page-switcher-trigger")).toBeFocused();
});
