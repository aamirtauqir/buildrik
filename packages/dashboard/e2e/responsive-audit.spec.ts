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

        const { scrollWidth, clientWidth, widest } = await page.evaluate(() => {
          const de = document.documentElement;
          let widest = "";
          if (de.scrollWidth > de.clientWidth + 1) {
            // Name the widest offender so a failure is actionable.
            let max = 0;
            for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
              const right = el.getBoundingClientRect().right;
              if (right > max) {
                max = right;
                widest = `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 60)} right=${Math.round(right)}`;
              }
            }
          }
          return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, widest };
        });

        expect(scrollWidth, `overflows by ${scrollWidth - clientWidth}px — widest: ${widest}`).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  });
}
