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
const jobUpdateMany = vi.fn();
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
      updateMany: (...a: unknown[]) => jobUpdateMany(...a),
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
  /* The failure write is fire-and-forget with a `.catch` on it, so a bare
     vi.fn() returning undefined throws inside the detached promise — the
     assertions still pass and vitest reports an unhandled rejection beside a
     green suite. Resolve it, so the path under test is the real one. */
  jobUpdate.mockResolvedValue({});
  jobUpdateMany.mockResolvedValue({ count: 1 });
  process.env.CRON_SECRET = "test-secret";
  workspaceFindUnique.mockResolvedValue({ plan: "FREE" });
  jobCount.mockResolvedValue(0);
  jobCreate.mockResolvedValue({ id: "job-1" });
  siteFindFirst.mockResolvedValue(null);
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CRON_SECRET;
});

/** Every FAILED write the dispatcher made. */
const failedWrites = () =>
  jobUpdateMany.mock.calls
    .map((c) => c[0] as { where: { id: string; status?: string }; data: { status: string; error: string } })
    .filter((a) => a.data.status === "FAILED");

describe("AI worker dispatch", () => {
  it("fails the job when the worker refuses it, instead of leaving it QUEUED", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(failedWrites()).toHaveLength(1);
    expect(failedWrites()[0].where).toEqual({ id: "job-1", status: "QUEUED" });
    expect(failedWrites()[0].data.error.length).toBeGreaterThan(0);
  });

  it("fails the job when nothing answers at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(failedWrites()).toHaveLength(1);
    expect(failedWrites()[0].where).toEqual({ id: "job-1", status: "QUEUED" });
  });

  it("leaves the job alone when the worker accepts it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(failedWrites()).toHaveLength(0);
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it("leaves the job alone when the worker answers with a real error it owns", async () => {
    /* A 500 means the worker took the job and broke; it writes its own FAILED
       row with the real reason. Overwriting it here would replace a diagnosis
       with a dispatch message. */
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    /* Any failure write is guarded on QUEUED, so it can only land on a job the
       worker never claimed — never on the FAILED row the worker wrote. */
    expect(jobUpdate).not.toHaveBeenCalled();
    for (const w of failedWrites()) expect(w.where).toEqual({ id: "job-1", status: "QUEUED" });
  });

  it("fails a job the worker answered non-2xx without claiming (it would sit QUEUED forever)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Job not found or not QUEUED", { status: 400 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(failedWrites()).toHaveLength(1);
    expect(failedWrites()[0].where).toEqual({ id: "job-1", status: "QUEUED" });
  });

  it("fails fast, without dispatching, when CRON_SECRET is not configured", async () => {
    /* The worker answers 500 "CRON_SECRET is not configured" BEFORE claiming,
       and the dispatcher read every 500 as "claimed" — the job sat QUEUED, and
       the reaper that would fail it needs the same missing secret. */
    delete process.env.CRON_SECRET;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(failedWrites()).toHaveLength(1);
    expect(failedWrites()[0].data.error).toMatch(/CRON_SECRET/);
  });

  it("a dispatch timeout never fails a job the worker already claimed", async () => {
    /* The worker answers only after every page is generated; undici's 300s
       header timeout can fire first while the worker keeps running. The
       dispatcher's FAILED write is guarded on QUEUED, so a claimed job's
       status stays the worker's to set. */
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Headers Timeout Error")));
    jobUpdateMany.mockResolvedValue({ count: 0 });

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    expect(jobUpdate).not.toHaveBeenCalled();
    expect(failedWrites()).toHaveLength(1);
    expect(failedWrites()[0].where).toEqual({ id: "job-1", status: "QUEUED" });
  });
});

describe("monthly AI generation limit", () => {
  it("does not count FAILED jobs against the monthly plan slot", async () => {
    /* A missing key, a provider 5xx or a worker timeout used to burn one of
       FREE's 3 monthly generations with nothing to show for it. */
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    await createGenerationJob("ws-1", "user-1", input);
    await settle();

    const monthly = jobCount.mock.calls
      .map((c) => c[0] as { where: { status?: unknown } })
      .find((a) => a.where.status !== undefined);
    expect(monthly?.where.status).toEqual({ notIn: ["CANCELLED", "FAILED"] });
  });
});
