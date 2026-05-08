import { describe, it, expect, beforeEach, vi } from "vitest";
import { MigrationManager } from "../MigrationManager";
import { EventEmitter } from "../../EventEmitter";
import type { ProjectPayload } from "../../../editor/design-system/migrations/projectMigrations";

describe("MigrationManager", () => {
  beforeEach(() => localStorage.clear());

  it("emits migration:complete with newVersion when migration runs", () => {
    const emitter = new EventEmitter();
    const onComplete = vi.fn();
    emitter.on("migration:complete", onComplete);
    const mgr = new MigrationManager(emitter);

    const result = mgr.run({
      project: { tokens: [] },
      currentVersion: 0,
      siteId: "site-1",
    });

    expect(result.newVersion).toBe(2);
    expect(onComplete).toHaveBeenCalledWith({
      siteId: "site-1",
      fromVersion: 0,
      toVersion: 2,
    });
  });

  it("emits migration:skipped when already at target", () => {
    const emitter = new EventEmitter();
    const onSkipped = vi.fn();
    emitter.on("migration:skipped", onSkipped);
    const mgr = new MigrationManager(emitter);

    mgr.run({ project: { tokens: [] }, currentVersion: 2, siteId: "site-1" });

    expect(onSkipped).toHaveBeenCalledWith({ siteId: "site-1", currentVersion: 2 });
  });

  it("emits migration:started before migration:complete", () => {
    const emitter = new EventEmitter();
    const order: string[] = [];
    emitter.on("migration:started", () => order.push("started"));
    emitter.on("migration:complete", () => order.push("complete"));
    const mgr = new MigrationManager(emitter);

    mgr.run({ project: { tokens: [] }, currentVersion: 0, siteId: "site-1" });

    expect(order).toEqual(["started", "complete"]);
  });

  it("emits migration:failed and re-throws on runner error", () => {
    const emitter = new EventEmitter();
    const onFailed = vi.fn();
    emitter.on("migration:failed", onFailed);
    const mgr = new MigrationManager(emitter);

    const failing = {
      fromVersion: 0,
      toVersion: 1,
      description: "fail",
      up: () => { throw new Error("nope"); },
      validate: () => {},
    };

    expect(() =>
      mgr.run({
        project: { tokens: [] },
        currentVersion: 0,
        siteId: "site-1",
        overrideMigrations: { 1: failing },
      })
    ).toThrow(/nope/);
    expect(onFailed).toHaveBeenCalled();
    const failArg = onFailed.mock.calls[0][0];
    expect(failArg.siteId).toBe("site-1");
    expect(failArg.fromVersion).toBe(0);
    expect(failArg.error).toMatch(/nope/);
  });

  it("does not write to document.documentElement", () => {
    const emitter = new EventEmitter();
    const mgr = new MigrationManager(emitter);
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    mgr.run({ project: { tokens: [] }, currentVersion: 0, siteId: "site-1" });
    expect(setProperty).not.toHaveBeenCalled();
    setProperty.mockRestore();
  });
});
