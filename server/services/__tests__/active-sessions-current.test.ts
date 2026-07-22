/**
 * Regression: getActiveSessions must flag the caller's own session (by the DB
 * session id carried in the JWT `sid` claim) and never leak the internal token
 * column (M18, app-audit 2026-07-22). "Revoke all others" and the "Current"
 * badge depend on isCurrent; the old code returned no such flag, so both were
 * dead, and the user could revoke their own live session.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const sessionFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { session: { findMany: (...a: unknown[]) => sessionFindMany(...a) } },
}));

import { getActiveSessions } from "@/server/services/account.service";

beforeEach(() => sessionFindMany.mockReset());

describe("getActiveSessions", () => {
  it("flags the row whose id matches the current session id and hides sessionToken", async () => {
    sessionFindMany.mockResolvedValueOnce([
      { id: "s_current", sessionToken: "tok1", device: "mac", ip: "1.1.1.1" },
      { id: "s_other", sessionToken: "tok2", device: "ios", ip: "2.2.2.2" },
    ]);
    const rows = await getActiveSessions("u_1", "s_current");
    expect(rows.find((r) => r.id === "s_current")?.isCurrent).toBe(true);
    expect(rows.find((r) => r.id === "s_other")?.isCurrent).toBe(false);
    // sessionToken must never reach the client.
    expect(rows.every((r) => !("sessionToken" in r))).toBe(true);
  });

  it("flags nothing when no current session id is supplied", async () => {
    sessionFindMany.mockResolvedValueOnce([{ id: "s_1", sessionToken: "tok1" }]);
    const rows = await getActiveSessions("u_1");
    expect(rows[0].isCurrent).toBe(false);
  });
});
