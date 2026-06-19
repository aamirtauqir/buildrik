/**
 * clients router (E2). Verifies the agency_layer flag gate (list → [] when off,
 * mutations → FORBIDDEN when off), Admin-gating on mutations, and that a blocked
 * call never reaches the service. The flag is the E0 runtime kill-switch: agency
 * features stay dark until it's flipped.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const isEnabledMock = vi.fn();
const checkRoleMock = vi.fn();
const listClientsMock = vi.fn();
const getClientMock = vi.fn();
const createClientMock = vi.fn();
const deleteClientMock = vi.fn();
const assignSiteMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));
vi.mock("@/server/services/feature-flag.service", () => ({
  isFeatureEnabled: (...a: unknown[]) => isEnabledMock(...a),
}));
vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: (...a: unknown[]) => checkRoleMock(...a),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.name = "PermissionError";
      this.code = code;
    }
  },
}));
vi.mock("@/server/services/clients.service", () => ({
  listClients: (...a: unknown[]) => listClientsMock(...a),
  getClient: (...a: unknown[]) => getClientMock(...a),
  createClient: (...a: unknown[]) => createClientMock(...a),
  updateClient: vi.fn(),
  deleteClient: (...a: unknown[]) => deleteClientMock(...a),
  assignSite: (...a: unknown[]) => assignSiteMock(...a),
  ClientError: class ClientError extends Error {
    code: string;
    constructor(code: string, msg?: string) {
      super(msg ?? code);
      this.code = code;
    }
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { clientsRouter } from "@/server/trpc/routers/clients";
import { PermissionError } from "@/server/services/permission.service";

function makeCtx() {
  return { session: { user: { id: "u_1" } }, prisma: {} as never };
}

beforeEach(() => {
  [isEnabledMock, checkRoleMock, listClientsMock, getClientMock, createClientMock, deleteClientMock, assignSiteMock].forEach(
    (m) => m.mockReset(),
  );
});

describe("clients router — agency_layer gate", () => {
  it("list returns [] when the flag is off (ships dark, UI collapses to flat)", async () => {
    isEnabledMock.mockResolvedValueOnce(false);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.list()).resolves.toEqual([]);
    expect(listClientsMock).not.toHaveBeenCalled();
  });

  it("list returns clients when the flag is on", async () => {
    isEnabledMock.mockResolvedValueOnce(true);
    listClientsMock.mockResolvedValueOnce([{ id: "c1", name: "Acme", siteCount: 2 }]);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.list()).resolves.toEqual([{ id: "c1", name: "Acme", siteCount: 2 }]);
  });

  it("create is FORBIDDEN when the flag is off and never reaches the service", async () => {
    isEnabledMock.mockResolvedValueOnce(false);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.create({ name: "Beta" })).rejects.toThrow(/not enabled/i);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe("clients router — Admin gate", () => {
  it("create is blocked for a non-admin (flag on) and never writes", async () => {
    isEnabledMock.mockResolvedValueOnce(true);
    checkRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN"));
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.create({ name: "Beta" })).rejects.toThrow(/ADMIN/i);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("create succeeds for an admin with the flag on", async () => {
    isEnabledMock.mockResolvedValueOnce(true);
    checkRoleMock.mockResolvedValueOnce(undefined);
    createClientMock.mockResolvedValueOnce({ id: "c2", name: "Beta" });
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.create({ name: "Beta" })).resolves.toEqual({ id: "c2", name: "Beta" });
    expect(createClientMock).toHaveBeenCalledWith("ws_1", { name: "Beta" });
  });

  it("delete returns ok for an admin with the flag on", async () => {
    isEnabledMock.mockResolvedValueOnce(true);
    checkRoleMock.mockResolvedValueOnce(undefined);
    deleteClientMock.mockResolvedValueOnce(undefined);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.delete({ id: "c1" })).resolves.toEqual({ ok: true });
    expect(deleteClientMock).toHaveBeenCalledWith("ws_1", "c1");
  });

  it("assignSite is FORBIDDEN when the flag is off and never assigns", async () => {
    isEnabledMock.mockResolvedValueOnce(false);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.assignSite({ siteId: "s1", clientId: "c1" })).rejects.toThrow(/not enabled/i);
    expect(assignSiteMock).not.toHaveBeenCalled();
  });

  it("assignSite assigns for an admin with the flag on (null unassigns)", async () => {
    isEnabledMock.mockResolvedValue(true);
    checkRoleMock.mockResolvedValue(undefined);
    assignSiteMock.mockResolvedValue(undefined);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.assignSite({ siteId: "s1", clientId: "c1" })).resolves.toEqual({ ok: true });
    expect(assignSiteMock).toHaveBeenCalledWith("ws_1", "s1", "c1");
    await expect(caller.assignSite({ siteId: "s1", clientId: null })).resolves.toEqual({ ok: true });
    expect(assignSiteMock).toHaveBeenLastCalledWith("ws_1", "s1", null);
  });
});

describe("clients router — get", () => {
  it("returns the client when flag on", async () => {
    isEnabledMock.mockResolvedValueOnce(true);
    getClientMock.mockResolvedValueOnce({ id: "c1", name: "Acme", siteCount: 3 });
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.get({ id: "c1" })).resolves.toMatchObject({ id: "c1", siteCount: 3 });
  });

  it("get is FORBIDDEN when the flag is off", async () => {
    isEnabledMock.mockResolvedValueOnce(false);
    const caller = clientsRouter.createCaller(makeCtx() as never);
    await expect(caller.get({ id: "c1" })).rejects.toThrow(/not enabled/i);
    expect(getClientMock).not.toHaveBeenCalled();
  });
});
