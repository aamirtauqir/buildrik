import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * startPublish — approval gate is actually enforced (integration wiring).
 *
 * The pure policy is unit-tested in publish-approval.test.ts. This proves the
 * wiring: startPublish reads workspace.editsRequireApproval + the actor's role +
 * the latest review, and THROWS an APPROVAL_* error — one per gate state, board
 * S5.4 — before queueing a job when an
 * Editor tries to publish an unapproved site. Security control → verified by
 * execution, not just typecheck.
 */

const jobFindFirst = vi.fn();
const jobUpdateMany = vi.fn();
const jobCreate = vi.fn();
const siteFindUnique = vi.fn();
const siteUpdate = vi.fn();
const workspaceFindUnique = vi.fn();
const memberFindUnique = vi.fn();
const reviewFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishBuildJob: {
      findFirst: (...a: unknown[]) => jobFindFirst(...a),
      updateMany: (...a: unknown[]) => jobUpdateMany(...a),
      create: (...a: unknown[]) => jobCreate(...a),
    },
    site: {
      findUnique: (...a: unknown[]) => siteFindUnique(...a),
      update: (...a: unknown[]) => siteUpdate(...a),
    },
    workspace: { findUnique: (...a: unknown[]) => workspaceFindUnique(...a) },
    workspaceMember: { findUnique: (...a: unknown[]) => memberFindUnique(...a) },
    reviewRequest: { findFirst: (...a: unknown[]) => reviewFindFirst(...a) },
  },
}));
vi.mock("@server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn(() => Promise.resolve()) }));
vi.mock("@/server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn(() => Promise.resolve()) }));
vi.mock("@/server/services/cms.service", () => ({ appendDynamicPagesToPublish: vi.fn((_s, p) => Promise.resolve(p)) }));
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: vi.fn(() => Promise.resolve(null)),
  markInactive: vi.fn(),
}));

import { startPublish } from "@server/services/publish.service";

function baseHappyMocks() {
  jobFindFirst.mockResolvedValue(null); // no active job
  jobUpdateMany.mockResolvedValue({ count: 0 }); // no stranded rows
  siteFindUnique.mockResolvedValue({ name: "Acme", deletedAt: null, publishedUrl: null, workspaceId: "ws-1" });
  reviewFindFirst.mockResolvedValue(null); // no review submitted
}

