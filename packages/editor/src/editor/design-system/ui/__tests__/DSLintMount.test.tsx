import { render, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { DSLintMount } from "../DSLintMount";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import type { LintIssue } from "../../linter";

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

    expect(queryByText("1 DS error · 1 warning")).toBeTruthy();
  });

  it("renders nothing when lint returns an empty list", () => {
    const composer = makeComposer([]);
    const { container } = render(wrap(<DSLintMount composer={composer as any} />));

    act(() => {
      vi.advanceTimersByTime(500);
    });

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
