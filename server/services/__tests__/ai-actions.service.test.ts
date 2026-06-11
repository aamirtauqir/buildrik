/**
 * Privileged-action registry. The security-critical property: execute re-checks
 * the hard role via the domain path (the confirmation token is NOT a role grant).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRoleMock = vi.fn();
const startPublishMock = vi.fn();
const resolveWorkspaceIdMock = vi.fn((..._a: unknown[]) => Promise.resolve("ws-1"));

vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  PermissionError: class extends Error {},
}));
vi.mock("@/server/services/publish.service", () => ({
  startPublish: (...a: unknown[]) => startPublishMock(...a),
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: (...a: unknown[]) => resolveWorkspaceIdMock(...a),
}));

import { getAction, isKnownAction } from "@server/services/ai-actions.service";

describe("privileged-action registry", () => {
  beforeEach(() => {
    checkSiteRoleMock.mockReset();
    startPublishMock.mockReset().mockResolvedValue({ id: "job-1" });
    resolveWorkspaceIdMock.mockClear();
  });

  it("knows site.publish and rejects unknown ids", () => {
    expect(isKnownAction("site.publish")).toBe(true);
    expect(isKnownAction("site.delete-everything")).toBe(false);
    expect(getAction("nope")).toBeUndefined();
  });

  it("describes publish as a non-undoable consequence", () => {
    const d = getAction("site.publish")!.describe({});
    expect(d.undoable).toBe(false);
    expect(d.consequence).toMatch(/cannot be undone|deploy/i);
  });

  it("execute re-checks ADMIN via checkSiteRole BEFORE publishing (token is not a role grant)", async () => {
    const ctx = { prisma: {} } as never;
    const claims = { actorId: "u1", siteId: "s1", actionId: "site.publish", argsHash: "x", exp: Date.now() + 1000 };
    await getAction("site.publish")!.execute(ctx, claims, { pages: [] });
    expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "u1", "s1", "ADMIN");
    expect(startPublishMock).toHaveBeenCalledWith("s1", "ws-1", "u1", []);
  });

  it("propagates a permission failure (does not publish)", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const ctx = { prisma: {} } as never;
    const claims = { actorId: "u1", siteId: "s1", actionId: "site.publish", argsHash: "x", exp: Date.now() + 1000 };
    await expect(
      getAction("site.publish")!.execute(ctx, claims, { pages: [] }),
    ).rejects.toThrow(/FORBIDDEN/);
    expect(startPublishMock).not.toHaveBeenCalled();
  });
});
