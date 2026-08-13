import { render, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { DSLintMount } from "../DSLintMount";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import type { LintIssue } from "../../../../engine/designSystem/linter";

function wrap(children: React.ReactNode, projectId = "ds-lint-mount-test") {
  return <TokenRegistryProvider projectId={projectId}>{children}</TokenRegistryProvider>;
}

function makeComposer(issues: LintIssue[] = []) {
  return {
    dsLinter: { lint: vi.fn(() => issues) },
  };
}

describe("DSLintMount", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when composer is null", () => {
    const { container } = render(wrap(<DSLintMount composer={null} />));
    expect(container.firstChild).toBeNull();
  });

  it("calls composer.dsLinter.lint after the 500ms debounce", () => {
    const composer = makeComposer();
    render(wrap(<DSLintMount composer={composer as any} />));

    expect(composer.dsLinter.lint).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(composer.dsLinter.lint).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(composer.dsLinter.lint).toHaveBeenCalledTimes(1);
  });

  it("renders DSLintBanner when issues are returned", () => {
    const issues: LintIssue[] = [
      { rule: "banned-hue", severity: "error", tokenId: "color-bad", message: "..." },
      { rule: "missing-dark", severity: "warning", tokenId: "color-text", message: "..." },
    ];
    const composer = makeComposer(issues);
    const { queryByText } = render(wrap(<DSLintMount composer={composer as any} />));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    /* 2 mocked findings + the default registry's four contrast findings, now
       merged into the shared result (the live 2026-08-13 find: the colour
       list said "Issues (1)" while the Lint destination said "Nothing to
       fix"). The registry lints the FULL palette; the colour list's chip
       counts only its Beginner-visible subset — superset, never contradiction. */
    expect(queryByText("1 DS error · 5 warnings")).toBeTruthy();
  });

  /* Renamed from "renders nothing when lint returns an empty list": with
     contrast merged, an empty DSLinter result no longer means a clean brand —
     the default palette carries one WCAG failure and the banner must say so.
     Suppressing it was the bug. */
  it("surfaces contrast findings even when DSLinter returns nothing", () => {
    const composer = makeComposer([]);
    const { queryByText } = render(wrap(<DSLintMount composer={composer as any} />));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(queryByText("4 DS warnings")).toBeTruthy();
  });


  it("hides the banner after the dismiss button is clicked", () => {
    const issues: LintIssue[] = [
      { rule: "banned-hue", severity: "error", tokenId: "x", message: "..." },
    ];
    const composer = makeComposer(issues);
    const { container, getByText } = render(wrap(<DSLintMount composer={composer as any} />));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(getByText("Dismiss"));
    expect(container.firstChild).toBeNull();
  });

  it("forwards onReviewAll to the banner", () => {
    const issues: LintIssue[] = [
      { rule: "pure-black", severity: "error", tokenId: "y", message: "..." },
    ];
    const composer = makeComposer(issues);
    const onReviewAll = vi.fn();
    const { getByText } = render(
      wrap(<DSLintMount composer={composer as any} onReviewAll={onReviewAll} />)
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(getByText("Review all"));
    expect(onReviewAll).toHaveBeenCalled();
  });
});
