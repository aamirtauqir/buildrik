import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

// Transaction-client mock (worker writes site+pages+job flip atomically)
const txSiteCreate = vi.fn();
const txPageCreateMany = vi.fn();
const txJobUpdateMany = vi.fn();
const txClient = {
  site: { create: txSiteCreate },
  page: { createMany: txPageCreateMany },
  aIGenerationJob: { updateMany: txJobUpdateMany },
};

vi.mock("@lib/prisma", () => ({
  prisma: {
    aIGenerationJob: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    site: { findMany: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
  },
}));

vi.mock("@server/services/ai.service", () => ({
  generatePage: vi.fn(),
}));

import { prisma } from "@lib/prisma";
import { generatePage } from "@server/services/ai.service";
import { POST } from "@/app/api/workers/ai-generate/[jobId]/route";

const p = prisma as unknown as {
  aIGenerationJob: { findUnique: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  site: { findMany: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
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

  it("happy path: generates pages, creates site+pages in one transaction, marks COMPLETED", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({
      id: "j1", status: "QUEUED", workspaceId: "w1", userId: "u1",
      businessType: "BUSINESS", selectedPages: ["landing", "about"], description: "A bakery", metadata: { tone: "bold" },
    });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findMany.mockResolvedValue([]);
    txSiteCreate.mockResolvedValue({ id: "site-1" });
    txPageCreateMany.mockResolvedValue({ count: 2 });
    txJobUpdateMany.mockResolvedValue({ count: 1 });
    genPage.mockResolvedValue({ sections: [{ type: "hero", html: "<h1>Hi</h1>" }] });

    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(200);
    expect(genPage).toHaveBeenCalledTimes(2); // one per selected page
    // bold tone → bold style passed to generatePage
    expect(genPage.mock.calls[0][0].style).toBe("bold");
    // ...and the tone itself travels on its own field. This handoff had no
    // coverage: removing `tone: safeTone` from the worker left all five worker
    // tests green while the model stopped hearing the answer.
    expect(genPage.mock.calls[0][0].tone).toBe("bold");

    // claim writes the wizard's first real status, not BUILDING
    const claim = p.aIGenerationJob.updateMany.mock.calls[0][0];
    expect(claim.data.status).toBe("GENERATING_STRUCTURE");
    // progress phases the wizard checklist expects
    const statuses = p.aIGenerationJob.updateMany.mock.calls.map((c) => c[0].data.status);
    expect(statuses).toContain("GENERATING_CONTENT");
    expect(statuses).toContain("GENERATING_STYLES");

    // site + pages + COMPLETED flip all ride the same transaction
    expect(p.$transaction).toHaveBeenCalledTimes(1);
    expect(txPageCreateMany.mock.calls[0][0].data).toHaveLength(2);
    const completed = txJobUpdateMany.mock.calls[0][0];
    expect(completed.data.status).toBe("COMPLETED");
    expect(completed.data.siteId).toBe("site-1");
    // a CANCELLED job must not be overwritten by COMPLETED
    expect(completed.where.status).toEqual({ not: "CANCELLED" });
  });

  /**
   * The regression, at the seam it happened. `style` has three values, the job's
   * tone has six. professional, casual, creative and playful have no style to
   * collapse onto, so they all became "modern" and the model could not tell them
   * apart. Style still collapses — that is correct for a visual axis — but tone
   * now rides its own field.
   */
  it("forwards a tone the 3-value style cannot express", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({
      id: "j2", status: "QUEUED", workspaceId: "w1", userId: "u1",
      businessType: "BUSINESS", selectedPages: ["landing"], description: "A bakery",
      metadata: { tone: "playful" },
    });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findMany.mockResolvedValue([]);
    txSiteCreate.mockResolvedValue({ id: "site-2" });
    txPageCreateMany.mockResolvedValue({ count: 1 });
    txJobUpdateMany.mockResolvedValue({ count: 1 });
    genPage.mockResolvedValue({ sections: [{ type: "hero", html: "<h1>Hi</h1>" }] });

    await POST(req("secret"), ctx);

    const arg = genPage.mock.calls[0][0];
    expect(arg.tone).toBe("playful");
    // Style still falls back — "playful" names no visual treatment.
    expect(arg.style).toBe("modern");
  });

  it("marks FAILED when generation throws, without creating any site", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({
      id: "j1", status: "QUEUED", workspaceId: "w1", userId: "u1",
      businessType: "BUSINESS", selectedPages: ["landing"], description: null, metadata: null,
    });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findMany.mockResolvedValue([]);
    genPage.mockRejectedValue(new Error("AI down"));

    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(500);
    expect(p.$transaction).not.toHaveBeenCalled();
    const failed = p.aIGenerationJob.updateMany.mock.calls.find((c) => c[0].data.status === "FAILED");
    expect(failed).toBeTruthy();
    expect(failed![0].where.status).toEqual({ not: "CANCELLED" });
  });

  it("aborts cleanly mid-generation when the job is cancelled", async () => {
    p.aIGenerationJob.findUnique
      .mockResolvedValueOnce({
        id: "j1", status: "QUEUED", workspaceId: "w1", userId: "u1",
        businessType: "BUSINESS", selectedPages: ["landing", "about"], description: null, metadata: null,
      })
      // assertNotCancelled before page 1
      .mockResolvedValueOnce({ status: "GENERATING_CONTENT" })
      // assertNotCancelled before page 2 — user cancelled
      .mockResolvedValueOnce({ status: "CANCELLED" });
    p.aIGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    p.site.findMany.mockResolvedValue([]);
    genPage.mockResolvedValue({ sections: [{ type: "hero", html: "<h1>Hi</h1>" }] });

    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(200); // cancelled, not an error
    expect(genPage).toHaveBeenCalledTimes(1); // second page never generated
    expect(p.$transaction).not.toHaveBeenCalled(); // no site row for cancelled job
    // FAILED must not stomp the CANCELLED status
    const failed = p.aIGenerationJob.updateMany.mock.calls.find((c) => c[0].data?.status === "FAILED");
    expect(failed).toBeFalsy();
  });

  it("400 when job is not QUEUED", async () => {
    p.aIGenerationJob.findUnique.mockResolvedValue({ id: "j1", status: "COMPLETED" });
    const res = await POST(req("secret"), ctx);
    expect(res.status).toBe(400);
  });
});
