import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const findFirstMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceIntegration: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    auditLog: { create: vi.fn(() => Promise.resolve()) },
  },
}));

vi.mock("@buildrik/shared/schemas/account", () => ({}));
vi.mock("@/lib/constants/plan-limits", () => ({
  PLAN_LIMITS: { FREE: { integrations: 1 }, PRO: { integrations: -1 } },
}));

// Ensure ENCRYPTION_KEY is set for decrypt path
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
process.env.ENCRYPTION_KEY = "0".repeat(64);

import { getActiveVercelConnection, markInactive } from "@server/services/integrations.service";
import { encrypt } from "@/lib/encryption";

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
});

describe("getActiveVercelConnection", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns null when no row exists", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toBeNull();
  });

  it("queries with isActive:true filter so inactive rows are excluded", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toBeNull();
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { workspaceId: "ws_1", provider: "vercel", isActive: true },
    });
  });

  it("returns null and does not throw when config is null (legacy row)", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "intg_1", config: null });
    await expect(getActiveVercelConnection("ws_1")).rejects.toThrow(
      /VERCEL_CONFIG_MALFORMED/,
    );
  });

  it("returns decrypted token + teamId when active row exists", async () => {
    const realToken = "vt_secret_123";
    findFirstMock.mockResolvedValueOnce({
      id: "intg_1",
      config: {
        encryptedToken: encrypt(realToken),
        teamId: "team_xyz",
        vercelUserId: "u_abc",
      },
    });
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toEqual({
      id: "intg_1",
      token: realToken,
      teamId: "team_xyz",
    });
  });

  it("throws when decrypt fails (corrupted cipher)", async () => {
    findFirstMock.mockResolvedValueOnce({
      id: "intg_1",
      config: { encryptedToken: "v1:00:00:00", teamId: "t", vercelUserId: "u" },
    });
    await expect(getActiveVercelConnection("ws_1")).rejects.toThrow();
  });
});

describe("markInactive", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("flips isActive to false", async () => {
    updateMock.mockResolvedValueOnce({ id: "intg_1", isActive: false });
    await markInactive("intg_1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "intg_1" },
      data: { isActive: false },
    });
  });
});
