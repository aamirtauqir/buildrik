import { describe, it, expect, vi } from "vitest";
// @ts-expect-error — plain .mjs operator script, no type declarations
import { main } from "../scripts/brand/rollback-migration.mjs";

const makeSvc = () => ({
  rollbackTokenMigration: vi.fn(async () => ({ restoredVersion: 5 })),
  clearTokenMigrationHold: vi.fn(async () => undefined),
  getLatestMigrationSnapshot: vi.fn(async () => ({
    id: "snap1",
    createdAt: new Date("2026-10-05T10:00:00Z"),
    tokensSchemaVersion: 5,
    tokenCount: 12,
  })),
});
const makeLog = () => ({ log: vi.fn(), error: vi.fn() });

describe("rollback-migration script", () => {
  it("refuses to run without a siteId and touches nothing", async () => {
    const svc = makeSvc();
    const log = makeLog();
    expect(await main([], async () => svc, log)).toBe(2);
    expect(await main(["--clear"], async () => svc, log)).toBe(2);
    expect(await main(["s", "--bogus"], async () => svc, log)).toBe(2);
    expect(svc.rollbackTokenMigration).not.toHaveBeenCalled();
    expect(svc.clearTokenMigrationHold).not.toHaveBeenCalled();
  });

  it("rolls back and says what it did", async () => {
    const svc = makeSvc();
    const log = makeLog();
    expect(await main(["site-1"], async () => svc, log)).toBe(0);
    expect(svc.rollbackTokenMigration).toHaveBeenCalledWith("site-1");
    expect(log.log).toHaveBeenCalledWith("rolled back site-1 to tokens v5; hold set");
  });

  it("--clear clears the hold only", async () => {
    const svc = makeSvc();
    const log = makeLog();
    expect(await main(["site-1", "--clear"], async () => svc, log)).toBe(0);
    expect(svc.clearTokenMigrationHold).toHaveBeenCalledWith("site-1");
    expect(svc.rollbackTokenMigration).not.toHaveBeenCalled();
  });

  it("--dry-run prints the newest snapshot and writes nothing", async () => {
    const svc = makeSvc();
    const log = makeLog();
    expect(await main(["site-1", "--dry-run"], async () => svc, log)).toBe(0);
    const out = String(log.log.mock.calls[0][0]);
    expect(out).toContain("snap1");
    expect(out).toContain("2026-10-05T10:00:00.000Z");
    expect(out).toContain("v5");
    expect(out).toContain("12 tokens");
    expect(svc.rollbackTokenMigration).not.toHaveBeenCalled();
    expect(svc.clearTokenMigrationHold).not.toHaveBeenCalled();
  });

  it("--dry-run with no snapshot exits 1", async () => {
    const svc = makeSvc();
    svc.getLatestMigrationSnapshot.mockResolvedValueOnce(null as never);
    expect(await main(["site-1", "--dry-run"], async () => svc, makeLog())).toBe(1);
  });

  it("reports a service failure as one line, exit 1, no stack", async () => {
    const svc = makeSvc();
    svc.rollbackTokenMigration.mockRejectedValueOnce(new Error("No migration snapshot for this site"));
    const log = makeLog();
    expect(await main(["site-1"], async () => svc, log)).toBe(1);
    expect(log.error).toHaveBeenCalledWith("No migration snapshot for this site");
  });
});
