import { describe, it, expect, beforeEach, vi } from "vitest";
import { LintState, type LintIssue } from "../LintState";

describe("LintState", () => {
  let state: LintState;
  beforeEach(() => {
    localStorage.clear();
    state = new LintState();
  });

  it("returns empty issues for unknown token", () => {
    expect(state.getIssues("color.foo")).toEqual([]);
  });

  it("stores and reads issues", () => {
    const issue: LintIssue = {
      type: "banned-hue",
      severity: "warning",
      message: "2.8:1 vs surface",
      autoFixHint: "contrast:#FFFFFF",
    };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getIssues("color.accent.yellow")).toEqual([issue]);
  });

  it("suppresses lint per token", () => {
    state.suppress("color.accent.yellow");
    expect(state.isSuppressed("color.accent.yellow")).toBe(true);
    expect(state.isSuppressed("color.brand.primary")).toBe(false);
  });

  it("persists suppression per site", () => {
    state.setSite("site-a");
    state.suppress("color.accent.yellow");
    const sameSite = new LintState();
    sameSite.setSite("site-a");
    expect(sameSite.isSuppressed("color.accent.yellow")).toBe(true);
  });

  it("does not leak an Ignore to another site (B-1)", () => {
    state.setSite("site-a");
    state.suppress("color.accent.yellow");
    const other = new LintState();
    other.setSite("site-b");
    expect(other.isSuppressed("color.accent.yellow")).toBe(false);
    state.setSite("site-b");
    expect(state.isSuppressed("color.accent.yellow")).toBe(false);
  });

  it("drops the old global list instead of applying it to a site", () => {
    localStorage.setItem("buildrik:ds:lintSuppressions", JSON.stringify(["color.accent.yellow"]));
    state.setSite("site-a");
    expect(state.isSuppressed("color.accent.yellow")).toBe(false);
    expect(localStorage.getItem("buildrik:ds:lintSuppressions")).toBeNull();
  });

  it("keeps suppressions in memory only until a site is set", () => {
    state.suppress("color.accent.yellow");
    expect(state.isSuppressed("color.accent.yellow")).toBe(true);
    expect(localStorage.length).toBe(0);
  });

  it("returns visible issues (excludes suppressed)", () => {
    const issue: LintIssue = { type: "banned-hue", severity: "warning", message: "x" };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(1);
    state.suppress("color.accent.yellow");
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(0);
  });

  it("emits 'lint:changed' on setIssues / suppress / unsuppress", () => {
    const handler = vi.fn();
    state.on("lint:changed", handler);
    const issue: LintIssue = { type: "banned-hue", severity: "warning", message: "x" };
    state.setIssues("color.a", [issue]);
    state.suppress("color.a");
    state.unsuppress("color.a");
    expect(handler).toHaveBeenCalledTimes(3);
  });
});

/* Board 306:2217 draws a "Warnings suppressed" pill on the Brand root, and
   nothing could answer it — suppression was reachable and then invisible. */
describe("LintState — how many tokens are hiding their warnings", () => {
  /* Suppressions persist to localStorage per site; keep the store clean. */
  beforeEach(() => localStorage.clear());

  it("counts nothing when nothing is suppressed", () => {
    expect(new LintState().suppressedCount()).toBe(0);
  });

  it("counts each suppressed token once", () => {
    const s = new LintState();
    s.suppress("color-accent");
    s.suppress("color-accent");
    s.suppress("color-success");
    expect(s.suppressedCount()).toBe(2);
  });

  it("drops back as they are unsuppressed", () => {
    const s = new LintState();
    s.suppress("color-accent");
    s.unsuppress("color-accent");
    expect(s.suppressedCount()).toBe(0);
  });

  it("suppressedIds lists the token ids, not just the count — the Issues panel restore row needs the ids", () => {
    const s = new LintState();
    s.suppress("color-accent");
    s.suppress("color-success");
    expect([...s.suppressedIds()].sort()).toEqual(["color-accent", "color-success"]);
    s.unsuppress("color-accent");
    expect(s.suppressedIds()).toEqual(["color-success"]);
  });
});
