import { test, expect } from "@playwright/test";

/** The brief forbids broken routes and dead interactions. The design itself points
 *  at three Settings destinations that do not exist in this app (map: C6) — they
 *  were deliberately not built, and this guards against anyone adding them, or any
 *  other internal link, without a route behind it. */
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

// Walks 11 screens and then requests every distinct link — ~40 routes once the
// Settings directory is counted. Against `next dev` each of those is a cold
// on-demand compile, so the wall-clock here is compile cost, not test logic.
test.setTimeout(300_000);

test("every internal link on the designed screens resolves to a real route", async ({ page }) => {
  const hrefs = new Set<string>();

  for (const route of ROUTES) {
    await page.goto(route);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href")!)
        .filter((h) => h.startsWith("/"))
    );
    for (const h of found) hrefs.add(h.split("#")[0].split("?")[0]);
  }

  expect(hrefs.size, "expected to find internal links to check").toBeGreaterThan(10);

  const dead: string[] = [];
  for (const href of hrefs) {
    // page.request, not the standalone `request` fixture: that one gets disposed
    // after this many navigations and fails the run for an infra reason.
    // 307 is the auth redirect and means the route exists; only 404 is a dead link.
    const res = await page.request.get(href, { maxRedirects: 0, failOnStatusCode: false });
    if (res.status() === 404) dead.push(href);
  }

  expect(dead, `dead internal links: ${dead.join(", ")}`).toEqual([]);
});
