/**
 * The signIn callback
 * (server/auth.config.ts) must resolve identity by the physical provider
 * link (Account.provider_providerAccountId) BEFORE any email-based
 * branching. Scenario: user A signed up via GitHub with verified a@x, then
 * changed their GitHub account's verified email to b@x. The old
 * email-first ordering would find no row for b@x, create a SECOND
 * "verified" user + workspace, and only then hit the ownership guard —
 * orphaning A's real account permanently. This proves, against real
 * Postgres: A logs back in as A, no new user row, no new workspace, A's
 * credentials untouched.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// signIn's currentSessionUserId() reads next/headers' cookies() — not
// available outside a request context. No self-link scenario is exercised
// here, so a no-cookie response is enough.
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/server/auth.config";
import {
  createTestUser,
  createTestWorkspace,
  createTestWorkspaceMember,
  createTestAccount,
  truncateTables,
} from "./helpers";

beforeEach(async () => {
  await truncateTables("account", "workspaceMember", "workspace", "user");
});

describe("signIn callback — account-first identity resolution against real Postgres", () => {
  it("A's GitHub email changes to b@x on next login: signs in as A, no new user, no new workspace, A's credentials untouched", async () => {
    const userA = await createTestUser({
      email: "a@x.example.com",
      passwordHash: "$2b$10$as-set-by-A",
      sessionVersion: 0,
    });
    const workspace = await createTestWorkspace({ ownerId: userA.id });
    await createTestWorkspaceMember({ userId: userA.id, workspaceId: workspace.id, role: "OWNER" });
    await createTestAccount({ userId: userA.id, provider: "github", providerAccountId: "gh-physical-id" });

    const userCountBefore = await prisma.user.count();
    const workspaceCountBefore = await prisma.workspace.count();

    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "b@x.example.com" } as any; // GitHub now reports a DIFFERENT verified email
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-physical-id" } as any,
      profile: { email: "b@x.example.com" } as any, // as GitHub's own userinfo override would resolve it
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    // Signed in as the LINKED user A, not an email-matched lookup for b@x.
    expect(userObj.id).toBe(userA.id);

    // No orphaned second user/workspace for the new email.
    expect(await prisma.user.count()).toBe(userCountBefore);
    expect(await prisma.workspace.count()).toBe(workspaceCountBefore);
    expect(await prisma.user.findUnique({ where: { email: "b@x.example.com" } })).toBeNull();

    // "Bump nothing else": A's own row is completely untouched.
    const aAfter = await prisma.user.findUnique({ where: { id: userA.id } });
    expect(aAfter!.passwordHash).toBe("$2b$10$as-set-by-A");
    expect(aAfter!.sessionVersion).toBe(0);
    expect(aAfter!.email).toBe("a@x.example.com"); // not overwritten with b@x either
  });

  it("first-time GitHub login (no existing link) still creates a user + workspace normally", async () => {
    const signInCallback = authConfig.callbacks!.signIn!;
    const userObj = { id: "temp", email: "brand-new@example.com", name: "Brand New" } as any;
    const result = await signInCallback({
      user: userObj,
      account: { provider: "github", type: "oauth", providerAccountId: "gh-fresh-id" } as any,
      profile: { email: "brand-new@example.com" } as any,
      credentials: undefined as any,
    } as any);

    expect(result).toBe(true);
    expect(userObj.id).not.toBe("temp");
    const created = await prisma.user.findUnique({ where: { email: "brand-new@example.com" } });
    expect(created).not.toBeNull();
    expect(created!.id).toBe(userObj.id);
    const link = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "github", providerAccountId: "gh-fresh-id" } },
    });
    expect(link?.userId).toBe(userObj.id);
  });
});
