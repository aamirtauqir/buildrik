import { test, expect } from "@playwright/test";

// The 6 workspace destinations (IA v2). Each must render its own h1 and show
// its navigation — the smoke floor across every browser/device. Templates is a
// full-width ecosystem tab since 4d5cd9f09 (no workspace sidebar), so its way
// back is the top bar's "Dashboard" link instead.
const ROUTES = [
  { path: "/dashboard", name: "Home", heading: /Good (morning|afternoon|evening)/i },
  { path: "/dashboard/projects", name: "Sites", heading: /^Sites$/i },
  { path: "/dashboard/agency", name: "Agency", heading: /^Agency$/i },
  { path: "/dashboard/media", name: "Media", heading: /^Media$/i },
  { path: "/dashboard/templates", name: "Templates", heading: /Templates/i, fullWidth: true },
  { path: "/dashboard/settings", name: "Settings", heading: /^Settings$/i },
] as const;

test.describe("dashboard smoke", () => {
  for (const r of ROUTES) {
    test(`${r.name} renders`, async ({ page }) => {
      await page.goto(r.path);
      await expect(page.locator("h1").first()).toHaveText(r.heading);
      // persistent nav present (trunk test — you always know where you are)
      if ("fullWidth" in r) {
        await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
      } else {
        await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
        await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
      }
    });
  }

  test("brand wordmark + account pill in the top bar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /Buildrick/i }).first()).toBeVisible();
    await expect(page.getByText("Account").first()).toBeVisible();
  });

  test("sidebar navigation: Home → Sites → Settings", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Sites" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await expect(page.locator("h1").first()).toHaveText(/^Sites$/i);

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
