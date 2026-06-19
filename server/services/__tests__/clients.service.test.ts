/**
 * Agency Client service (E2). Verifies workspace-scoped reads (site-count shape),
 * create defaulting, and the IDOR guard: update/delete first confirm the client
 * belongs to the caller's workspace, else throw NOT_FOUND — never touching a
 * client in another workspace via a crafted id.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const clientFindMany = vi.fn();
const clientFindFirst = vi.fn();
const clientCreate = vi.fn();
const clientUpdate = vi.fn();
const clientDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findMany: (...a: unknown[]) => clientFindMany(...a),
      findFirst: (...a: unknown[]) => clientFindFirst(...a),
      create: (...a: unknown[]) => clientCreate(...a),
      update: (...a: unknown[]) => clientUpdate(...a),
      delete: (...a: unknown[]) => clientDelete(...a),
    },
  },
}));

import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  ClientError,
} from "@server/services/clients.service";

beforeEach(() => {
  [clientFindMany, clientFindFirst, clientCreate, clientUpdate, clientDelete].forEach((m) =>
    m.mockReset(),
  );
});

describe("listClients", () => {
  it("flattens _count.sites into siteCount, scoped to the workspace", async () => {
    clientFindMany.mockResolvedValueOnce([
      { id: "c1", name: "Acme", logoUrl: null, brandColor: null, customDomain: null, hideBuildrik: false, _count: { sites: 3 } },
    ]);
    const out = await listClients("ws-1");
    expect(out).toEqual([
      { id: "c1", name: "Acme", logoUrl: null, brandColor: null, customDomain: null, hideBuildrik: false, siteCount: 3 },
    ]);
    expect(clientFindMany.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1" });
  });
});

describe("createClient", () => {
  it("defaults branding fields and binds the resolved workspaceId", async () => {
    clientCreate.mockResolvedValueOnce({ id: "c2" });
    await createClient("ws-1", { name: "Beta" });
    expect(clientCreate).toHaveBeenCalledWith({
      data: { workspaceId: "ws-1", name: "Beta", logoUrl: null, brandColor: null, customDomain: null, hideBuildrik: false },
    });
  });
});

describe("updateClient / deleteClient IDOR guard", () => {
  it("updates when the client is in the workspace", async () => {
    clientFindFirst.mockResolvedValueOnce({ id: "c1" });
    clientUpdate.mockResolvedValueOnce({ id: "c1", name: "Renamed" });
    await updateClient("ws-1", { id: "c1", name: "Renamed" });
    expect(clientFindFirst).toHaveBeenCalledWith({ where: { id: "c1", workspaceId: "ws-1" }, select: { id: true } });
    expect(clientUpdate).toHaveBeenCalledWith({ where: { id: "c1" }, data: { name: "Renamed" } });
  });

  it("throws NOT_FOUND and never updates a client from another workspace", async () => {
    clientFindFirst.mockResolvedValueOnce(null);
    await expect(updateClient("ws-1", { id: "other-ws-client", name: "Hijack" })).rejects.toBeInstanceOf(
      ClientError,
    );
    expect(clientUpdate).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND and never deletes a client from another workspace", async () => {
    clientFindFirst.mockResolvedValueOnce(null);
    await expect(deleteClient("ws-1", "other-ws-client")).rejects.toBeInstanceOf(ClientError);
    expect(clientDelete).not.toHaveBeenCalled();
  });
});
