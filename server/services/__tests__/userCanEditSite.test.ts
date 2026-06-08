/**
 * userCanEditSite — editor-mount auth gate.
 *
 * Edit access requires EDITOR role (not mere membership), so the function
 * delegates to checkSiteRole(..., "EDITOR"): resolve => true, PermissionError
 * => false, any other error (DB outage) propagates rather than being swallowed
 * as "no access".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { checkSiteRoleMock, FakePermissionError } = vi.hoisted(() => {
  class FakePermissionError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message ?? code);
      this.code = code;
      this.name = "PermissionError";
    }
  }
  return { checkSiteRoleMock: vi.fn(), FakePermissionError };
});

vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...args: unknown[]) => checkSiteRoleMock(...args),
  PermissionError: FakePermissionError,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/email.service", () => ({ sendSiteTransferredEmail: vi.fn() }));
vi.mock("@/lib/constants/plan-limits", () => ({ PLAN_LIMITS: {} }));
vi.mock("@buildrik/shared/schemas/sites", () => ({}));

import { userCanEditSite } from "@server/services/sites.service";

describe("userCanEditSite", () => {
  beforeEach(() => {
    checkSiteRoleMock.mockReset();
  });

  it("returns true when the user has EDITOR role on the site", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    await expect(userCanEditSite("user-1", "site-1")).resolves.toBe(true);
    expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "user-1", "site-1", "EDITOR");
  });

  it("returns false when the role check fails (VIEWER / non-member)", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new FakePermissionError("FORBIDDEN"));
    await expect(userCanEditSite("viewer", "site-1")).resolves.toBe(false);
  });

  it("propagates non-permission errors (no swallow)", async () => {
    checkSiteRoleMock.mockRejectedValueOnce(new Error("DB down"));
    await expect(userCanEditSite("u", "s")).rejects.toThrow("DB down");
  });
});
