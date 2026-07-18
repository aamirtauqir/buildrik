import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// S1 · workspace-setup — the 5 states from the frame gallery (EMPTY NAME,
// NAME EXISTS, NAME TOO LONG, NETWORK ERROR, LOADING) plus the happy path.
// Runs under the "chromium-onboarding" project (setup-onboarding auth state,
// which resets OnboardingState so the QA user lands back in the wizard).
test.describe("onboarding · workspace", () => {
  // getByRole("textbox").first() is ambiguous — some dev-tooling overlay in this
  // environment (unrelated to the app) mounts its own textbox and can race to be
  // "first" in DOM order. OnbField's <label> isn't programmatically associated
  // (no htmlFor/id), so target the field by its exact placeholder instead.
  const nameField = (page: import("@playwright/test").Page) => page.getByPlaceholder("My Workspace");
  const continueBtn = (page: import("@playwright/test").Page) =>
    page.getByRole("button", { name: /^create workspace$/i });

  test("empty name blocks + shows inline error", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await nameField(page).fill("");
    await continueBtn(page).click();
    await expect(page.getByText(/workspace name is required/i)).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding\/workspace/); // did not advance
  });

  test("name over 40 characters blocks + shows the too-long inline error", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await nameField(page).fill("Bright Events Website for Weddings & Corporate Functions"); // 58 chars
    await continueBtn(page).click();
    await expect(page.getByText(/keep it under 40 characters/i)).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding\/workspace/);
  });

  test("a name that collides with another of the user's workspaces shows the exists error", async ({ page }) => {
    const prisma = new PrismaClient();
    const email = process.env.PW_ONB_EMAIL ?? "qa@buildrik.local";
    const clashName = `E2E Clash ${randomUUID().slice(0, 8)}`;
    let clashWorkspaceId: string;
    try {
      const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
      if (!user) throw new Error(`No user "${email}" in the DB — seed it before running e2e.`);
      // A second ACTIVE workspace for the SAME user, named what we're about to
      // try to rename their primary workspace to — the exact shape the
      // updateWorkspaceSettings duplicate-name guard checks against.
      const clash = await prisma.workspace.create({
        data: { name: clashName, slug: `e2e-clash-${randomUUID().slice(0, 8)}`, ownerId: user.id },
      });
      clashWorkspaceId = clash.id;
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: clash.id, role: "OWNER" },
      });
    } finally {
      await prisma.$disconnect();
    }

    try {
      await page.goto("/onboarding/workspace");
      await nameField(page).fill(clashName);
      await continueBtn(page).click();
      await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveURL(/\/onboarding\/workspace/);
    } finally {
      const cleanup = new PrismaClient();
      await cleanup.workspace.delete({ where: { id: clashWorkspaceId } }); // cascades the membership
      await cleanup.$disconnect();
    }
  });

  test("a network failure while saving shows the retry banner, and retry recovers", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await page.route("**/account.workspace.update**", (route) => route.abort("failed"));

    await nameField(page).fill(`Acme Offline ${randomUUID().slice(0, 6)}`);
    await continueBtn(page).click();

    await expect(
      page.getByText(/something went wrong\. check your connection and try again\./i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding\/workspace/); // did not advance

    await page.unroute("**/account.workspace.update**");
    await page.getByRole("button", { name: /try again/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/site/, { timeout: 15_000 });
  });

  test("shows a disabled spinner button while the save is in flight", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await page.route("**/account.workspace.update**", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await nameField(page).fill(`Acme Loading ${randomUUID().slice(0, 6)}`);
    await continueBtn(page).click();

    const loadingBtn = page.getByRole("button", { name: /creating workspace…/i });
    await expect(loadingBtn).toBeVisible();
    await expect(loadingBtn).toBeDisabled();

    await expect(page).toHaveURL(/\/onboarding\/site/, { timeout: 15_000 }); // resolves once unblocked
  });

  test("valid name advances to the site step", async ({ page }) => {
    await page.goto("/onboarding/workspace");
    await nameField(page).fill(`Acme Studio ${randomUUID().slice(0, 6)}`);
    await continueBtn(page).click();
    await expect(page).toHaveURL(/\/onboarding\/site/, { timeout: 15_000 });
  });
});
