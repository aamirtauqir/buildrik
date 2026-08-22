/**
 * A worker that refuses the job must not leave it QUEUED forever.
 *
 * `dispatchAIWorker` fired the request and ignored the response. A 401 — which
 * is what the worker returns when `CRON_SECRET` is missing or wrong, and the
 * dispatch sends `process.env.CRON_SECRET ?? ""` — is a SUCCESSFUL fetch, so
 * the `catch` never ran and nothing recorded that the job would never start.
 * The row stayed QUEUED and the onboarding screen span on a job no worker had
 * accepted.
 *
 * The publish dispatcher already had this right (`publish.service.ts:175`
 * treats 401/404 as not-claimed). This is the same rule for the AI path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const jobCreate = vi.fn();
const jobUpdate = vi.fn();
const jobCount = vi.fn();
const workspaceFindUnique = vi.fn();
const siteFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { findUnique: (...a: unknown[]) => workspaceFindUnique(...a) },
    site: { findFirst: (...a: unknown[]) => siteFindFirst(...a) },
    aIGenerationJob: {
      create: (...a: unknown[]) => jobCreate(...a),
      update: (...a: unknown[]) => jobUpdate(...a),
      count: (...a: unknown[]) => jobCount(...a),
    },
  },
}));

import { createGenerationJob } from "@/server/services/ai-generation.service";

const input = {
  name: "Acme",
  businessType: "BUSINESS",
  pages: ["home"],
  description: "a site",
} as never;

/** The dispatch is fired with `void`, so let its microtasks land. */
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  workspaceFindUnique.mockResolvedValue({ plan: "FREE" });
  jobCount.mockResolvedValue(0);
  jobCreate.mockResolvedValue({ id: "job-1" });
  siteFindFirst.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllGlobals());

describe("AI worker dispatch", () => {
  it("fails the job when the worker refuses it, instead of leaving it QUEUED", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job-1" },
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
    const written = jobUpdate.mock.calls[0][0].data.error as string;
    expect(written.length).toBeGreaterThan(0);
  });

  it("fails the job when nothing answers at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) })
    );
  });

  it("leaves the job alone when the worker accepts it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it("leaves the job alone when the worker answers with a real error it owns", async () => {
    /* A 500 means the worker took the job and broke; it writes its own FAILED
       row with the real reason. Overwriting it here would replace a diagnosis
       with a dispatch message. */
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(jobUpdate).not.toHaveBeenCalled();
  });
});
