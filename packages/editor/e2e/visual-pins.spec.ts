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

/* design-2l9 Task 1.2 — the topbar at the three supported widths. Minimum
   supported width is 1024: as the bar narrows only the site name gives way
   (ellipsis, 80px floor); the History group, the longest review label
   ("In review · 12 open") and ⋯ stay whole and inside the bar. */
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
]) {
  test.describe(`topbar-shell @ ${viewport.width}`, () => {
    test.skip(!!process.env.CI, "visual pins are recorded on darwin only");
    test.use({ viewport });

    test("fits, wraps nothing, and matches its pin", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/e2e/probe/probe.html?case=topbar-shell");
      await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", "topbar-shell");
      await page.evaluate(() => document.fonts.ready);
      expect(await fontsLoadedStatus(page), "fonts must be loaded").toBe("loaded");
      await stylesheetsSettled(page);

      const geo = await page.evaluate(() => {
        const box = (sel: string) => {
          const r = document.querySelector(sel)!.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        const bar = document.querySelector('[data-testid="topbar"]')!;
        const kids = [...bar.children].map((c) => {
          const r = c.getBoundingClientRect();
          return { height: r.height, right: r.right };
        });
        return {
          bar: box('[data-testid="topbar"]'),
          name: box('[data-testid="topbar-site-name"]'),
          review: box('[data-testid="topbar-review-pill"]'),
          reviewLabel: document.querySelector('[data-testid="topbar-review-label"]')!.textContent,
          menu: box('[data-testid="topbar-site-menu"]'),
          history: box('[data-testid="topbar-history"]'),
          siteText: (() => {
            const t = document.querySelector('[data-testid="topbar-crumb-site"] > span') as HTMLElement;
            const cs = getComputedStyle(t);
            return { scrollWidth: t.scrollWidth, clientWidth: t.clientWidth, overflow: cs.overflow, textOverflow: cs.textOverflow, textAlign: cs.textAlign, right: t.getBoundingClientRect().right };
          })(),
          kids,
        };
      });

      expect(geo.bar.height).toBe(56);
      expect(geo.reviewLabel).toBe("In review · 12 open");
      for (const el of [geo.review, geo.menu, geo.history]) {
        expect(el.left).toBeGreaterThanOrEqual(geo.bar.left);
        expect(el.right).toBeLessThanOrEqual(geo.bar.right);
        expect(el.top).toBeGreaterThanOrEqual(geo.bar.top);
        expect(el.bottom).toBeLessThanOrEqual(geo.bar.bottom);
      }
      // Board: the pair is two 32px icon buttons, 4 apart.
      expect(geo.history.width).toBe(68);
      // The review pill is one 24px line; a wrapped label would double it.
      expect(geo.review.height).toBe(24);
      // No control wraps: every child of the bar is at most one control tall.
      for (const k of geo.kids) expect(k.height).toBeLessThanOrEqual(32);
      expect(geo.name.width).toBeGreaterThanOrEqual(80);
      // The site name ellipsizes inside its crumb rather than clipping.
      expect(geo.siteText.scrollWidth).toBeGreaterThanOrEqual(geo.siteText.clientWidth);
      expect(geo.siteText.overflow).toBe("hidden");
      expect(geo.siteText.textOverflow).toBe("ellipsis");
      // A centred overflow clips both ends and draws no ellipsis.
      expect(geo.siteText.textAlign).toBe("left");
      expect(geo.siteText.right).toBeLessThanOrEqual(geo.name.right);

      /* The bar itself, not the page: 0.002 of a 1024×768 page is 1,572
         pixels — a whole re-flowed crumb fits inside that and passed. Of a
         1024×56 bar it is 114. Overflow is asserted geometrically above. */
      await expect(page.getByTestId("topbar")).toHaveScreenshot(`topbar-shell-${viewport.width}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.002,
      });
    });
  });
}

/* design-2l9 Task 1.7 — the publish tray docked at the right edge, 360 wide
   (board 499:2656 "Task host / Publish"), in three states, at the three
   supported widths. One CTA; its reason under it. */
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
]) {
  test.describe(`publish-tray @ ${viewport.width}`, () => {
    test.skip(!!process.env.CI, "visual pins are recorded on darwin only");
    test.use({ viewport });

    for (const name of ["publish-tray-blocking", "publish-tray-success", "publish-tray-failed"] as const) {
      test(name, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(`/e2e/probe/probe.html?case=${name}`);
        await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", name);
        await page.evaluate(() => document.fonts.ready);
        expect(await fontsLoadedStatus(page), "fonts must be loaded").toBe("loaded");
        await stylesheetsSettled(page);

        const geo = await page.evaluate(() => {
          const tray = document.querySelector('[data-testid="publish-tray"]')!.getBoundingClientRect();
          const ctas = document.querySelectorAll('[data-testid="publish-tray-cta"]').length;
          return { width: tray.width, right: tray.right, ctas };
        });
        expect(geo.width).toBe(360);
        expect(geo.right).toBe(viewport.width);
        expect(geo.ctas).toBe(1);
        if (name === "publish-tray-blocking") {
          await expect(page.getByTestId("publish-tray-cta")).toBeDisabled();
          await expect(page.getByTestId("publish-tray-reason")).toHaveText("Fix 1 blocking issue to publish");
        }

        await expect(page).toHaveScreenshot(`${name}-${viewport.width}.png`, {
          fullPage: true,
          animations: "disabled",
          threshold: 0.02,
          maxDiffPixelRatio: 0.002,
        });
      });
    }
  });
}
