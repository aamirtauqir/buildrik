import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QA_ONBOARDING_EMAIL } from "./accounts";

// Mirrors auth.setup.ts's magic-link mint, but also resets OnboardingState so
// the post-login redirect lands the user in the wizard instead of /dashboard.
const AUTH_FILE = path.resolve(__dirname, ".auth/onboarding.json");
const EMAIL = QA_ONBOARDING_EMAIL;

setup("authenticate into an incomplete wizard", async ({ page }) => {
  const prisma = new PrismaClient();
  let token: string;
  try {
    const user = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
    if (!user) throw new Error(`No user "${EMAIL}" in the DB — seed it before running e2e.`);
    // Reset onboarding so the wizard shows. `step` must be reset explicitly, not
    // just left alone: useOnboardingFlow routes to /dashboard whenever
    // step is "CHECKLIST"/"COMPLETED", regardless of completed/dismissed — and
    // this QA user's row is left over from a prior onboarding run, sitting at
    // step "CHECKLIST". Schema @default only applies on row creation, not update.
    await prisma.onboardingState.upsert({
      where: { userId: user.id },
      update: { completed: false, dismissed: false, wizardData: {}, step: "ROLE_SELECT" },
      create: { userId: user.id, completed: false, dismissed: false, wizardData: {}, step: "ROLE_SELECT" },
    });

    // Drop every workspace this user picked up beyond the seeded one.
    //
    // The wizard's workspace step creates a real workspace, so each walkthrough
    // leaves another one behind. Once the user has more than one membership the
    // post-login redirect stops at /auth/workspace-select
    // (`app/auth/redirect/page.tsx:35`) instead of continuing into the wizard,
    // and this fixture times out. It passes on a fresh seed and fails on every
    // run after — the same accumulate-until-broken shape as the OnboardingState
    // reset above, which is why both are handled here rather than in the seed.
    const seeded = await prisma.workspace.findUnique({
      where: { slug: "qa-onboarding-workspace" },
      select: { id: true },
    });
    if (seeded) {
      const strays = await prisma.workspaceMember.findMany({
        where: { userId: user.id, workspaceId: { not: seeded.id } },
        select: { workspaceId: true },
      });
      if (strays.length > 0) {
        const ids = strays.map((s) => s.workspaceId);
        await prisma.workspaceMember.deleteMany({ where: { userId: user.id, workspaceId: { in: ids } } });
        // Only remove workspaces this user owns — never one they were invited to.
        await prisma.workspace.deleteMany({ where: { id: { in: ids }, ownerId: user.id } });
      }
    }

    token = randomUUID();
    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token: createHash("sha256").update(token).digest("hex"),
        type: "magic_link",
        expires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  } finally {
    await prisma.$disconnect();
  }

  await page.goto(`/auth/callback?token=${token}`);
  // Generous: first hit cold-compiles the auth + onboarding tRPC routes under turbopack.
  await page.waitForURL(/\/onboarding/, { timeout: 90_000 });
  await expect(page.getByText(/Buildrick/i).first()).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
