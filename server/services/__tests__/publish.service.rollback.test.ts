/**
 * P1 — publish truth + rollback. Verifies the payload now SURVIVES a completed
 * publish (so a prior version can be re-deployed), that history reports which
 * versions are rollbackable WITHOUT leaking the HTML payload, and that a
 * rollback re-publishes a stored version as a NEW job — bypassing the approval
 * gate (an ADMIN restoring a previously-shipped version) and refusing a pruned
 * or non-completed target.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const jobFindUnique = vi.fn();
const jobFindFirst = vi.fn();
const jobFindMany = vi.fn();
const jobUpdate = vi.fn();
const jobUpdateMany = vi.fn();
const jobCreate = vi.fn();
const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();
const wsFindUnique = vi.fn();
const memberFindUnique = vi.fn();
const reviewFindFirst = vi.fn();
const txn = vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishBuildJob: {
      findUnique: (...a: unknown[]) => jobFindUnique(...a),
      findFirst: (...a: unknown[]) => jobFindFirst(...a),
      findMany: (...a: unknown[]) => jobFindMany(...a),
      update: (...a: unknown[]) => jobUpdate(...a),
      updateMany: (...a: unknown[]) => jobUpdateMany(...a),
      create: (...a: unknown[]) => jobCreate(...a),
    },
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a), update: (...a: unknown[]) => siteUpdate(...a) },
    workspace: { findUnique: (...a: unknown[]) => wsFindUnique(...a) },
    workspaceMember: { findUnique: (...a: unknown[]) => memberFindUnique(...a) },
    reviewRequest: { findFirst: (...a: unknown[]) => reviewFindFirst(...a) },
    $transaction: (ops: unknown[]) => txn(ops),
  },
}));
vi.mock("@/server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn(() => Promise.resolve()) }));
vi.mock("@/server/services/cms.service", () => ({ appendDynamicPagesToPublish: vi.fn((_s: string, p: unknown) => Promise.resolve(p)) }));
vi.mock("@server/services/integrations.service", () => ({ getActiveVercelConnection: vi.fn(() => Promise.resolve({ id: "v1" })), markInactive: vi.fn() }));
vi.mock("@/lib/vercel", () => ({ createVercelDeployment: vi.fn(), waitForDeploymentReady: vi.fn(), pickPublicUrl: vi.fn(), setProjectPasswordProtection: vi.fn(), VercelApiError: class {}, }));

import { completePublish, getPublishHistory, rollbackPublish } from "@server/services/publish.service";

beforeEach(() => {
  [jobFindUnique, jobFindFirst, jobFindMany, jobUpdate, jobUpdateMany, jobCreate, siteFindUnique, siteUpdate, wsFindUnique, memberFindUnique, reviewFindFirst].forEach((m) => m.mockReset());
  txn.mockClear();
  // dispatchWorker does a fetch — make it succeed so startPublish completes.
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
});

describe("completePublish — payload retention", () => {
  it("keeps the log payload on COMPLETED (does NOT null it) so it can be rolled back", async () => {
    jobFindUnique.mockResolvedValue({ id: "j1", siteId: "s1" });
    jobUpdate.mockResolvedValue({ id: "j1" });
    siteUpdate.mockResolvedValue({});
    jobFindMany.mockResolvedValue([]); // nothing to prune
    await completePublish("j1", "https://x.vercel.app");
    const updateArg = jobUpdate.mock.calls[0][0];
    expect(updateArg.data.status).toBe("COMPLETED");
    // the fix: log is NOT set to DbNull
    expect("log" in updateArg.data).toBe(false);
  });

  it("prunes the payload on COMPLETED jobs beyond the 20 most recent", async () => {
    jobFindUnique.mockResolvedValue({ id: "j21", siteId: "s1" });
    jobUpdate.mockResolvedValue({ id: "j21" });
    siteUpdate.mockResolvedValue({});
    // 21 completed-with-payload jobs → the oldest (beyond 20) gets its log nulled
    jobFindMany.mockResolvedValue([{ id: "old1" }]);
    await completePublish("j21", "https://x.vercel.app");
    expect(jobUpdateMany).toHaveBeenCalled();
    const pruneArg = jobUpdateMany.mock.calls.find((c) => c[0]?.data?.log !== undefined);
    expect(pruneArg?.[0].where.id.in).toContain("old1");
  });
});

describe("getPublishHistory", () => {
  it("returns versions newest-first with a rollbackable flag and NEVER the log payload", async () => {
    jobFindMany.mockResolvedValue([
      { id: "j3", completedAt: new Date("2026-07-23"), deploymentId: "d3", rolledBackFrom: null, log: { pages: [{ path: "/", html: "x" }] } },
      { id: "j2", completedAt: new Date("2026-07-22"), deploymentId: "d2", rolledBackFrom: null, log: null },
      { id: "j1", completedAt: new Date("2026-07-21"), deploymentId: "d1", rolledBackFrom: null, log: { pages: [] } },
    ]);
    const rows = await getPublishHistory("s1");
    expect(rows[0]).toMatchObject({ id: "j3", rollbackable: true, version: 3 });
    expect(rows[1]).toMatchObject({ id: "j2", rollbackable: false, version: 2 }); // pruned → not rollbackable
    expect(rows[2]).toMatchObject({ id: "j1", version: 1 });
    // the payload never leaves the service
    rows.forEach((r) => expect(r).not.toHaveProperty("log"));
  });
});

describe("rollbackPublish", () => {
  it("refuses a target that isn't found in the workspace (IDOR)", async () => {
    jobFindFirst.mockResolvedValue(null);
    await expect(rollbackPublish("ws1", "s1", "jX", "u1")).rejects.toThrow(/NOT_FOUND/);
  });

  it("refuses a non-completed target", async () => {
    jobFindFirst.mockResolvedValue({ id: "j1", status: "FAILED", log: { pages: [] } });
    await expect(rollbackPublish("ws1", "s1", "j1", "u1")).rejects.toThrow(/NOT_ROLLBACKABLE/);
  });

  it("refuses a completed target whose payload was pruned", async () => {
    jobFindFirst.mockResolvedValue({ id: "j1", status: "COMPLETED", log: null });
    await expect(rollbackPublish("ws1", "s1", "j1", "u1")).rejects.toThrow(/NOT_ROLLBACKABLE/);
  });

  it("re-publishes the stored version as a NEW job, bypassing the approval gate, tagged rolledBackFrom", async () => {
    jobFindFirst.mockResolvedValue({ id: "j1", status: "COMPLETED", log: { pages: [{ path: "/", html: "<h1>v1</h1>" }] } });
    // startPublish internals: no active job, site exists + Vercel connected
    jobFindFirst.mockResolvedValueOnce({ id: "j1", status: "COMPLETED", log: { pages: [{ path: "/", html: "<h1>v1</h1>" }] } });
    jobFindFirst.mockResolvedValue(null); // startPublish's active-job precheck → none
    jobUpdateMany.mockResolvedValue({ count: 0 });
    siteFindUnique.mockResolvedValue({ name: "Acme", deletedAt: null, publishedUrl: null, workspaceId: "ws1", lastEditedAt: new Date() });
    jobCreate.mockResolvedValue({ id: "jNew" });
    siteUpdate.mockResolvedValue({});
    await rollbackPublish("ws1", "s1", "j1", "u1");
    // a new job was created carrying the stored pages + the rollback provenance
    const createArg = jobCreate.mock.calls[0][0];
    expect(createArg.data.rolledBackFrom).toBe("j1");
    expect(createArg.data.log.pages[0].html).toContain("v1");
    // the approval gate was NOT consulted (bypassed for a rollback)
    expect(wsFindUnique).not.toHaveBeenCalled();
    expect(reviewFindFirst).not.toHaveBeenCalled();
  });
});
