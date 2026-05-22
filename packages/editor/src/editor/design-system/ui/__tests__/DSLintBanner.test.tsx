import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { DSLintBanner } from "../DSLintBanner";
import type { LintIssue } from "../../../../engine/designSystem/linter";

const mixed: LintIssue[] = [
  { rule: "banned-hue", severity: "error", tokenId: "color-bad", message: "..." },
  { rule: "missing-dark", severity: "warning", tokenId: "color-text", message: "..." },
  { rule: "missing-dark", severity: "warning", tokenId: "color-muted", message: "..." },
  { rule: "pure-black", severity: "error", tokenId: "color-edge", message: "..." },
];

describe("DSLintBanner", () => {
  it("renders nothing when issues array is empty", () => {
    const { container } = render(<DSLintBanner issues={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows error+warning aggregate when both severities present", () => {
    const { getByText } = render(<DSLintBanner issues={mixed} />);
    expect(getByText("2 DS errors · 2 warnings")).toBeTruthy();
  });

  it("shows only warning aggregate when zero errors", () => {
    const issues: LintIssue[] = [
      { rule: "missing-dark", severity: "warning", tokenId: "a", message: "..." },
      { rule: "missing-dark", severity: "warning", tokenId: "b", message: "..." },
    ];
    const { getByText, getByRole } = render(<DSLintBanner issues={issues} />);
    expect(getByText("2 DS warnings")).toBeTruthy();
    // role=status (polite) for warnings; alert is reserved for errors.
    expect(getByRole("status")).toBeTruthy();
  });

  it("uses role='alert' (assertive) when errors present", () => {
    const { getByRole } = render(<DSLintBanner issues={mixed} />);
    expect(getByRole("alert")).toBeTruthy();
  });

  it("groups issue counts by rule label", () => {
    const { getByText } = render(<DSLintBanner issues={mixed} />);
    expect(getByText(/2 missing dark variant/)).toBeTruthy();
    expect(getByText(/1 banned hue/)).toBeTruthy();
    expect(getByText(/1 pure-black value/)).toBeTruthy();
  });

  it("Review all button calls onReviewAll", () => {
    const onReviewAll = vi.fn();
    const { getByText } = render(
      <DSLintBanner issues={mixed} onReviewAll={onReviewAll} />
    );
    fireEvent.click(getByText("Review all"));
    expect(onReviewAll).toHaveBeenCalled();
  });

  it("Dismiss button calls onDismiss", () => {
    const onDismiss = vi.fn();
    const { getByText } = render(
      <DSLintBanner issues={mixed} onDismiss={onDismiss} />
    );
    fireEvent.click(getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("hides action row when no callbacks supplied", () => {
    const { queryByText } = render(<DSLintBanner issues={mixed} />);
    expect(queryByText("Review all")).toBeNull();
    expect(queryByText("Dismiss")).toBeNull();
  });
});