describe("startPublish · approval gate enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development"); // skip the Vercel-connection check
  });

  it("Editor + gate ON + never sent for review → throws APPROVAL_NONE (no job queued)", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "EDITOR" });

    await expect(startPublish("site-1", "ws-1", "user-editor")).rejects.toThrow("APPROVAL_NONE");
    expect(jobCreate).not.toHaveBeenCalled(); // gate fires before queueing
  });

  /* The gate must ask the SITE's workspace, not the caller's session one.
     `sites.publish` authorises with `checkSiteRole` (the SITE's workspace) and
     then passes `resolveWorkspaceId(ctx)` — the caller's SESSION workspace — to
     startPublish. Those legitimately differ: every signup owns a personal
     workspace, so an EDITOR on someone else's site can have their session
     resolve to their own. Reading `editsRequireApproval` off the caller's
     workspace asked the wrong one whether this site needs review, and a
     workspace with the flag OFF skipped the gate entirely — publish went out
     with no approval and no error.

     Every other test here passes "ws-1" AND mocks the site as "ws-1", so the
     two never diverge and none of them can see this. */
  it("reads the SITE's workspace, not the caller's session workspace", async () => {
    baseHappyMocks();
    // Site lives in ws-1, which DOES require approval.
    siteFindUnique.mockResolvedValue({
      name: "Acme", deletedAt: null, publishedUrl: null, workspaceId: "ws-1", lastEditedAt: null,
    });
    // Caller's session resolves to their own ws-2, which does NOT.
    workspaceFindUnique.mockImplementation((args: { where: { id: string } }) =>
      Promise.resolve({ editsRequireApproval: args.where.id === "ws-1" }),
    );
    memberFindUnique.mockResolvedValue({ role: "EDITOR" });

    await expect(startPublish("site-1", "ws-2", "user-editor")).rejects.toThrow("APPROVAL_NONE");
    expect(jobCreate).not.toHaveBeenCalled();
    // And it asked about the SITE's workspace.
    expect(workspaceFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ws-1" } }),
    );
  });

  // §13-C1: the actual bug. sites.publish already requires ADMIN+, so this is the
  // realistic actor. An Admin was previously exempt → the gate blocked nobody.
  it("Admin + gate ON + never sent for review → throws APPROVAL_NONE (no job queued) (§13-C1)", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });

    await expect(startPublish("site-1", "ws-1", "user-admin")).rejects.toThrow("APPROVAL_NONE");
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("Admin + gate ON + latest review CHANGES_REQUESTED → throws APPROVAL_CHANGES, not the same error as no review", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    reviewFindFirst.mockResolvedValue({ status: "CHANGES_REQUESTED" });

    await expect(startPublish("site-1", "ws-1", "user-admin")).rejects.toThrow("APPROVAL_CHANGES");
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("Admin + gate ON + latest review APPROVED → NOT blocked by approval", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    reviewFindFirst.mockResolvedValue({ status: "APPROVED" });
    jobCreate.mockResolvedValue({ id: "job-1" });
    siteUpdate.mockResolvedValue({});

    let approvalError = false;
    try {
      await startPublish("site-1", "ws-1", "user-admin");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("APPROVAL_")) approvalError = true;
    }
    expect(approvalError).toBe(false);
  });

  /* Revoking a review round is the product's only escape from a review nobody
     can resolve — the submitter is refused a self-resolve by design, so on a
     one-seat workspace a PENDING round is otherwise permanent. `revoke` sets
     `revokedAt`, and the gate's "latest review" query did not filter on it, so
     the revoked round kept answering for the site and publish stayed
     APPROVAL_PENDING forever. The mock filters the way Prisma would, so the
     assertion is about the query the gate actually issues. */
  const revokedAwareFindFirst = (row: Record<string, unknown>) =>
    (args: { where?: Record<string, unknown> }) =>
      Promise.resolve(args?.where?.revokedAt === null && row.revokedAt ? null : row);

  it("a revoked PENDING round stops answering for the site, so the publisher is told nobody has asked yet", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    reviewFindFirst.mockImplementation(
      revokedAwareFindFirst({ status: "PENDING", resolvedAt: null, revokedAt: new Date() })
    );

    await expect(startPublish("site-1", "ws-1", "user-admin")).rejects.toThrow("APPROVAL_NONE");
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("a revoked APPROVAL stops permitting the publish it approved", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    reviewFindFirst.mockImplementation(
      revokedAwareFindFirst({ status: "APPROVED", resolvedAt: new Date(), revokedAt: new Date() })
    );

    await expect(startPublish("site-1", "ws-1", "user-admin")).rejects.toThrow("APPROVAL_NONE");
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("an unrevoked PENDING round still blocks, so the filter did not disable the gate", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    reviewFindFirst.mockImplementation(
      revokedAwareFindFirst({ status: "PENDING", resolvedAt: null, revokedAt: null })
    );

    await expect(startPublish("site-1", "ws-1", "user-admin")).rejects.toThrow("APPROVAL_PENDING");
  });

  it("Owner + gate ON + no review → NOT blocked by approval (exempt)", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "OWNER" });
    jobCreate.mockResolvedValue({ id: "job-1" });
    siteUpdate.mockResolvedValue({});

    // Owner passes the gate; may proceed (dev simulation). Must NOT be the approval error.
    let approvalError = false;
    try {
      await startPublish("site-1", "ws-1", "user-owner");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("APPROVAL_")) approvalError = true;
    }
    expect(approvalError).toBe(false);
  });

  it("Editor + gate ON + latest review APPROVED → NOT blocked by approval", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "EDITOR" });
    reviewFindFirst.mockResolvedValue({ status: "APPROVED" });
    jobCreate.mockResolvedValue({ id: "job-1" });
    siteUpdate.mockResolvedValue({});

    let approvalError = false;
    try {
      await startPublish("site-1", "ws-1", "user-editor");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("APPROVAL_")) approvalError = true;
    }
    expect(approvalError).toBe(false);
  });

  it("gate OFF → Editor publishes without approval (no block)", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: false });
    memberFindUnique.mockResolvedValue({ role: "EDITOR" });
    jobCreate.mockResolvedValue({ id: "job-1" });
    siteUpdate.mockResolvedValue({});

    let approvalError = false;
    try {
      await startPublish("site-1", "ws-1", "user-editor");
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("APPROVAL_")) approvalError = true;
    }
    expect(approvalError).toBe(false);
  });
});
