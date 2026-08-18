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
      autoFixHint: "darken-22",
    };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getIssues("color.accent.yellow")).toEqual([issue]);
  });

  it("suppresses lint per token", () => {
    state.suppress("color.accent.yellow");
    expect(state.isSuppressed("color.accent.yellow")).toBe(true);
    expect(state.isSuppressed("color.brand.primary")).toBe(false);
  });

  it("persists suppression to localStorage", () => {
    state.suppress("color.accent.yellow");
    const next = new LintState();
    expect(next.isSuppressed("color.accent.yellow")).toBe(true);
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
  /* Suppressions persist to localStorage and the constructor reads them back,
     so a fresh instance is only fresh if the store is. */
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
});
