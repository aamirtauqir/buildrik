import { test, expect } from "@playwright/test";

/** Every dashboard route matched to the new design, at the three viewports the
 *  design does not itself define. The shell's content column went fluid when it
 *  dropped its 1120px max-width, so horizontal overflow is the regression this
 *  guards: a page that scrolls sideways is broken on tablet and phone. */
const ROUTES = [
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/marketplace",
  "/dashboard/media",
  "/dashboard/templates",
  "/dashboard/settings",
  "/dashboard/getting-started",
  "/dashboard/help",
  "/dashboard/learn",
  "/dashboard/resources",
  "/dashboard/agency",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      test(`${route} has no horizontal overflow`, async ({ page }) => {
        await page.goto(route);
        // Not networkidle: the app holds SSE and HMR sockets open, so it never
        // settles. The h1 is the first thing every matched screen renders.
        await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });

        // Poll rather than measure once: data arriving mid-render can leave an
        // element transiently wide, which is not the settled layout we care about.
        await expect
          .poll(
            async () =>
              page.evaluate(() => {
                const de = document.documentElement;
                return de.scrollWidth - de.clientWidth;
              }),
            { timeout: 15_000, message: `${route} still overflows once settled` }
          )
          .toBeLessThanOrEqual(1);

        // Name the widest offender when it did settle wide, so a failure is actionable.
        const widest = await page.evaluate(() => {
          const de = document.documentElement;
          if (de.scrollWidth <= de.clientWidth + 1) return "";
          let max = 0;
          let who = "";
          for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
            const right = el.getBoundingClientRect().right;
            if (right > max) {
              max = right;
              who = `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 60)} right=${Math.round(right)}`;
            }
          }
          return who;
        });
        expect(widest, `settled overflow — widest: ${widest}`).toBe("");
      });
    }
  });
}
