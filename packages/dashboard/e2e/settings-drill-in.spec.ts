import { test, expect } from "@playwright/test";
import { SETTINGS_OWN_HREFS, findSettingsSection } from "../components/dashboard/shell/settings-sections";

/** Settings navigates by drilling in from the directory: every sub-page must name
 *  the section you opened and offer a way back. A page that still says "Settings"
 *  — or that lost its back link — is the bug this guards. */

test.use({ viewport: { width: 1440, height: 900 } });

// ~13 sub-pages, each a cold on-demand compile under next dev.
test.setTimeout(300_000);

test("the directory lists sections and does not show a tab rail", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });

  await expect(page.locator("h1")).toHaveText("General settings");
  await expect(page.locator('nav[aria-label="Settings sections"]')).toHaveCount(0);
  // Every settings-owned section should be reachable as a card. Scoped to <main>:
  // the sidebar's "Upgrade plan" also links to /settings/plans, so an unscoped
  // count sees two and fails for a reason that has nothing to do with the cards.
  const main = page.locator("main");
  for (const href of SETTINGS_OWN_HREFS) {
    await expect(main.locator(`a[href="${href}"]`), `no card for ${href}`).toHaveCount(1);
  }
});

for (const href of SETTINGS_OWN_HREFS) {
  const section = findSettingsSection(href)!;

  test(`${href} titles itself "${section.label}" and offers a way back`, async ({ page }) => {
    await page.goto(href);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });

    await expect(page.locator("h1")).toHaveText(section.label);
    await expect(page.getByText(section.description, { exact: true }).first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/settings"]').first()).toBeVisible();
    // The rail it replaced must not come back on any sub-page.
    await expect(page.locator('nav[aria-label="Settings sections"]')).toHaveCount(0);
  });
}
