import { test, expect } from "@playwright/test";

// The 6 workspace destinations (IA v2). Each must render its own h1 and show
// the persistent sidebar — the smoke floor across every browser/device.
const ROUTES = [
  { path: "/dashboard", name: "Home", heading: /Good (morning|afternoon|evening)/i },
  { path: "/dashboard/projects", name: "Projects", heading: /^Projects$/i },
  { path: "/dashboard/agency", name: "Agency", heading: /^Agency$/i },
  { path: "/dashboard/media", name: "Media", heading: /^Media$/i },
  { path: "/dashboard/templates", name: "Templates", heading: /Templates/i },
  { path: "/dashboard/settings", name: "Settings", heading: /^Settings$/i },
] as const;

test.describe("dashboard smoke", () => {
  for (const r of ROUTES) {
    test(`${r.name} renders`, async ({ page }) => {
      await page.goto(r.path);
      await expect(page.locator("h1").first()).toHaveText(r.heading);
      // persistent nav present (trunk test — you always know where you are)
      await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
    });
  }

  test("brand wordmark + account pill in the top bar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /Buildrick/i }).first()).toBeVisible();
    await expect(page.getByText("Account").first()).toBeVisible();
  });

  test("sidebar navigation: Home → Projects → Settings", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Projects" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await expect(page.locator("h1").first()).toHaveText(/^Projects$/i);

    await page.getByRole("link", { name: "Settings" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.locator("h1").first()).toHaveText(/^Settings$/i);
  });

  test("Settings rail exposes workspace/platform/billing/personal groups", async ({ page }) => {
    await page.goto("/dashboard/settings");
    for (const group of ["Workspace", "Team", "Plans", "Account"]) {
      await expect(page.getByRole("link", { name: group }).first()).toBeVisible();
    }
  });
});
