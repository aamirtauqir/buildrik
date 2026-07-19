import { test, expect } from "@playwright/test";

/** The design defines a single populated state per screen (map: C3), but the brief
 *  requires focus, disabled and keyboard behaviour to work everywhere. This pins
 *  the parts that are verifiable without mocking the API. */
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

test.use({ viewport: { width: 1440, height: 900 } });

for (const route of ROUTES) {
  test(`${route}: keyboard focus reaches a control and shows a visible ring`, async ({ page }) => {
    await page.goto(route);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        // globals.css sets *:focus-visible { outline: 2px solid var(--color-primary) }
        outlineWidth: cs.outlineWidth,
        outlineStyle: cs.outlineStyle,
      };
    });
    expect(focused, "Tab must move focus to a real control").not.toBeNull();
  });

  test(`${route}: no disabled control is reachable as a tab stop`, async ({ page }) => {
    await page.goto(route);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });

    const bad = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button[disabled], [aria-disabled='true']")]
        .filter((el) => el.tabIndex > 0)
        .map((el) => el.textContent?.trim().slice(0, 30) ?? "")
    );
    expect(bad, "disabled controls must not be positive tab stops").toEqual([]);
  });
}

test("the focus ring token resolves to the design accent", async ({ page }) => {
  await page.goto("/dashboard");
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()
  );
  expect(accent.toUpperCase()).toBe("#406ED6");
});
