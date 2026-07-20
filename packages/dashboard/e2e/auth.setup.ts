import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QA_EMAIL } from "./accounts";

// Establish a signed-in session once, save it, and let every spec reuse it.
// The dashboard authenticates by magic-link: we mint a token straight in the DB
// (the same shape the mailer would send) and hit /auth/callback with it.
const AUTH_FILE = path.resolve(__dirname, ".auth/user.json");

setup("authenticate via magic-link", async ({ page }) => {
  const prisma = new PrismaClient();
  let token: string;
  try {
    const user = await prisma.user.findFirst({ where: { email: QA_EMAIL }, select: { id: true } });
    if (!user) throw new Error(`No user "${QA_EMAIL}" in the DB — seed it before running e2e.`);

    // Provision the precondition this fixture asserts, rather than inheriting
    // whatever the last run left behind.
    //
    // The login redirect is gated on OnboardingState.step: CHECKLIST routes to
    // /dashboard, ROLE_SELECT routes into the wizard. Two things used to leave
    // that unset or wrong. `onboarding.setup.ts` deliberately resets this same
    // user to ROLE_SELECT so its own specs land in the wizard, and nothing put
    // it back — so whichever fixture ran second lost, and when this one lost,
    // the 81 tests depending on it were skipped rather than failed. Separately,
    // `prisma/seed.ts` creates no OnboardingState at all and getOnboardingState
    // auto-creates one at ROLE_SELECT, so on any fresh database (new machine,
    // CI, `migrate reset`) this fixture failed on its very first run.
    //
    // Seeding a second user for PW_ONB_EMAIL would have fixed neither: it moves
    // the shared-state dependency instead of removing it, and does nothing about
    // the fresh-database case. Owning the precondition fixes both, and keeps the
    // two fixtures independent of each other's ordering.
    await prisma.onboardingState.upsert({
      where: { userId: user.id },
      update: { step: "CHECKLIST", completed: true, dismissed: false },
      create: { userId: user.id, step: "CHECKLIST", completed: true, dismissed: false },
    });

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
  // Generous: first hit cold-compiles the auth tRPC routes under turbopack.
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  await expect(page.getByRole("link", { name: /Buildrick/i }).first()).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
