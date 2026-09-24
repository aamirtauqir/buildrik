/**
 * getEditorAccess — what the /edit/:id route renders.
 *
 * EDITOR/DESIGNER+ → "edit"; VIEWER → "view" (read-only editor, owner ruling
 * 2026-09-24 — it used to 404); PermissionError (non-member, out of site
 * scope) → null → 404; any other error (DB outage) propagates rather than
 * being swallowed as "no access".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { roleMock, FakePermissionError } = vi.hoisted(() => {
  class FakePermissionError extends Error {
    code: string;
    constructor(code: string, message?: string) {
      super(message ?? code);
      this.code = code;
      this.name = "PermissionError";
    }
  }
  return { roleMock: vi.fn(), FakePermissionError };
});

vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: vi.fn(),
  getEffectiveSiteRole: (...args: unknown[]) => roleMock(...args),
  PermissionError: FakePermissionError,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/email.service", () => ({ sendSiteTransferredEmail: vi.fn() }));
vi.mock("@/lib/constants/plan-limits", () => ({ PLAN_LIMITS: {} }));
vi.mock("@buildrik/shared/schemas/sites", () => ({}));

import { getEditorAccess } from "@server/services/sites.service";

describe("getEditorAccess", () => {
  beforeEach(() => {
    roleMock.mockReset();
  });

  it.each(["EDITOR", "DESIGNER", "ADMIN", "OWNER"])("%s → edit", async (role) => {
    roleMock.mockResolvedValueOnce(role);
    await expect(getEditorAccess("user-1", "site-1")).resolves.toBe("edit");
    expect(roleMock).toHaveBeenCalledWith(expect.anything(), "user-1", "site-1");
  });

  it("VIEWER (incl. a per-site VIEWER override) → view", async () => {
    roleMock.mockResolvedValueOnce("VIEWER");
    await expect(getEditorAccess("viewer", "site-1")).resolves.toBe("view");
  });

  it("non-member / out of site scope → null", async () => {
    roleMock.mockRejectedValueOnce(new FakePermissionError("FORBIDDEN"));
    await expect(getEditorAccess("stranger", "site-1")).resolves.toBeNull();
  });

  it("propagates non-permission errors (no swallow)", async () => {
    roleMock.mockRejectedValueOnce(new Error("DB down"));
    await expect(getEditorAccess("u", "s")).rejects.toThrow("DB down");
  });
});
