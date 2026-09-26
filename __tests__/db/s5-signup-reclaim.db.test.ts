/**
 * S-5 (P0-5) — signup() must never destructively reclaim an unverified
 * account that is already in use (has logged in, owns a site, or shares a
 * workspace with another member). acceptInvite must also require the
 * accepting user's DB-read emailVerified, not the session's.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// The auth router pulls in server/trpc/trpc.ts -> @/server/auth (NextAuth
// init), which needs the Next.js server runtime this Postgres-only test tier
// doesn't provide. Stub it the same way the router's own mocked unit tests
// do — this test never calls `auth()` since it builds ctx.session by hand.
vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

import { prisma } from "@/lib/prisma";
import { signup, verifyEmail, verifyMagicLink } from "@/server/services/auth.service";
import { generateToken } from "@/server/services/token.service";
import { authRouter } from "@/server/trpc/routers/auth";
import {
  createTestUser,
  createTestWorkspace,
  createTestSite,
  createTestInvite,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("invite", "sitePermission", "site", "workspaceMember", "workspace", "user");
});

describe("signup() reclaim (S-5)", () => {
  it("refuses to reclaim an unverified account that has logged in and owns a site — rows stay intact", async () => {
    const user = await createTestUser({ email: "used@test.buildrik.local", emailVerified: null, lastLoginAt: new Date() });
    const workspace = await createTestWorkspace({ ownerId: user.id });
    const site = await createTestSite({ workspaceId: workspace.id, createdBy: user.id });

    await expect(signup("Attacker", "used@test.buildrik.local", "newpassword")).rejects.toMatchObject({
      code: "EMAIL_EXISTS",
    });

    const stillThere = await prisma.user.findUnique({ where: { id: user.id } });
    const workspaceStillThere = await prisma.workspace.findUnique({ where: { id: workspace.id } });
    const siteStillThere = await prisma.site.findUnique({ where: { id: site.id } });
    expect(stillThere).not.toBeNull();
    expect(workspaceStillThere).not.toBeNull();
    expect(siteStillThere).not.toBeNull();
  });

  it("refuses to reclaim an unverified account whose workspace has another member, even with no login", async () => {
    const owner = await createTestUser({ email: "owner@test.buildrik.local", emailVerified: null, lastLoginAt: null });
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const other = await createTestUser({ email: "other@test.buildrik.local" });
    await prisma.workspaceMember.create({
      data: { userId: other.id, workspaceId: workspace.id, role: "EDITOR" },
    });

    await expect(signup("Attacker", "owner@test.buildrik.local", "newpassword")).rejects.toMatchObject({
      code: "EMAIL_EXISTS",
    });
    expect(await prisma.user.findUnique({ where: { id: owner.id } })).not.toBeNull();
  });

  it("still reclaims a genuinely abandoned unverified row (never logged in, no site, no other member)", async () => {
    const stale = await createTestUser({ email: "typo@test.buildrik.local", emailVerified: null, lastLoginAt: null });
    const result = await signup("Real Owner", "typo@test.buildrik.local", "password");
    expect(result.user.id).not.toBe(stale.id);
    expect(await prisma.user.findUnique({ where: { id: stale.id } })).toBeNull();
  });
});

describe("acceptInvite requires a DB-verified email (S-5)", () => {
  it("FORBIDDEN when the accepting user's DB row is unverified", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const invitee = await createTestUser({ email: "invitee-fixed@test.buildrik.local", emailVerified: null });
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      invitedBy: owner.id,
      email: invitee.email,
    });

    const caller = authRouter.createCaller({
      prisma,
      session: { user: { id: invitee.id, email: invitee.email } },
      bearer: null,
      headers: undefined,
    });

    await expect(caller.acceptInvite({ token: invite.token })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(
      await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: invitee.id, workspaceId: workspace.id } },
      }),
    ).toBeNull();
  });

  it("succeeds when the accepting user's DB row is verified", async () => {
    const owner = await createTestUser();
    const workspace = await createTestWorkspace({ ownerId: owner.id });
    const invitee = await createTestUser({ email: "invitee-verified@test.buildrik.local" });
    const invite = await createTestInvite({
      workspaceId: workspace.id,
      invitedBy: owner.id,
      email: invitee.email,
    });

    const caller = authRouter.createCaller({
      prisma,
      session: { user: { id: invitee.id, email: invitee.email } },
      bearer: null,
      headers: undefined,
    });

    await expect(caller.acceptInvite({ token: invite.token })).resolves.toBeDefined();
    expect(
      await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: invitee.id, workspaceId: workspace.id } },
      }),
    ).not.toBeNull();
  });
});

describe("first-verification credential clearing (PD-5)", () => {
  it("verifyMagicLink on a never-verified row clears passwordHash/2FA and bumps sessionVersion", async () => {
    const user = await createTestUser({
      email: "magiclink-victim@test.buildrik.local",
      emailVerified: null,
      passwordHash: "$2b$10$attacker-set-hash",
      twoFactorEnabled: true,
      twoFactorSecret: "v1:fake",
      backupCodes: ["code1", "code2"],
      sessionVersion: 0,
    });
    const token = await generateToken("magic_link", user.id, 15);

    await verifyMagicLink(token);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after!.emailVerified).not.toBeNull();
    expect(after!.passwordHash).toBeNull();
    expect(after!.twoFactorEnabled).toBe(false);
    expect(after!.twoFactorSecret).toBeNull();
    expect(after!.backupCodes).toEqual([]);
    expect(after!.sessionVersion).toBe(1);
  });

  it("verifyEmail on a never-verified row KEEPS passwordHash/2FA — only marks emailVerified", async () => {
    const user = await createTestUser({
      email: "signup-owner@test.buildrik.local",
      emailVerified: null,
      passwordHash: "$2b$10$owner-set-hash",
      twoFactorEnabled: true,
      twoFactorSecret: "v1:fake",
      backupCodes: ["code1", "code2"],
      sessionVersion: 0,
    });
    const token = await generateToken("email_verify", user.id, 60 * 24);

    await verifyEmail(token);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after!.emailVerified).not.toBeNull();
    // Clicking your own signup's verification link confirms that signup —
    // it must not sign you out of the password you just set.
    expect(after!.passwordHash).toBe("$2b$10$owner-set-hash");
    expect(after!.twoFactorEnabled).toBe(true);
    expect(after!.twoFactorSecret).toBe("v1:fake");
    expect(after!.backupCodes).toEqual(["code1", "code2"]);
    expect(after!.sessionVersion).toBe(0);
  });
});

describe("signup() concurrent-signup race", () => {
  it("two concurrent signups for the same brand-new email: exactly one succeeds, the other gets EMAIL_EXISTS, no 500", async () => {
    const email = `race-${Date.now()}@test.buildrik.local`;

    const results = await Promise.allSettled([
      signup("Racer A", email, "passwordA"),
      signup("Racer B", email, "passwordB"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({ code: "EMAIL_EXISTS" });

    const rows = await prisma.user.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });

  it("two concurrent signups reclaiming the same abandoned unverified row: exactly one succeeds, no 500", async () => {
    const email = `race-reclaim-${Date.now()}@test.buildrik.local`;
    const stale = await createTestUser({ email, emailVerified: null, lastLoginAt: null });

    const results = await Promise.allSettled([
      signup("Racer A", email, "passwordA"),
      signup("Racer B", email, "passwordB"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({ code: "EMAIL_EXISTS" });

    const rows = await prisma.user.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).not.toBe(stale.id);
    expect(await prisma.user.findUnique({ where: { id: stale.id } })).toBeNull();
  });
});
