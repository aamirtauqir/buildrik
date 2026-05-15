import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TokenLintRow } from "../TokenLintRow";
import type { LintIssue } from "../../../../../engine/designSystem/LintState";

const issue: LintIssue = {
  type: "contrast",
  severity: "warn",
  message: "2.8:1 vs surface · WCAG AA needs 4.5",
  autoFixHint: "darken-22",
};

describe("TokenLintRow", () => {
  it("renders message and pill count for multiple issues", () => {
    const { getByText } = render(
      <TokenLintRow
        tokenId="color.accent.yellow"
        issues={[issue, issue, issue]}
        onAutoFix={() => {}}
        onIgnore={() => {}}
      />,
    );
    expect(getByText(/2.8:1 vs surface/i)).toBeTruthy();
    expect(getByText("3 lints")).toBeTruthy();
  });

  it("hides pill count for single issue", () => {
    const { queryByText } = render(
      <TokenLintRow
        tokenId="color.accent.yellow"
        issues={[issue]}
        onAutoFix={() => {}}
        onIgnore={() => {}}
      />,
    );
    expect(queryByText(/lints/i)).toBeNull();
  });

  it("fires Auto-fix callback with token id and hint", () => {
    const onAutoFix = vi.fn();
    const { getByText } = render(
      <TokenLintRow
        tokenId="color.accent.yellow"
        issues={[issue]}
        onAutoFix={onAutoFix}
        onIgnore={() => {}}
      />,
    );
    fireEvent.click(getByText("Auto-fix"));
    expect(onAutoFix).toHaveBeenCalledWith("color.accent.yellow", "darken-22");
  });

  it("fires Ignore callback with token id", () => {
    const onIgnore = vi.fn();
    const { getByText } = render(
      <TokenLintRow
        tokenId="color.accent.yellow"
        issues={[issue]}
        onAutoFix={() => {}}
        onIgnore={onIgnore}
      />,
    );
    fireEvent.click(getByText("Ignore"));
    expect(onIgnore).toHaveBeenCalledWith("color.accent.yellow");
  });

  it("hides Auto-fix when no autoFixHint", () => {
    const noFix: LintIssue = {
      type: "unused",
      severity: "warn",
      message: "Token unused",
    };
    const { queryByText } = render(
      <TokenLintRow
        tokenId="color.brand.spare"
        issues={[noFix]}
        onAutoFix={() => {}}
        onIgnore={() => {}}
      />,
    );
    expect(queryByText("Auto-fix")).toBeNull();
  });

  it("renders nothing when issues empty", () => {
    const { container } = render(
      <TokenLintRow
        tokenId="color.brand.spare"
        issues={[]}
        onAutoFix={() => {}}
        onIgnore={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("merges style override (gridColumn: 1 / -1) over the base amber row style", () => {
    // Spec gap fix — ColorTokenList mounts this inline inside a CSS grid
    // and needs the row to span all 6 columns. Style prop must merge,
    // not replace, so amber colors / padding stay.
    const { container } = render(
      <TokenLintRow
        tokenId="color.accent.yellow"
        issues={[issue]}
        onAutoFix={() => {}}
        onIgnore={() => {}}
        style={{ gridColumn: "1 / -1" }}
      />,
    );
    const row = container.querySelector("[data-token-lint-row]") as HTMLElement;
    expect(row).toBeTruthy();
    // gridColumn override is wired through.
    expect(row.style.gridColumn).toBe("1 / -1");
    // Base amber padding is still applied (jsdom reports as "8px 12px").
    expect(row.style.padding).toContain("8px");
  });
});
