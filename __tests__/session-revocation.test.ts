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

/**
 * Stale active workspace. `token.workspaceId` outlives its workspace when the
 * deletion cron removes it (or the membership is removed), and every layer used
 * to fall back differently: the switcher to the newest-joined membership, the
 * server resolvers to an unordered `findFirst`. The switcher showed one
 * workspace while the Delete-workspace modal targeted another. The jwt callback
 * now repairs the claim to the ONE canonical pick login already uses.
 */
describe("jwt callback — stale active workspace repair", () => {
  const CANONICAL_ORDER = [{ lastActiveAt: { sort: "desc", nulls: "last" } }, { joinedAt: "asc" }, { id: "asc" }];
  const CANONICAL_PICK_ARGS = {
    where: { userId: "u1", status: "ACTIVE" },
    orderBy: CANONICAL_ORDER,
    select: { workspaceId: true },
  };
  const claimCheckArgs = (workspaceId: string) => ({
    where: { userId: "u1", workspaceId, status: "ACTIVE" },
    select: { workspaceId: true },
  });

  /** The claim check (has `where.workspaceId`) and the canonical pick (has
   *  `orderBy`) are both `workspaceMember.findFirst`; answer each by shape. */
  function memberships(claimValid: boolean, canonical: string | null) {
    memberFindFirst.mockImplementation(async (args: { where: { workspaceId?: string } }) => {
      if (args.where.workspaceId) return claimValid ? { workspaceId: args.where.workspaceId } : null;
      return canonical ? { workspaceId: canonical } : null;
    });
  }

  it("repairs a claim whose workspace is gone to the canonical pick", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });
    memberships(false, "ws-canonical");

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-deleted" } });

    expect(result.workspaceId).toBe("ws-canonical");
    expect(memberFindFirst).toHaveBeenCalledWith(claimCheckArgs("ws-deleted"));
    expect(memberFindFirst).toHaveBeenLastCalledWith(CANONICAL_PICK_ARGS);
  });

  /**
   * Cost: this runs on every authenticated request. A nested relation select
   * inside user.findUnique is two SEQUENTIAL statements without relationJoins,
   * so the claim check is issued alongside the sessionVersion read instead.
   */
  it("issues the claim check concurrently with the sessionVersion read", async () => {
    let resolveUser: (v: { sessionVersion: number }) => void = () => {};
    userFindUnique.mockReturnValue(new Promise((r) => { resolveUser = r; }));
    memberships(true, "ws-other");

    const pending = jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-chosen" } });
    await Promise.resolve();

    expect(memberFindFirst).toHaveBeenCalledWith(claimCheckArgs("ws-chosen"));
    resolveUser({ sessionVersion: 0 });
    await pending;
    expect(userFindUnique).toHaveBeenCalledWith({ where: { id: "u1" }, select: { sessionVersion: true } });
  });

  it("leaves a still-valid claim alone, even when it is not the canonical first pick", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });
    memberships(true, "ws-other");

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-chosen" } });

    expect(result.workspaceId).toBe("ws-chosen");
    expect(memberFindFirst).toHaveBeenCalledTimes(1);
  });

  it("skips the claim check when there is no claim and takes the canonical pick", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });
    memberships(false, "ws-canonical");

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: null } });

    expect(result.workspaceId).toBe("ws-canonical");
    expect(memberFindFirst).toHaveBeenCalledTimes(1);
    expect(memberFindFirst).toHaveBeenCalledWith(CANONICAL_PICK_ARGS);
  });

  it("sets the claim to null when the user has no ACTIVE membership left", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });
    memberships(false, null);

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-deleted" } });

    expect(result).not.toBeNull();
    expect(result.workspaceId).toBeNull();
  });

  it("still kills a revoked token before touching the claim", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 1 });
    memberships(false, "ws-canonical");

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-deleted" } });

    expect(result).toBeNull();
  });

  it("fails open on a DB error without touching the claim", async () => {
    userFindUnique.mockRejectedValue(new Error("connection refused"));
    memberships(false, "ws-canonical");

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-chosen" } });

    expect(result.workspaceId).toBe("ws-chosen");
  });

  it("fails open when the claim check itself throws", async () => {
    userFindUnique.mockResolvedValue({ sessionVersion: 0 });
    memberFindFirst.mockRejectedValue(new Error("connection refused"));

    const result = await jwtCallback({ token: { userId: "u1", sv: 0, workspaceId: "ws-chosen" } });

    expect(result).not.toBeNull();
    expect(result.workspaceId).toBe("ws-chosen");
  });
});
