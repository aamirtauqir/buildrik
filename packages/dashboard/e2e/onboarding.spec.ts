import { randomUUID } from "node:crypto";
import { QA_ONBOARDING_EMAIL } from "./accounts";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Shared by the full-walkthrough tests (bottom of file) and the blank+ready
// test below — mirrors onboarding.setup.ts's OnboardingState reset plus the
// site soft-delete pattern. Every full walkthrough ends by creating a REAL
// site, and the QA workspace is FREE-plan (3-site cap), so existing sites must
// be cleared before each run or SITE_LIMIT masks whatever the walkthrough is
// actually meant to prove. Resetting OnboardingState too keeps each walkthrough
// starting from a clean wizardData blob instead of whatever the previous test
// left behind.
async function resetOnboardingUser() {
  const prisma = new PrismaClient();
  try {
    const email = QA_ONBOARDING_EMAIL;
    const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`No user "${email}" in the DB — seed it before running e2e.`);

    await prisma.onboardingState.upsert({
      where: { userId: user.id },
      update: { completed: false, dismissed: false, wizardData: {}, step: "ROLE_SELECT" },
      create: { userId: user.id, completed: false, dismissed: false, wizardData: {}, step: "ROLE_SELECT" },
    });

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    if (membership) {
      await prisma.site.updateMany({
        where: { workspaceId: membership.workspaceId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      // FREE plan also caps AI generations at 3/month (+ a 3/hour anti-abuse
      // throttle), per workspace — createGenerationJob (ai-generation.service.ts)
      // counts every non-cancelled ai_generation_jobs row. Every AI-flow test
      // below fires a REAL createJob.mutateAsync, so without clearing prior rows
      // the count silently exceeds the cap after a handful of runs and the
      // mutation rejects with AI_MONTHLY_LIMIT — the generating page then
      // renders its *error* branch ("Couldn't create your draft") instead of
      // the spinner. That read as a timing flake; it wasn't one — reproduced by
      // querying ai_generation_jobs directly (3 already this month, cap is 3).
      await prisma.aIGenerationJob.deleteMany({ where: { workspaceId: membership.workspaceId } });
    }
  } finally {
    await prisma.$disconnect();
  }
}

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
    page.getByRole("button", { name: /^continue$/i });

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
    const email = QA_ONBOARDING_EMAIL;
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

    const loadingBtn = page.getByRole("button", { name: /continuing…/i });
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
//
// Module-scoped (not local to the describe block below) so the full AI
// walkthrough at the bottom of the file can reuse it without re-navigating —
// `navigate: false` skips the initial goto when the caller already clicked
// its way onto /onboarding/ai/basics.
async function fillAiBasicsGoalBrand(
  page: import("@playwright/test").Page,
  opts: { navigate?: boolean } = {},
) {
  if (opts.navigate !== false) await page.goto("/onboarding/ai/basics");
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

test.describe("onboarding · AI draft", () => {
  test("AI flow: basics → goal → brand advances to the generating spinner", async ({ page }) => {
    await resetOnboardingUser(); // clears stale ai_generation_jobs — see the comment on the function
    await fillAiBasicsGoalBrand(page);

    // Previously flaked on the implicit 10s default: /onboarding/ai/generating
    // is a route Turbopack hasn't compiled yet on a cold dev server (same class
    // of lag the onboarding fixture calls out for the auth callback), so the
    // heading can take longer than the default expect timeout to paint even
    // though nothing is actually broken. Wait on the real spinner/progress
    // elements with generous explicit timeouts instead of a fixed sleep.
    await expect(page.getByRole("heading", { name: /creating your site draft/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/creating sitemap/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /^cancel and go back$/i })).toBeVisible({ timeout: 30_000 });
  });

  (process.env.PW_ONB_AI ? test : test.skip)(
    "AI flow: a completed generation lands on the draft-ready preview",
    async ({ page }) => {
      await resetOnboardingUser();
      await fillAiBasicsGoalBrand(page);

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

// B1/E1 · blank canvas → editor ready. Unlike the template flow above (which
// stops short of "Use this template"'s createAndAdvance call), this flow's own
// CTA — "Open Blank Canvas" — IS the site-creation step, so a real
// trpc.sites.create round-trip is unavoidable to reach /onboarding/ready.
// The QA fixture user's workspace is FREE-plan (3-site cap) and accumulates
// real sites across e2e runs (AI-draft / template-flow specs, manual QA), so
// it drifts past the cap over time — softDelete its existing sites first,
// mirroring sites.service's own soft-delete (`deletedAt`), so SITE_LIMIT
// never masks a real regression here.
test.describe("onboarding · blank + ready", () => {
  test("blank path creates a site, reaches ready, and the editor-ready CTA is wired", async ({ page }) => {
    await resetOnboardingUser();

    await page.goto("/onboarding/blank");
    await expect(page.getByRole("heading", { name: /^start with a blank canvas$/i })).toBeVisible();

    // B1's default state: "Home page" + "Header only" both pre-selected, per
    // the frame gallery (not blank, despite "Layout starter" being optional).
    await expect(page.getByRole("button", { name: "Home page", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("button", { name: "Header only", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.getByPlaceholder("e.g. Bright Events Website").fill(`E2E Blank ${randomUUID().slice(0, 8)}`);
    await page.getByRole("button", { name: /^open blank canvas$/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/ready/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /^ready to edit$/i })).toBeVisible();
    // E1 (unlike T2) DOES carry "Skip setup" in the frame gallery.
    await expect(page.getByRole("button", { name: /^skip setup$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^open editor$/i })).toBeVisible();
  });
});

// Full-flow walkthroughs — one per build path (AI / Template / Blank), each
// driven start-to-finish through client-side navigation (workspace → site →
// path → the path's own flow → ready), unlike the per-step describes above
// which each open a single frame directly. Every walkthrough ends by creating
// a real site, so `resetOnboardingUser` (soft-delete + OnboardingState reset)
// runs before each one — same FREE-plan 3-site-cap reasoning as the blank+
// ready test above.
test.describe("onboarding · full walkthroughs", () => {
  test.beforeEach(async () => {
    await resetOnboardingUser();
  });

  // Shared workspace → site prefix for all three walkthroughs below. "My own
  // business" is picked at S2 purely to avoid the New-client field validation
  // (already covered by the S2 describe block above) — org type isn't what
  // these tests are about.
  async function completeWorkspaceAndSiteSteps(page: import("@playwright/test").Page, label: string) {
    await page.goto("/onboarding/workspace");
    await page.getByPlaceholder("My Workspace").fill(`E2E ${label} WS ${randomUUID().slice(0, 6)}`);
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/site/, { timeout: 15_000 });

    await page.getByPlaceholder("e.g. Bright Events Website").fill(`E2E ${label} Site ${randomUUID().slice(0, 6)}`);
    // Not `$`-anchored — the button's accessible name is the card's title AND
    // description text concatenated, same as the S2 describe block above.
    await page.getByRole("button", { name: /^my own business/i }).click();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/path/, { timeout: 15_000 });
  }

  test("AI full path: workspace → site → path → AI draft → generating spinner (draft-ready gated behind PW_ONB_AI)", async ({
    page,
  }) => {
    await completeWorkspaceAndSiteSteps(page, "AI");

    await page.getByRole("button", { name: /^start ai draft$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/ai\/basics/, { timeout: 15_000 });

    // Already on /onboarding/ai/basics via the click above — skip the helper's
    // own goto so this walkthrough exercises the real client-side transitions.
    await fillAiBasicsGoalBrand(page, { navigate: false });

    await expect(page.getByRole("heading", { name: /creating your site draft/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/creating sitemap/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /^cancel and go back$/i })).toBeVisible({ timeout: 30_000 });

    // Real generation takes minutes — only assert the completed draft when a
    // live AI provider is explicitly opted into.
    if (process.env.PW_ONB_AI) {
      await expect(page).toHaveURL(/\/onboarding\/ai\/preview/, { timeout: 180_000 });
      await expect(page.getByRole("heading", { name: /your first draft is ready/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^open in editor$/i })).toBeVisible();
    }
  });

  test("Template full path: workspace → site → path → template gallery → preview → selected → ready", async ({
    page,
  }) => {
    await completeWorkspaceAndSiteSteps(page, "Template");

    await page.getByRole("button", { name: /browse templates/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/template/, { timeout: 15_000 });

    // "Studio Portfolio" (prisma/seed.ts) — same seeded template the T1-T3
    // describe above picks.
    await page.getByRole("button", { name: /studio portfolio/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/template\/preview/, { timeout: 15_000 });

    await page.getByRole("button", { name: /^use this template$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/template\/selected/, { timeout: 15_000 });

    // Unlike the T1-T3 describe above (which stops here to avoid creating a
    // site), the full walkthrough clicks through: this IS the createAndAdvance
    // call, a real trpc.sites.create round-trip to /onboarding/ready.
    await page.getByRole("button", { name: /^open in editor$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/ready/, { timeout: 20_000 });

    await expect(page.getByRole("heading", { name: /^ready to edit$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^open editor$/i })).toBeVisible();
  });

  test("Blank full path: workspace → site → path → blank canvas → ready", async ({ page }) => {
    await completeWorkspaceAndSiteSteps(page, "Blank");

    await page.getByRole("button", { name: /open blank canvas/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/blank/, { timeout: 15_000 });

    await page.getByPlaceholder("e.g. Bright Events Website").fill(`E2E Blank Full ${randomUUID().slice(0, 8)}`);
    await page.getByRole("button", { name: /^open blank canvas$/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/ready/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /^ready to edit$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^open editor$/i })).toBeVisible();
  });
});
