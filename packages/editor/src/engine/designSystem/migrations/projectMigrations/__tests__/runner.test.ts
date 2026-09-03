import { describe, it, expect, beforeEach, vi } from "vitest";
import { runProjectMigrations } from "../runner";
/* The target is read, never retyped: these assertions are about "the chain
   ran to completion", not about the number 2. Hardcoding it meant every new
   migration broke six unrelated tests (0003 did). */
import { TARGET_PROJECT_VERSION } from "../index";
import type { ProjectPayload } from "../types";

const SITE_ID = "site-alpha";
const SNAPSHOT_KEY = `ds-migration-backup-${SITE_ID}`;
const MARKER_KEY = `ds-migration-in-progress-${SITE_ID}`;

const v0Payload: ProjectPayload = { tokens: [] };

describe("runProjectMigrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns same payload + same version when fromVersion >= TARGET_PROJECT_VERSION", () => {
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: TARGET_PROJECT_VERSION,
      siteId: SITE_ID,
    });
    expect(result.project).toBe(v0Payload);
    expect(result.newVersion).toBe(TARGET_PROJECT_VERSION);
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it("applies every migration and returns the target version when fromVersion=0", () => {
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: 0,
      siteId: SITE_ID,
    });
    expect(result.newVersion).toBe(TARGET_PROJECT_VERSION);
    expect(result.project.tokens.length).toBeGreaterThanOrEqual(18);
  });

  it("clears snapshot + marker on success", () => {
    runProjectMigrations({ project: v0Payload, currentVersion: 0, siteId: SITE_ID });
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  it("on migration failure: rolls back to snapshot, throws, leaves marker for resume", () => {
    const failingMigration = {
      fromVersion: 0,
      toVersion: 1,
      description: "fail",
      up: () => { throw new Error("boom"); },
      validate: () => {},
    };
    expect(() =>
      runProjectMigrations({
        project: v0Payload,
        currentVersion: 0,
        siteId: SITE_ID,
        overrideMigrations: { 1: failingMigration },
      })
    ).toThrow(/boom/);
    expect(JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!)).toEqual(v0Payload);
    expect(localStorage.getItem(MARKER_KEY)).toBe("0");
  });

  it("on validate failure: same rollback semantics", () => {
    const badMigration = {
      fromVersion: 0,
      toVersion: 1,
      description: "validate fails",
      up: (p: ProjectPayload) => p,
      validate: () => { throw new Error("validate-failed"); },
    };
    expect(() =>
      runProjectMigrations({
        project: v0Payload,
        currentVersion: 0,
        siteId: SITE_ID,
        overrideMigrations: { 1: badMigration },
      })
    ).toThrow(/validate-failed/);
    expect(JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!)).toEqual(v0Payload);
    expect(localStorage.getItem(MARKER_KEY)).toBe("0");
  });

  it("crash-resume: marker present at start with same fromVersion → continues without re-snapshotting", () => {
    localStorage.setItem(MARKER_KEY, "0");
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(v0Payload));
    const result = runProjectMigrations({
      project: v0Payload,
      currentVersion: 0,
      siteId: SITE_ID,
    });
    expect(result.newVersion).toBe(TARGET_PROJECT_VERSION);
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
  });

  it("does NOT touch document.documentElement (no parallel writers)", () => {
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    runProjectMigrations({ project: v0Payload, currentVersion: 0, siteId: SITE_ID });
    expect(setProperty).not.toHaveBeenCalled();
    setProperty.mockRestore();
  });
});
