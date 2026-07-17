import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Establish a signed-in session once, save it, and let every spec reuse it.
// The dashboard authenticates by magic-link: we mint a token straight in the DB
// (the same shape the mailer would send) and hit /auth/callback with it.
const AUTH_FILE = path.resolve(__dirname, ".auth/user.json");
const QA_EMAIL = process.env.PW_USER_EMAIL ?? "qa@buildrik.local";

setup("authenticate via magic-link", async ({ page }) => {
  const prisma = new PrismaClient();
  let token: string;
  try {
    const user = await prisma.user.findFirst({ where: { email: QA_EMAIL }, select: { id: true } });
    if (!user) throw new Error(`No user "${QA_EMAIL}" in the DB — seed it before running e2e.`);
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
