import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const getPublishStatusMock = vi.fn();
const assertSiteAccessMock = vi.fn();

vi.mock("@server/auth", () => ({ auth: () => authMock() }));
vi.mock("@lib/prisma", () => ({ prisma: {} }));
vi.mock("@server/services/publish.service", () => ({
  getPublishStatus: (...a: unknown[]) => getPublishStatusMock(...a),
}));
vi.mock("@server/services/permission.service", () => {
  class PermissionError extends Error {
    constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
      super(message ?? code);
      this.name = "PermissionError";
    }
  }
  return {
    PermissionError,
    assertSiteAccess: (...a: unknown[]) => assertSiteAccessMock(...a),
  };
});

import { GET } from "./route";
import { PermissionError } from "@server/services/permission.service";

function req() {
  return new Request("http://localhost/api/sse/publish/job_1", {
    headers: { accept: "text/event-stream" },
  }) as unknown as import("next/server").NextRequest;
}
const ctx = { params: Promise.resolve({ jobId: "job_1" }) };

/** Reads SSE frames off the stream until the stream closes or `count` frames arrive. */
async function readFrames(res: Response, count: number): Promise<string[]> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const frames: string[] = [];
  while (frames.length < count) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    frames.push(...parts.filter(Boolean));
  }
  await reader.cancel().catch(() => {});
  return frames;
}

describe("GET /api/sse/publish/[jobId] (S-10)", () => {
  beforeEach(() => {
    authMock.mockReset();
    getPublishStatusMock.mockReset();
    assertSiteAccessMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "u_1" } });
  });

  it("401 without a session", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await GET(req(), ctx);
    expect(res.status).toBe(401);
  });

  it("uses getPublishStatus (never the raw row) so `log` never reaches the stream", async () => {
    getPublishStatusMock.mockResolvedValueOnce({
      id: "job_1",
      siteId: "site_1",
      status: "COMPLETED",
      progress: 100,
    });
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    const res = await GET(req(), ctx);
    const frames = await readFrames(res, 1);
    expect(frames[0]).toContain("event: status");
    expect(frames[0]).not.toContain("log");
    expect(assertSiteAccessMock).toHaveBeenCalledWith(expect.anything(), "u_1", "site_1");
  });

  it("sends a Forbidden event, not the job, when assertSiteAccess denies (site-scoped + ACTIVE only, S-10)", async () => {
    getPublishStatusMock.mockResolvedValueOnce({
      id: "job_1",
      siteId: "site_1",
      status: "COMPLETED",
      progress: 100,
    });
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const res = await GET(req(), ctx);
    const frames = await readFrames(res, 1);
    expect(frames[0]).toContain("event: error");
    expect(frames[0]).toContain("Forbidden");
  });
});
