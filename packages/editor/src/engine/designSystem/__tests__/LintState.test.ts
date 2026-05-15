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
      type: "contrast",
      severity: "warn",
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
    const issue: LintIssue = { type: "contrast", severity: "warn", message: "x" };
    state.setIssues("color.accent.yellow", [issue]);
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(1);
    state.suppress("color.accent.yellow");
    expect(state.getVisibleIssues("color.accent.yellow")).toHaveLength(0);
  });

  it("emits 'lint:changed' on setIssues / suppress / unsuppress", () => {
    const handler = vi.fn();
    state.on("lint:changed", handler);
    const issue: LintIssue = { type: "contrast", severity: "warn", message: "x" };
    state.setIssues("color.a", [issue]);
    state.suppress("color.a");
    state.unsuppress("color.a");
    expect(handler).toHaveBeenCalledTimes(3);
  });
});
