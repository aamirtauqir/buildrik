/**
 * Target size (WCAG 2.5.8, Level AA) — every interactive control must present
 * at least a 24x24 CSS-pixel box.
 *
 * WHY THIS IS A BROWSER TEST AND NOT A UNIT TEST. jsdom does not lay out. It
 * returns no geometry for a `tw:`-prefixed class, so a vitest assertion on
 * control size is structurally incapable of failing. This is the same blindness
 * that let the drawer ship 40px narrow and the Publish CTA ship with a black
 * ring: the only instrument that can see a rendered size is a real browser.
 *
 * LOCKED AT ZERO. This was written expecting to need a grandfathered baseline —
 * it found five undersized controls on its first run. Fixing their two root
 * causes (an icon-only action rendered as a text `<Button>` with a glyph, and a
 * `p-0` link-button whose height was just its line-box) cleared every one,
 * including the breadcrumbs that were going to be exempted. So the exemption
 * map ships EMPTY and the gate admits nothing.
 *
 * NEGATIVE CONTROL. This gate has been watched failing, which is the only
 * evidence that it works: 5 of 6 cases red before the fix, naming
 * "Delete field Title — 21.92x18", "+ Add field — 67.45x16",
 * "+ New collection — 103.09x16", "+ Add — 37.16x16" and
 * "Browse templates — 168.22x22". A planted 20px control was then confirmed to
 * fail it after the fix.
 *
 * WCAG 2.5.8's exceptions (inline targets, spacing, essential, user-agent
 * control) are deliberately NOT auto-applied. Deciding "this one is inline so
 * it's fine" is a judgment call, and a gate that made it silently would hide
 * exactly the controls worth arguing about. An exempt control goes in BASELINE
 * with its reason, in review, where someone can disagree.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "@playwright/test";

const MIN = 24;

const CASES = [
  "content-collection-rows",
  "content-field-rows",
  "content-root-rows",
  "folder-context-menu",
  "onboarding-steps",
  "canvas-footer-toolbar",
  // T2: the shared drawer header carries pin / help / close on every one of the
  // seven drawers, so a regression here is a regression seven times over.
  "panel-frame-header",
  // T6: every control in the Media drawer, including the ones only a failed
  // upload or a full quota puts on screen.
  "media-drawer-grid",
  "media-drawer-upload-failed",
  "media-drawer-quota-full",
] as const;

/**
 * Exemptions, by accessible name → reason. EMPTY, and worth keeping that way:
 * every control in these cases clears 24x24 today. An entry here is a debt, not
 * a blessing — adding one needs a reason a reviewer would accept, and the far
 * cheaper fix is usually `IconButton` (32x32) or `tw:min-h-6`.
 */
const BASELINE: Record<string, string> = {};

test.describe("WCAG 2.5.8 target size", () => {
  for (const name of CASES) {
    test(`every control is at least ${MIN}x${MIN}: ${name}`, async ({ page }) => {
      await page.goto(`/e2e/probe/probe.html?case=${name}`);
      // Attribute, not visibility. Portalled cases (folder-context-menu,
      // onboarding-steps) move their content to #bk-overlay-root and leave
      // #probe-root an empty, HIDDEN div — `waitFor()` defaults to visible and
      // hangs 30s on exactly the two cases whose controls are most worth
      // measuring. The parity spec already learned this; same check here.
      await expect(page.locator("#probe-root")).toHaveAttribute("data-probe-ready", name);

      const undersized = await page.evaluate((min) => {
        const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-probe]"));
        const overlay = document.getElementById("bk-overlay-root");
        if (overlay) roots.push(overlay);

        const controls: HTMLElement[] = [];
        for (const root of roots) {
          controls.push(
            ...Array.from(
              root.querySelectorAll<HTMLElement>(
                'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="menuitem"]'
              )
            )
          );
        }

        return controls
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              name:
                (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "")
                  .trim()
                  .replace(/\s+/g, " ")
                  .slice(0, 40) || `<${el.tagName.toLowerCase()}>`,
              w: Math.round(r.width * 100) / 100,
              h: Math.round(r.height * 100) / 100,
            };
          })
          // A control with no box is hidden, not undersized.
          .filter((c) => c.w > 0 && c.h > 0)
          .filter((c) => c.w < min || c.h < min);
      }, MIN);

      const unexpected = undersized.filter((c) => !(c.name in BASELINE));
      expect(
        unexpected,
        `Controls under ${MIN}x${MIN} that are not in BASELINE. Either size the ` +
          `control (IconButton is 32x32 and exists for icon-only actions) or add ` +
          `it to BASELINE with a reason.\n` +
          unexpected.map((c) => `  ${c.name} — ${c.w}x${c.h}`).join("\n")
      ).toEqual([]);
    });
  }
});
