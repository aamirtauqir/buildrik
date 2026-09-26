/**
 * acceptInvite's two FORBIDDEN refusals carry distinguishable reasons.
 *
 * Dashboard verify pass 3 (7b-UI): an unverified invitee (PD-5 — accepting
 * needs a verified email) clicked Accept and was told "This invite is for
 * another email … sent to unverified@verify.local", their own address. Both
 * refusals were bare FORBIDDEN, and the invite page mapped every FORBIDDEN to
 * the wrong-account screen. The cause now says which one it is.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }), headers: () => Promise.resolve(new Headers()) }));
vi.mock("@/server/services/rate-limiter", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })), peekRateLimit: vi.fn(() => ({ allowed: true })) }));
vi.mock("@/server/services/audit.service", () => ({ logAuditEvent: vi.fn() }));

import { authRouter } from "@/server/trpc/routers/auth";

const invite = {
  id: "i1", token: "tok", status: "PENDING", email: "invitee@x.test", role: "EDITOR",
  workspaceId: "w1", invitedBy: "u0", siteIds: [], expiresAt: new Date(Date.now() + 86_400_000),
  workspace: { name: "Agency WS" },
};

function caller(opts: { email: string; verified: boolean }) {
  const prisma = {
    invite: { findUnique: vi.fn().mockResolvedValue(invite) },
    user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: opts.verified ? new Date() : null }) },
    workspaceMember: { findUnique: vi.fn().mockResolvedValue(null) },
  };
  return authRouter.createCaller({
    prisma,
    session: { user: { id: "u1", email: opts.email } },
    headers: new Headers(),
    bearer: null,
  } as never);
}

describe("auth.acceptInvite — FORBIDDEN reasons", () => {
  it("an unverified invitee is refused with reason EMAIL_UNVERIFIED", async () => {
    const err = await caller({ email: "invitee@x.test", verified: false }).acceptInvite({ token: "tok" }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect((err as { cause?: Record<string, unknown> }).cause).toMatchObject({ reason: "EMAIL_UNVERIFIED" });
  });

  it("a verified account with another email is refused with reason EMAIL_MISMATCH", async () => {
    const err = await caller({ email: "someone@else.test", verified: true }).acceptInvite({ token: "tok" }).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect((err as { cause?: Record<string, unknown> }).cause).toMatchObject({ reason: "EMAIL_MISMATCH" });
  });
});
