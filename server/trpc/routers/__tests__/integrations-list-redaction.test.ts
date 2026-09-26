/**
 * account.integrations.list redacts secrets/webhook paths for a non-admin,
 * and returns the full config to an ADMIN who can also edit it (S-10).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkWorkspaceRoleMock = vi.fn();
const listIntegrationsMock = vi.fn();
const memberFindFirstMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/integrations.service", () => ({
  listIntegrations: (...a: unknown[]) => listIntegrationsMock(...a),
  addIntegration: vi.fn(), removeIntegration: vi.fn(), updateIntegration: vi.fn(),
  sendIntegrationTestEvent: vi.fn(),
}));

import { accountRouter } from "@/server/trpc/routers/account";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return {
    session: { user: { id: "u_1", workspaceId: "ws_1" } },
    prisma: { workspaceMember: { findFirst: (...a: unknown[]) => memberFindFirstMock(...a) } } as never,
  };
}

beforeEach(() => {
  [checkWorkspaceRoleMock, listIntegrationsMock, memberFindFirstMock].forEach((m) => m.mockReset());
  memberFindFirstMock.mockResolvedValue({ workspaceId: "ws_1", workspace: { plan: "PRO" } });
});

describe("account.integrations.list — redaction by role (S-10)", () => {
  it("passes revealFullConfig=false for a non-admin member", async () => {
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    listIntegrationsMock.mockResolvedValueOnce([]);
    const caller = accountRouter.createCaller(makeCtx() as never);
    await caller.integrations.list();
    expect(listIntegrationsMock).toHaveBeenCalledWith("ws_1", false);
  });

  it("passes revealFullConfig=true for an ADMIN", async () => {
    checkWorkspaceRoleMock.mockResolvedValueOnce(undefined);
    listIntegrationsMock.mockResolvedValueOnce([]);
    const caller = accountRouter.createCaller(makeCtx() as never);
    await caller.integrations.list();
    expect(listIntegrationsMock).toHaveBeenCalledWith("ws_1", true);
  });
});
