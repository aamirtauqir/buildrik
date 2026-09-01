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

    /* 2 mocked findings + the default registry's two contrast findings, now
       merged into the shared result (the live 2026-08-13 find: the colour
       list said "Issues (1)" while the Lint destination said "Nothing to
       fix"). The registry lints the FULL palette; the colour list's chip
       counts only its Beginner-visible subset — superset, never contradiction.
       Two contrast findings, not four: the page colour ships under three ids
       in the default palette and comparing it to itself is not a finding.

       ZERO contrast findings as of 2026-09-02 — the two that used to be here
       were accent and success at #22C55E, 2.18 against the page, and both are
       green-700 now. So the count is the two mocked findings alone. */
    expect(queryByText("1 DS error · 1 warning")).toBeTruthy();
  });

  /* This asserted "2 DS warnings" from an empty DSLinter result, because the
     default palette carried two real WCAG failures and the banner had to say
     so — suppressing them was the original bug. The palette passes now
     (green-700), so the honest assertion is the opposite one: a fresh brand
     with nothing to report shows no banner.

     COVERAGE NOTE, stated rather than glossed: this test no longer exercises
     the contrast MERGE, because the merge's input is computed from the
     provider's palette and there is no seam here to hand it a failing one. The
     rule itself is covered directly in contrastLint.test.ts. */
  it("shows no banner when a fresh brand has nothing to report", () => {
    const composer = makeComposer([]);
    const { queryByText, container } = render(wrap(<DSLintMount composer={composer as any} />));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(queryByText(/DS warning/)).toBeNull();
    expect(container.firstChild).toBeNull();
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
