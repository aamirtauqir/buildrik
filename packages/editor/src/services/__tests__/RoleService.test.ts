/**
 * RoleService — a failed role lookup must not be remembered (DQ-012).
 *
 * `fetchMyRole` cached the promise, and the promise swallowed a rejection
 * into `null`. One network blip at load therefore left every role-gated
 * control "unknown" for the rest of the session: only a refused write
 * (`invalidateMyRole`) ever asked again.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const query = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ sites: { myRole: { query: (input: unknown) => query(input) } } }),
}));
vi.mock("../BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));

import { fetchMyRole, invalidateMyRole } from "../RoleService";

beforeEach(() => {
  invalidateMyRole();
  query.mockReset();
});

describe("fetchMyRole", () => {
  it("caches a successful answer", async () => {
    query.mockResolvedValue({ role: "EDITOR" });
    expect(await fetchMyRole()).toBe("EDITOR");
    expect(await fetchMyRole()).toBe("EDITOR");
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("reports a failed lookup as unknown, and asks again next time", async () => {
    query.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ role: "ADMIN" });
    expect(await fetchMyRole()).toBeNull();
    expect(await fetchMyRole()).toBe("ADMIN");
    expect(query).toHaveBeenCalledTimes(2);
  });
});
