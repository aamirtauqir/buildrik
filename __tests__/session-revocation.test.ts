/**
 * The revocation gate. Every pre-existing test in this area asserted that
 * `session.deleteMany` was CALLED — never that a session actually ended. That
 * is exactly how "Revoke session", "Revoke all other sessions" and the
 * password-reset "signs you out everywhere" all shipped as no-ops: sessions are
 * JWT-strategy with no adapter, so the `sessions` table is a display list and
 * deleting from it leaves the cookie valid for its full 30 days.
 *
 * These tests assert the OUTCOME instead: what the jwt callback returns, which
 * is what decides whether a request is authenticated.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const userFindUnique = vi.fn();
const memberFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirst(...a) },
  },
}));

import { authConfig } from "@/server/auth.config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwtCallback = (authConfig.callbacks as any).jwt;

beforeEach(() => {
  userFindUnique.mockReset();
  memberFindFirst.mockReset();
});

describe("jwt callback — session revocation gate", () => {
  it("kills a token whose sessionVersion is behind the user's (a revocation happened)", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 1 });

    const result = await jwtCallback({ token: { userId: "u1", sv: 0 } });

    expect(result).toBeNull();
  });

  it("keeps a token whose sessionVersion matches", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 3 });

    const result = await jwtCallback({ token: { userId: "u1", sv: 3 } });

    expect(result).not.toBeNull();
    expect(result.userId).toBe("u1");
  });

  /**
   * The no-mass-logout guarantee. Cookies issued before this feature existed
   * carry no `sv` claim at all; every user row defaults to 0. Reading a missing
   * claim as 0 is what lets the fix deploy without signing everyone out.
   */
  it("keeps a pre-deploy token that carries no sv claim while the user is still at 0", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });

    const result = await jwtCallback({ token: { userId: "u1" } });

    expect(result).not.toBeNull();
  });

  /**
   * The other half of that trade, and the reason blanket-grandfathering was
   * rejected: a claim-less cookie must still die the moment its owner revokes
   * something. Otherwise a stolen pre-deploy cookie would survive the victim's
   * password reset for the full 30-day cookie life — the exact hole being fixed.
   */
  it("kills a pre-deploy token with no sv claim once the user has revoked anything", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 1 });

    const result = await jwtCallback({ token: { userId: "u1" } });

    expect(result).toBeNull();
  });

  it("kills the token when the user no longer exists", async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await jwtCallback({ token: { userId: "u1", sv: 0 } });

    expect(result).toBeNull();
  });

  /**
   * Deliberately fail OPEN. This runs on every `auth()` call, so failing closed
   * would turn a transient Postgres blip into a total auth outage for every
   * signed-in user. The accepted cost is that a revoked session survives while
   * the database is unreachable.
   */
  it("allows the request when the database read throws, rather than logging everyone out", async () => {
    userFindUnique.mockRejectedValue(new Error("connection refused"));

    const result = await jwtCallback({ token: { userId: "u1", sv: 0 } });

    expect(result).not.toBeNull();
    expect(result.userId).toBe("u1");
  });

  it("stamps the current sessionVersion onto a freshly minted OAuth token", async () => {
    memberFindFirst.mockResolvedValue({ workspaceId: "ws1" });
    // First read is the mint-time stamp, second is the gate check.
    userFindUnique.mockResolvedValueOnce({ sessionVersion: 7 }).mockResolvedValueOnce({ sessionVersion: 7 });

    const result = await jwtCallback({ token: {}, user: { id: "u1" } });

    expect(result).not.toBeNull();
    expect(result.sv).toBe(7);
  });
});
