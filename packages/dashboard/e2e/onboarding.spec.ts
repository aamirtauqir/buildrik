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

// S2 · site-setup — Project setup / My business / Existing client / Email error /
// Focused error frames. "New client" (inline client-name + client-email capture)
// is the default branch, matching the frame gallery's Project-setup state. Field
// labels aren't programmatically associated (see the workspace block above), so
// fields are targeted by placeholder.
test.describe("onboarding · site", () => {
  const siteNameField = (page: import("@playwright/test").Page) =>
    page.getByPlaceholder("e.g. Bright Events Website");
  const clientNameField = (page: import("@playwright/test").Page) =>
    page.getByPlaceholder("Enter client business name");
  const emailField = (page: import("@playwright/test").Page) => page.getByPlaceholder("client@example.com");
  const emailErrorText = (page: import("@playwright/test").Page) => page.getByText(/enter a valid email/i);

  test("New client is the default branch, showing the client name + email fields", async ({ page }) => {
    await page.goto("/onboarding/site");
    await expect(siteNameField(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /^new client/i })).toBeVisible();
    await expect(clientNameField(page)).toBeVisible();
    await expect(emailField(page)).toBeVisible();
  });

  test("an empty (optional) email never errors on blur", async ({ page }) => {
    await page.goto("/onboarding/site");
    await emailField(page).click();
    await clientNameField(page).click(); // blur the email field without typing
    await expect(emailErrorText(page)).toHaveCount(0);
  });

  test("invalid client email shows a field error on blur", async ({ page }) => {
    await page.goto("/onboarding/site");
    await emailField(page).fill("not-an-email");
    await clientNameField(page).click(); // blur the email field
    await expect(emailErrorText(page)).toBeVisible();
  });

  test("re-focusing the invalid email field keeps the error visible under the focus ring", async ({ page }) => {
    await page.goto("/onboarding/site");
    await emailField(page).fill("not-an-email");
    await clientNameField(page).click();
    await expect(emailErrorText(page)).toBeVisible();

    await emailField(page).focus();
    await expect(emailErrorText(page)).toBeVisible(); // still shown while focused
    const boxShadow = await emailField(page).evaluate((el) => getComputedStyle(el).boxShadow);
    // Unfocused error is a single inset ring; focused error layers a second,
    // outer glow on top of it (OnbField's `focus:shadow-[...]`).
    expect(boxShadow.split(", ").length).toBeGreaterThan(1);
  });

  test("clicking Continue with an invalid email blocks navigation and shows the error", async ({ page }) => {
    await page.goto("/onboarding/site");
    await siteNameField(page).fill("Bright Events Website");
    await clientNameField(page).fill("Bright Events");
    await emailField(page).fill("not-an-email");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(emailErrorText(page)).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding\/site/);
  });

  test("switching to Existing client swaps in the client picker with an add-new option", async ({ page }) => {
    await page.goto("/onboarding/site");
    await page.getByRole("button", { name: /^existing client/i }).click();
    await expect(emailField(page)).toHaveCount(0);

    const select = page.getByRole("combobox");
    await expect(select).toBeVisible();
    const optionLabels = await select.locator("option").allTextContents();
    expect(optionLabels).toContain("+ Add new client");
  });

  test("picking “+ Add new client” swaps back to the New client fields", async ({ page }) => {
    await page.goto("/onboarding/site");
    await page.getByRole("button", { name: /^existing client/i }).click();
    await page.getByRole("combobox").selectOption({ label: "+ Add new client" });
    await expect(clientNameField(page)).toBeVisible();
    await expect(emailField(page)).toBeVisible();
  });

  test("switching to My own business hides every client field", async ({ page }) => {
    await page.goto("/onboarding/site");
    await page.getByRole("button", { name: /^my own business/i }).click();
    await expect(emailField(page)).toHaveCount(0);
    await expect(clientNameField(page)).toHaveCount(0);
  });

  test("a network failure loading clients shows the retry banner, and retry recovers", async ({ page }) => {
    await page.route("**/clients.list**", (route) => route.abort("failed"));
    await page.goto("/onboarding/site");
    await page.getByRole("button", { name: /^existing client/i }).click();
    await expect(
      page.getByText(/something went wrong\. check your connection and try again\./i),
    ).toBeVisible({ timeout: 20_000 });

    await page.unroute("**/clients.list**");
    await page.getByRole("button", { name: /try again/i }).click();
    await expect(page.getByRole("combobox")).toBeVisible({ timeout: 20_000 });
  });
});

