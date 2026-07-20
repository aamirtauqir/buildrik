import { test, expect } from "@playwright/test";

/**
 * Every dashboard route must load clean.
 *
 * The existing specs visit these routes for a11y focus rings and horizontal
 * overflow, but none of them look at the console. A route can render its h1,
 * pass every assertion, and still be throwing on every load — a failed data
 * fetch, a hydration mismatch, an undefined read in an effect. That shows up as
 * a broken panel to a user and as nothing at all to CI.
 *
 * `pageerror` is listened to separately from `console`: an uncaught exception
 * does not always surface as a console message, and it is the more serious of
 * the two.
 */

const ROUTES = [
  "/dashboard", "/dashboard/projects", "/dashboard/agency", "/dashboard/media",
  "/dashboard/templates", "/dashboard/settings", "/dashboard/marketplace",
  "/dashboard/learn", "/dashboard/resources", "/dashboard/help",
  "/dashboard/getting-started", "/dashboard/notifications",
  "/dashboard/settings/workspace", "/dashboard/settings/team",
  "/dashboard/settings/plans", "/dashboard/settings/billing",
  "/dashboard/settings/usage", "/dashboard/settings/domains",
  "/dashboard/settings/integrations", "/dashboard/settings/api-tokens",
  "/dashboard/settings/ai", "/dashboard/settings/account",
  "/dashboard/settings/profile", "/dashboard/settings/security",
  "/dashboard/settings/notifications", "/dashboard/settings/danger",
];

for (const route of ROUTES) {
  test(`${route} loads with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(`UNCAUGHT: ${e.message}`));
    await page.goto(route);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(1200);
    expect(errors, `console errors on ${route}:\n${errors.join("\n")}`).toEqual([]);
  });
}
