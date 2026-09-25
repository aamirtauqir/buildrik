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
import { signup } from "@/server/services/auth.service";
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