// S3 · path-chooser — 3 build-path cards (AI / Template / Blank), each routing
// via saveAndGo to its own flow. On a freshly-reset wizard (no workspace.role
// captured yet) the "ai" path is the default recommendation, so its per-card
// CTA ("Start AI Draft") is duplicated by the page's bottom recommended-path
// CTA — both trigger the identical choose("ai") handler, so `.first()` is a
// safe, deterministic way to hit the (leftmost, per-card) one.
test.describe("onboarding · path", () => {
  test("AI Draft card routes to the AI-draft flow", async ({ page }) => {
    await page.goto("/onboarding/path");
    await page.getByRole("button", { name: /^start ai draft$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/ai\/basics/, { timeout: 15_000 });
  });

  test("Template card routes to the template flow", async ({ page }) => {
    await page.goto("/onboarding/path");
    await page.getByRole("button", { name: /browse templates/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/template/, { timeout: 15_000 });
  });

  test("Blank Canvas card routes to the blank flow", async ({ page }) => {
    await page.goto("/onboarding/path");
    await page.getByRole("button", { name: /open blank canvas/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/blank/, { timeout: 15_000 });
  });
});

// A1-A5 · AI-draft flow — Business basics / Goal & audience / Brand style /
// Generating / Draft ready frames. Each of the 3 form steps is reachable by
// direct navigation (WizardBoot doesn't gate on prior-step data), matching
// how the frame gallery + S3's "Start AI Draft" card land here.
//
// Real generation calls the configured AI provider (OPENAI_API_KEY) and can
// take minutes, so only the deterministic portion — basics → goal → brand
// advancing, and the generating spinner appearing — runs by default. The
// completed-draft assertion needs a live provider and is gated behind
// PW_ONB_AI (unset in CI, so that test is skipped by default).
test.describe("onboarding · AI draft", () => {
  async function fillBasicsGoalBrand(page: import("@playwright/test").Page) {
    await page.goto("/onboarding/ai/basics");
    await page.getByRole("button", { name: "Restaurant", exact: true }).click();
    await page.getByPlaceholder("Bright Events").fill("Sunrise Bakery");
    await page.getByPlaceholder("Event planning and coordination services").fill("Fresh bread and pastries daily");
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/ai\/goal/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Get leads", exact: true }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/ai\/brand/, { timeout: 15_000 });

    await page.getByRole("button", { name: /^generate site draft$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/ai\/generating/, { timeout: 15_000 });
  }

  test("AI flow: basics → goal → brand advances to the generating spinner", async ({ page }) => {
    await fillBasicsGoalBrand(page);

    await expect(page.getByRole("heading", { name: /creating your site draft/i })).toBeVisible();
    await expect(page.getByText(/creating sitemap/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancel and go back$/i })).toBeVisible();
  });

  (process.env.PW_ONB_AI ? test : test.skip)(
    "AI flow: a completed generation lands on the draft-ready preview",
    async ({ page }) => {
      await fillBasicsGoalBrand(page);

      await expect(page).toHaveURL(/\/onboarding\/ai\/preview/, { timeout: 180_000 });
      await expect(page.getByRole("heading", { name: /your first draft is ready/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^open in editor$/i })).toBeVisible();
    },
  );
});

// T1-T3 · template flow — Gallery / No-results / Preview / Selected frames.
// The gallery is seeded with real templates (prisma/seed.ts: Studio Portfolio,
// Local Business, Agency, Bistro), so a real trpc.templates.list round-trip is
// exercised rather than mocked data. Search input has no programmatic label
// (same OnbField gap as workspace/site above), so it's targeted by placeholder
// rather than getByRole("searchbox") — that role also isn't safe here, per the
// dev-tooling-overlay note on `nameField` above.
test.describe("onboarding · template", () => {
  const searchField = (page: import("@playwright/test").Page) => page.getByPlaceholder("Search templates...");

  test("template search with no matches shows the no-results empty state, and clearing it restores the gallery", async ({
    page,
  }) => {
    await page.goto("/onboarding/template");
    await expect(page.getByRole("heading", { name: /^choose a template$/i })).toBeVisible();

    await searchField(page).fill("zzzzznomatch");
    await expect(page.getByText(/no templates found/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/try a different category, or clear the search\./i)).toBeVisible();

    const clearBtn = page.getByRole("button", { name: /clear filters/i });
    await expect(clearBtn).toBeVisible();

    await clearBtn.click();
    await expect(searchField(page)).toHaveValue("");
    await expect(page.getByText(/no templates found/i)).toHaveCount(0);
  });

  test("picking a template from the gallery opens its preview, and confirming lands on the selected screen", async ({
    page,
  }) => {
    await page.goto("/onboarding/template");
    // "Studio Portfolio" (prisma/seed.ts) — matched by its full name so this
    // can't collide with the "Portfolio" category filter chip, which shares
    // the same substring but not the full card name.
    await page.getByRole("button", { name: /studio portfolio/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/template\/preview/, { timeout: 15_000 });

    // T2 has no "Skip setup" — unlike every other onboarding frame, verified
    // against the frame gallery, not a missing feature.
    await expect(page.getByRole("button", { name: /skip setup/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Studio Portfolio" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^use this template$/i })).toBeVisible();

    await page.getByRole("button", { name: /^use this template$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/template\/selected/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /^template selected$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^open in editor$/i })).toBeVisible();
  });
});
