/**
 * D-1 — the worker must route its COMPLETED write through
 * `completePublish` (which retains the payload for rollback) instead of its
 * own inline transaction that nulled `log`, making every real publish
 * NOT_ROLLBACKABLE despite the service and UI already shipping rollback.
 *
 * A source scan, matching the existing style in publish-notifications.test.ts
 * for the same file — the full POST handler pulls in the Vercel deploy
 * pipeline, forms wiring and a real (2s × 5 step) simulation delay, which a
 * unit test should not need to stub end to end to prove this wiring.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const worker = readFileSync(
  join(__dirname, "../../packages/dashboard/app/api/workers/publish/[jobId]/route.ts"),
  "utf8",
);

describe("publish worker — COMPLETED write (D-1)", () => {
  it("routes the terminal success write through completePublish, not an inline transaction", () => {
    expect(worker).toMatch(/completePublish\(jobId,\s*publicUrl/);
  });

  it("no longer nulls `log` on COMPLETED itself (completePublish owns retention/pruning)", () => {
    // The FAILED path still legitimately sets log: Prisma.DbNull; only the
    // COMPLETED block must not duplicate that write any more.
    const completedBlock = worker.slice(
      worker.indexOf('status: "BUILDING"'),
      worker.indexOf("// P6 workspace webhook"),
    );
    expect(completedBlock).not.toMatch(/status:\s*"COMPLETED"[\s\S]*?log:\s*Prisma\.DbNull/);
  });
});
