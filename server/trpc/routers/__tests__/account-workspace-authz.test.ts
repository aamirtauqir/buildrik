/**
 * F3 — workspace-mutation authz wiring. The OWNER/ADMIN/EDITOR/VIEWER guard
 * (checkWorkspaceRole) already existed and is proven in permission-service.test.ts;
 * these mutations just weren't calling it, so any ACTIVE member could edit workspace
 * settings/sharing or cancel a deletion. This verifies the wiring: a non-admin is
 * blocked and the service is never reached; an admin passes through.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkWorkspaceRoleMock = vi.fn();
const updateWorkspaceSettingsMock = vi.fn();
const updateSharingSettingsMock = vi.fn();
const cancelWorkspaceDeletionMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/workspace-settings.service", () => ({
  getWorkspaceSettings: vi.fn(),
  listUserWorkspaces: vi.fn(),
  deleteWorkspace: vi.fn(),
  updateWorkspaceSettings: (...a: unknown[]) => updateWorkspaceSettingsMock(...a),
  updateSharingSettings: (...a: unknown[]) => updateSharingSettingsMock(...a),
  cancelWorkspaceDeletion: (...a: unknown[]) => cancelWorkspaceDeletionMock(...a),
}));
// Passthrough schemas so input validation never masks the authz assertion.
vi.mock("@buildrik/shared/schemas/account", () => {
  const any = z.any();
  return {
    updateProfileSchema: any, changePasswordSchema: any, setPasswordSchema: any,
    changeEmailSchema: any, updateWorkspaceSchema: any, createWorkspaceSchema: any,
    workspaceSharingSettingsSchema: any, addIntegrationSchema: any, notificationPrefSchema: any,
    updatePreferencesSchema: any, deleteAccountSchema: any,
  };
});

import { accountRouter } from "@/server/trpc/routers/account";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return {
    session: { user: { id: "u_1", workspaceId: "ws_1" } },
    prisma: {
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue({ workspaceId: "ws_1", workspace: { plan: "FREE" } }),
      },
    } as never,
  };
}

beforeEach(() => {
  [checkWorkspaceRoleMock, updateWorkspaceSettingsMock, updateSharingSettingsMock, cancelWorkspaceDeletionMock].forEach(
    (m) => m.mockReset(),
  );
});

describe("account.workspace authz (F3)", () => {
  it("update: non-admin is blocked, settings service never runs", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "Insufficient permissions"));
    const caller = accountRouter.createCaller(makeCtx() as never);
    await expect(caller.workspace.update({ name: "x" })).rejects.toThrow(/permission|forbidden/i);
    expect(updateWorkspaceSettingsMock).not.toHaveBeenCalled();
    expect(checkWorkspaceRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "ws_1", "ADMIN");
  });

  it("update: admin passes through to the settings service", async () => {
    checkWorkspaceRoleMock.mockResolvedValueOnce(undefined);
    updateWorkspaceSettingsMock.mockResolvedValueOnce({ id: "ws_1" });
    const caller = accountRouter.createCaller(makeCtx() as never);
    await caller.workspace.update({ name: "x" });
    expect(updateWorkspaceSettingsMock).toHaveBeenCalledOnce();
  });

  it("sharing: non-admin is blocked, sharing service never runs", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const caller = accountRouter.createCaller(makeCtx() as never);
    await expect(caller.workspace.sharing({ requirePw: true })).rejects.toThrow();
    expect(updateSharingSettingsMock).not.toHaveBeenCalled();
  });

  it("cancelDelete: non-admin is blocked, cancel service never runs", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const caller = accountRouter.createCaller(makeCtx() as never);
    await expect(caller.workspace.cancelDelete()).rejects.toThrow();
    expect(cancelWorkspaceDeletionMock).not.toHaveBeenCalled();
  });
});
