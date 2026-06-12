import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: { deleteMany: vi.fn() },
    invite: { updateMany: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
    site: { deleteMany: vi.fn(), update: vi.fn() },
    analyticsEvent: { deleteMany: vi.fn() },
    formSubmission: { deleteMany: vi.fn(), updateMany: vi.fn() },
    workspaceTransfer: { updateMany: vi.fn() },
    publishBuildJob: { findMany: vi.fn(), update: vi.fn() },
    rateLimitBucket: { deleteMany: vi.fn() },
    pendingUpload: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

import { prisma } from "@/lib/prisma";
import { GET as sessionCleanup } from "@/app/api/cron/session-cleanup/route";
import { GET as inviteExpiry } from "@/app/api/cron/invite-expiry/route";
import { GET as tokenCleanup } from "@/app/api/cron/token-cleanup/route";
import { GET as softDeletePurge } from "@/app/api/cron/soft-delete-purge/route";
import { GET as analyticsPurge } from "@/app/api/cron/analytics-purge/route";
import { GET as formSubmissionPurge } from "@/app/api/cron/form-submission-purge/route";
import { GET as ipAnonymization } from "@/app/api/cron/ip-anonymization/route";
import { GET as workspaceTransferExpiry } from "@/app/api/cron/workspace-transfer-expiry/route";
import { GET as publishJobCleanup } from "@/app/api/cron/publish-job-cleanup/route";

// Cast prisma to access mocked methods
const mockPrisma = prisma as typeof prisma & {
  session: { deleteMany: ReturnType<typeof vi.fn> };
  invite: { updateMany: ReturnType<typeof vi.fn> };
  verificationToken: { deleteMany: ReturnType<typeof vi.fn> };
  site: { deleteMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  analyticsEvent: { deleteMany: ReturnType<typeof vi.fn> };
  formSubmission: { deleteMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  workspaceTransfer: { updateMany: ReturnType<typeof vi.fn> };
  publishBuildJob: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeReq(path: string, authHeader?: string): NextRequest {
  return new Request(`http://localhost/api/cron/${path}`, {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("session-cleanup", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await sessionCleanup(makeReq("session-cleanup"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await sessionCleanup(makeReq("session-cleanup", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted count on success", async () => {
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 });
    const res = await sessionCleanup(makeReq("session-cleanup", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 5 });
  });

  it("calls deleteMany with expires lt now", async () => {
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
    const before = new Date();
    await sessionCleanup(makeReq("session-cleanup", "Bearer test-secret"));
    const after = new Date();
    const call = mockPrisma.session.deleteMany.mock.calls[0][0];
    expect(call.where.expires.lt).toBeInstanceOf(Date);
    expect(call.where.expires.lt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(call.where.expires.lt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe("invite-expiry", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await inviteExpiry(makeReq("invite-expiry"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await inviteExpiry(makeReq("invite-expiry", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with expired count on success", async () => {
    mockPrisma.invite.updateMany.mockResolvedValue({ count: 3 });
    const res = await inviteExpiry(makeReq("invite-expiry", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 3 });
  });

  it("calls updateMany with correct where and data", async () => {
    mockPrisma.invite.updateMany.mockResolvedValue({ count: 0 });
    await inviteExpiry(makeReq("invite-expiry", "Bearer test-secret"));
    const call = mockPrisma.invite.updateMany.mock.calls[0][0];
    expect(call.where.status).toBe("PENDING");
    expect(call.where.expiresAt.lt).toBeInstanceOf(Date);
    expect(call.data).toEqual({ status: "EXPIRED" });
  });
});

describe("token-cleanup", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await tokenCleanup(makeReq("token-cleanup"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await tokenCleanup(makeReq("token-cleanup", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted count on success", async () => {
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({ count: 10 });
    const res = await tokenCleanup(makeReq("token-cleanup", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 10 });
  });

  it("calls deleteMany with expires lt now", async () => {
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
    const before = new Date();
    await tokenCleanup(makeReq("token-cleanup", "Bearer test-secret"));
    const after = new Date();
    const call = mockPrisma.verificationToken.deleteMany.mock.calls[0][0];
    expect(call.where.expires.lt).toBeInstanceOf(Date);
    expect(call.where.expires.lt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(call.where.expires.lt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe("soft-delete-purge", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await softDeletePurge(makeReq("soft-delete-purge"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await softDeletePurge(makeReq("soft-delete-purge", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted count on success", async () => {
    mockPrisma.site.deleteMany.mockResolvedValue({ count: 2 });
    const res = await softDeletePurge(makeReq("soft-delete-purge", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 2 });
  });

  it("calls deleteMany with deletedAt not null and lt 30 days ago", async () => {
    mockPrisma.site.deleteMany.mockResolvedValue({ count: 0 });
    const before = Date.now();
    await softDeletePurge(makeReq("soft-delete-purge", "Bearer test-secret"));
    const call = mockPrisma.site.deleteMany.mock.calls[0][0];
    expect(call.where.deletedAt.not).toBeNull();
    const cutoff: Date = call.where.deletedAt.lt;
    expect(cutoff).toBeInstanceOf(Date);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(before - cutoff.getTime()).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
  });
});

describe("analytics-purge", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await analyticsPurge(makeReq("analytics-purge"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await analyticsPurge(makeReq("analytics-purge", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted count on success", async () => {
    mockPrisma.analyticsEvent.deleteMany.mockResolvedValue({ count: 100 });
    const res = await analyticsPurge(makeReq("analytics-purge", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 100 });
  });

  it("calls deleteMany with createdAt lt 30 days ago", async () => {
    mockPrisma.analyticsEvent.deleteMany.mockResolvedValue({ count: 0 });
    const before = Date.now();
    await analyticsPurge(makeReq("analytics-purge", "Bearer test-secret"));
    const call = mockPrisma.analyticsEvent.deleteMany.mock.calls[0][0];
    const cutoff: Date = call.where.createdAt.lt;
    expect(cutoff).toBeInstanceOf(Date);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(before - cutoff.getTime()).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
  });
});

describe("form-submission-purge", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await formSubmissionPurge(makeReq("form-submission-purge"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await formSubmissionPurge(makeReq("form-submission-purge", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with deleted count on success", async () => {
    mockPrisma.formSubmission.deleteMany.mockResolvedValue({ count: 50 });
    const res = await formSubmissionPurge(makeReq("form-submission-purge", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, deleted: 50 });
  });

  it("calls deleteMany with createdAt lt 365 days ago", async () => {
    mockPrisma.formSubmission.deleteMany.mockResolvedValue({ count: 0 });
    const before = Date.now();
    await formSubmissionPurge(makeReq("form-submission-purge", "Bearer test-secret"));
    const call = mockPrisma.formSubmission.deleteMany.mock.calls[0][0];
    const cutoff: Date = call.where.createdAt.lt;
    expect(cutoff).toBeInstanceOf(Date);
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    expect(before - cutoff.getTime()).toBeGreaterThanOrEqual(yearMs - 1000);
  });
});

describe("ip-anonymization", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await ipAnonymization(makeReq("ip-anonymization"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await ipAnonymization(makeReq("ip-anonymization", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with anonymized count on success", async () => {
    mockPrisma.formSubmission.updateMany.mockResolvedValue({ count: 7 });
    const res = await ipAnonymization(makeReq("ip-anonymization", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, anonymized: 7 });
  });

  it("calls updateMany with ip not null and createdAt lt 90 days ago, sets ip null", async () => {
    mockPrisma.formSubmission.updateMany.mockResolvedValue({ count: 0 });
    const before = Date.now();
    await ipAnonymization(makeReq("ip-anonymization", "Bearer test-secret"));
    const call = mockPrisma.formSubmission.updateMany.mock.calls[0][0];
    expect(call.where.ip.not).toBeNull();
    const cutoff: Date = call.where.createdAt.lt;
    expect(cutoff).toBeInstanceOf(Date);
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(before - cutoff.getTime()).toBeGreaterThanOrEqual(ninetyDaysMs - 1000);
    expect(call.data).toEqual({ ip: null });
  });
});

describe("workspace-transfer-expiry", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await workspaceTransferExpiry(makeReq("workspace-transfer-expiry"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await workspaceTransferExpiry(makeReq("workspace-transfer-expiry", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with expired count on success", async () => {
    mockPrisma.workspaceTransfer.updateMany.mockResolvedValue({ count: 1 });
    const res = await workspaceTransferExpiry(makeReq("workspace-transfer-expiry", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 1 });
  });

  it("calls updateMany with correct where and data", async () => {
    mockPrisma.workspaceTransfer.updateMany.mockResolvedValue({ count: 0 });
    await workspaceTransferExpiry(makeReq("workspace-transfer-expiry", "Bearer test-secret"));
    const call = mockPrisma.workspaceTransfer.updateMany.mock.calls[0][0];
    expect(call.where.status).toBe("PENDING");
    expect(call.where.expiresAt.lt).toBeInstanceOf(Date);
    expect(call.data).toEqual({ status: "EXPIRED" });
  });
});

describe("publish-job-cleanup", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await publishJobCleanup(makeReq("publish-job-cleanup"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await publishJobCleanup(makeReq("publish-job-cleanup", "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with cleaned count on success", async () => {
    mockPrisma.publishBuildJob.findMany.mockResolvedValue([
      { id: "j1", site: { id: "s1", status: "PUBLISHING", publishedUrl: null } },
      { id: "j2", site: { id: "s2", status: "PUBLISHED", publishedUrl: "https://x" } },
    ]);
    const res = await publishJobCleanup(makeReq("publish-job-cleanup", "Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, cleaned: 2 });
  });

  it("reaps QUEUED and BUILDING/DEPLOYING (not IN_PROGRESS) older than 1 hour", async () => {
    mockPrisma.publishBuildJob.findMany.mockResolvedValue([]);
    const before = Date.now();
    await publishJobCleanup(makeReq("publish-job-cleanup", "Bearer test-secret"));
    const call = mockPrisma.publishBuildJob.findMany.mock.calls[0][0];
    expect(call.where.OR[0].status).toBe("QUEUED");
    expect(call.where.OR[0].createdAt.lt).toBeInstanceOf(Date);
    const oneHourMs = 60 * 60 * 1000;
    expect(before - call.where.OR[0].createdAt.lt.getTime()).toBeGreaterThanOrEqual(oneHourMs - 1000);
    // The worker writes BUILDING/DEPLOYING — IN_PROGRESS never existed.
    expect(call.where.OR[1].status).toEqual({ in: ["BUILDING", "DEPLOYING"] });
    expect(call.where.OR[1].OR[0].startedAt.lt).toBeInstanceOf(Date);
    expect(before - call.where.OR[1].OR[0].startedAt.lt.getTime()).toBeGreaterThanOrEqual(oneHourMs - 1000);
    expect(call.where.OR[1].OR[1].startedAt).toBeNull();
  });

  it("fails the job and demotes a PUBLISHING site in one transaction", async () => {
    mockPrisma.publishBuildJob.findMany.mockResolvedValue([
      { id: "j1", site: { id: "s1", status: "PUBLISHING", publishedUrl: null } },
    ]);
    await publishJobCleanup(makeReq("publish-job-cleanup", "Bearer test-secret"));
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    const jobCall = mockPrisma.publishBuildJob.update.mock.calls[0][0];
    expect(jobCall.where).toEqual({ id: "j1" });
    expect(jobCall.data.status).toBe("FAILED");
    expect(jobCall.data.error).toBe("Timed out — cleaned by cron");
    const siteCall = mockPrisma.site.update.mock.calls[0][0];
    expect(siteCall.where).toEqual({ id: "s1" });
    expect(siteCall.data.status).toBe("DRAFT");
  });

  it("restores PUBLISHED when the stuck site has a live URL, leaves non-PUBLISHING sites alone", async () => {
    mockPrisma.publishBuildJob.findMany.mockResolvedValue([
      { id: "j1", site: { id: "s1", status: "PUBLISHING", publishedUrl: "https://live" } },
      { id: "j2", site: { id: "s2", status: "DRAFT", publishedUrl: null } },
    ]);
    await publishJobCleanup(makeReq("publish-job-cleanup", "Bearer test-secret"));
    expect(mockPrisma.site.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.site.update.mock.calls[0][0].data.status).toBe("PUBLISHED");
    expect(mockPrisma.publishBuildJob.update).toHaveBeenCalledTimes(2);
  });
});
