/**
 * IssueChip — contract tests (plan D6/D14/F25; Figma node pending T1).
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueChip, formatIssueSummary } from "../index";

describe("formatIssueSummary — the ONE source for issue-count copy (D14)", () => {
  it("zero is calm", () => {
    expect(formatIssueSummary(0, 0)).toBe("No issues");
  });
  it("warnings only", () => {
    expect(formatIssueSummary(0, 2)).toBe("2 issues · 2 warnings — review before publish");
  });
  it("errors only", () => {
    expect(formatIssueSummary(3, 0)).toBe("3 issues · 3 errors — review before publish");
  });
  it("mixed counts never mislabel — the old code called this '3 errors'", () => {
    expect(formatIssueSummary(1, 2)).toBe("3 issues · 1 error, 2 warnings — review before publish");
  });
  it("singulars read like sentences", () => {
    expect(formatIssueSummary(1, 0)).toBe("1 issue · 1 error — review before publish");
  });
});

describe("IssueChip", () => {
  it("zero renders the neutral all-clear anchor, still a door to the panel (D6)", () => {
    const onClick = vi.fn();
    render(<IssueChip errors={0} warnings={0} onClick={onClick} />);
    const chip = screen.getByRole("button", { name: "No issues" });
    expect(chip.textContent).toBe(""); // no count at zero
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalled();
  });

  it("warnings-only: total count, warning severity in the accessible name", () => {
    render(<IssueChip errors={0} warnings={2} />);
    const chip = screen.getByRole("button", { name: "2 issues, 2 warnings" });
    expect(chip.textContent).toBe("2");
    expect(chip.className).toContain("bk-issuechip--warning");
  });

  it("errors win the tone even among warnings (D14)", () => {
    render(<IssueChip errors={1} warnings={2} />);
    const chip = screen.getByRole("button", { name: "3 issues, 1 error" });
    expect(chip.textContent).toBe("3");
    expect(chip.className).toContain("bk-issuechip--error");
  });

  it("caps the display at 99+ without lying in the tooltip", () => {
    render(<IssueChip errors={150} warnings={0} />);
    const chip = screen.getByRole("button", { name: "150 issues, 150 errors" });
    expect(chip.textContent).toBe("99+");
    expect(chip.getAttribute("title")).toContain("150 issues");
  });

  it("readOnlyReason labels the door shut for viewers (eng D12)", () => {
    render(<IssueChip errors={0} warnings={1} readOnlyReason="ask an editor to fix these" />);
    expect(
      screen.getByRole("button", { name: "1 issue, 1 warning — ask an editor to fix these" }),
    ).toBeTruthy();
  });
});
