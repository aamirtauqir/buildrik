import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * startPublish — approval gate is actually enforced (integration wiring).
 *
 * The pure policy is unit-tested in publish-approval.test.ts. This proves the
 * wiring: startPublish reads workspace.editsRequireApproval + the actor's role +
 * the latest review, and THROWS "APPROVAL_REQUIRED" before queueing a job when an
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

  it("Editor + gate ON + no approved review → throws APPROVAL_REQUIRED (no job queued)", async () => {
    baseHappyMocks();
    workspaceFindUnique.mockResolvedValue({ editsRequireApproval: true });
    memberFindUnique.mockResolvedValue({ role: "EDITOR" });

    await expect(startPublish("site-1", "ws-1", "user-editor")).rejects.toThrow("APPROVAL_REQUIRED");
    expect(jobCreate).not.toHaveBeenCalled(); // gate fires before queueing
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
      if (e instanceof Error && e.message === "APPROVAL_REQUIRED") approvalError = true;
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
      if (e instanceof Error && e.message === "APPROVAL_REQUIRED") approvalError = true;
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
      if (e instanceof Error && e.message === "APPROVAL_REQUIRED") approvalError = true;
    }
    expect(approvalError).toBe(false);
  });
});
