import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

vi.mock("@lib/prisma", () => ({
  prisma: {
    aIGenerationJob: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    site: { create: vi.fn(), findFirst: vi.fn() },
    page: { create: vi.fn() },
  },
}));

vi.mock("@server/services/ai.service", () => ({
  generatePage: vi.fn(),
}));

import { prisma } from "@lib/prisma";
import { generatePage } from "@server/services/ai.service";
import { POST } from "@/app/api/workers/ai-generate/[jobId]/route";

const p = prisma as unknown as {
  aIGenerationJob: { findUnique: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  site: { create: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  page: { create: ReturnType<typeof vi.fn> };
};
const genPage = generatePage as ReturnType<typeof vi.fn>;

function req(secret?: string): NextRequest {
  return new Request("http://localhost/api/workers/ai-generate/j1", {
    method: "POST",
    headers: secret ? { "x-worker-secret": secret } : {},
  }) as NextRequest;
}
const ctx = { params: Promise.resolve({ jobId: "j1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "secret";
});

describe("ai-generate worker", () => {
  it("401 on wrong secret", async () => {
    const res = await POST(req("nope"), ctx);
    expect(res.status).toBe(401);
  });

  it("happy path: generates pages, creates site, marks COMPLETED", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({
      id: "j1", status: "QUEUED", workspaceId: "w1", userId: "u1",
      businessType: "BUSINESS", selectedPages: ["landing", "about"], description: "A bakery", metadata: { tone: "bold" },
    });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findFirst.mockResolvedValue(null);
    p.site.create.mockResolvedValue({ id: "site-1" });
    p.page.create.mockResolvedValue({ id: "pg" });
    p.aIGenerationJob.update.mockResolvedValue({});
    genPage.mockResolvedValue({ sections: [{ type: "hero", html: "<h1>Hi</h1>" }] });

    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(200);
    expect(genPage).toHaveBeenCalledTimes(2); // one per selected page
    expect(p.page.create).toHaveBeenCalledTimes(2);
    // bold tone → bold style passed to generatePage
    expect(genPage.mock.calls[0][0].style).toBe("bold");
    // completed
    const completed = p.aIGenerationJob.update.mock.calls.find((c) => c[0].data.status === "COMPLETED");
    expect(completed).toBeTruthy();
    expect(completed![0].data.siteId).toBe("site-1");
  });

  it("marks FAILED when generation throws", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({
      id: "j1", status: "QUEUED", workspaceId: "w1", userId: "u1",
      businessType: "BUSINESS", selectedPages: ["landing"], description: null, metadata: null,
    });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findFirst.mockResolvedValue(null);
    p.site.create.mockResolvedValue({ id: "site-1" });
    p.aIGenerationJob.update.mockResolvedValue({});
    genPage.mockRejectedValue(new Error("AI down"));

    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(500);
    const failed = p.aIGenerationJob.update.mock.calls.find((c) => c[0].data.status === "FAILED");
    expect(failed).toBeTruthy();
  });

  it("400 when job is not QUEUED", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({ id: "j1", status: "COMPLETED" });
    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(400);
  });
});
