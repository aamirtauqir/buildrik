/**
 * forms router — `updateBlock`'s notifyEmail ADMIN gate (fix round 2,
 * finding 1). Requiring ADMIN whenever `notifyEmail` is present in the
 * payload (rather than when it actually CHANGES) meant an EDITOR blurring
 * the field without editing it — or saving any other field bundled through
 * the same call shape — hit a FORBIDDEN for a no-op write. The gate must
 * only fire when the value differs from the stored row, normalizing "" and
 * null as the same "unset" value.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const svc = vi.hoisted(() => ({
  updateFormBlock: vi.fn(),
  getFormBlockSettings: vi.fn(),
  listFormBlocks: vi.fn(),
  listSubmissions: vi.fn(),
  updateSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  exportSubmissions: vi.fn(),
}));
const guards = vi.hoisted(() => ({ guardSiteAccess: vi.fn(), guardSiteRole: vi.fn() }));
// The router reads the stored notifyEmail through the service (keyed by
// site + element id), never through Prisma — an empty client proves it.
const prismaMock = vi.hoisted(() => ({}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/form-submission.service", () => svc);
vi.mock("@/server/trpc/guards", () => ({ guardSiteAccess: guards.guardSiteAccess, guardSiteRole: guards.guardSiteRole }));

import { formsRouter } from "@/server/trpc/routers/forms";

const caller = () =>
  formsRouter.createCaller({ session: { user: { id: "u1" } }, prisma: prismaMock } as never);

beforeEach(() => {
  Object.values(svc).forEach((m) => typeof m === "function" && "mockReset" in m && (m as any).mockReset());
  guards.guardSiteRole.mockReset().mockResolvedValue(undefined);
  svc.updateFormBlock.mockResolvedValue({ id: "f1" });
});

describe("forms.updateBlock — notifyEmail ADMIN gate", () => {
  it("blurring notifyEmail unchanged (same as the stored row) does not require ADMIN", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: "team@example.com" });
    await caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "team@example.com" });
    // guardSiteRole is called once for the base EDITOR gate — never with "ADMIN".
    expect(guards.guardSiteRole).not.toHaveBeenCalledWith(prismaMock, "u1", "s1", "ADMIN");
    expect(svc.getFormBlockSettings).toHaveBeenCalledWith("s1", "f1");
    expect(svc.updateFormBlock).toHaveBeenCalled();
  });

  it("treats an empty string the same as a null stored value — no ADMIN gate", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: null });
    await caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "" });
    expect(guards.guardSiteRole).not.toHaveBeenCalledWith(prismaMock, "u1", "s1", "ADMIN");
    expect(svc.updateFormBlock).toHaveBeenCalled();
  });

  it("an EDITOR actually changing notifyEmail is gated by ADMIN and refused", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: "team@example.com" });
    guards.guardSiteRole.mockImplementation((_p, _u, _s, minRole) => {
      if (minRole === "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      return Promise.resolve(undefined);
    });
    await expect(
      caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "new@example.com" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(svc.updateFormBlock).not.toHaveBeenCalled();
  });

  it("an ADMIN changing notifyEmail saves", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: "team@example.com" });
    await caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "new@example.com" });
    expect(guards.guardSiteRole).toHaveBeenCalledWith(prismaMock, "u1", "s1", "ADMIN");
    expect(svc.updateFormBlock).toHaveBeenCalled();
  });

  it("a brand-new row (no existing FormBlock) setting notifyEmail still requires ADMIN", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: null }); // no row yet → defaults
    await caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "new@example.com" });
    expect(guards.guardSiteRole).toHaveBeenCalledWith(prismaMock, "u1", "s1", "ADMIN");
  });

  it("reads the stored notifyEmail through the service, never through ctx.prisma directly (routers never touch Prisma)", async () => {
    svc.getFormBlockSettings.mockResolvedValue({ notifyEmail: "team@example.com" });
    await caller().updateBlock({ siteId: "s1", blockId: "f1", notifyEmail: "new@example.com" });
    expect(svc.getFormBlockSettings).toHaveBeenCalledWith("s1", "f1");
    // prismaMock is `{}` — no `formBlock` property was ever attached to it,
    // which is only possible if nothing in this call read `ctx.prisma.formBlock.*`.
    expect((prismaMock as { formBlock?: unknown }).formBlock).toBeUndefined();
  });
});
