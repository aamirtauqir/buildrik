/**
 * LintSection — the Lint destination (M5).
 *
 * The load-bearing assertion here is the negative one: the board draws `Fix ›`
 * links, and `DSLinter.lint()` returns no suggested replacement, so no Fix
 * affordance may ship. A test that only checked the rows would let a future
 * change quietly add a button that cannot work.
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { LintSection } from "../LintSection";
import type { LintIssue } from "../../../../../engine/designSystem/linter";

const warn: LintIssue = {
  rule: "missing-dark",
  severity: "warning",
  tokenId: "brand/accent-soft",
  message: "No dark variant",
};

const err: LintIssue = {
  rule: "banned-hue",
  severity: "error",
  tokenId: "brand/violet",
  message: "Banned hue #7C3AED",
};

describe("LintSection", () => {
  it("says nothing is wrong rather than rendering an empty list", () => {
    const { getByText, container } = render(<LintSection issues={[]} />);
    expect(getByText("Nothing to fix")).toBeTruthy();
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("renders one row per finding, with its rule and token", () => {
    const { container, getByText } = render(<LintSection issues={[warn, err]} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(getByText("Banned hue #7C3AED")).toBeTruthy();
    expect(getByText(/No dark variant · brand\/accent-soft/)).toBeTruthy();
  });

  it("sorts errors above warnings", () => {
    const { container } = render(<LintSection issues={[warn, err]} />);
    const rows = Array.from(container.querySelectorAll("li"));
    expect(rows[0].textContent).toContain("Banned hue");
    expect(rows[1].textContent).toContain("No dark variant");
  });

  it("offers no Fix affordance, because the linter suggests no replacement", () => {
    const { container, queryByText } = render(<LintSection issues={[warn, err]} />);
    expect(queryByText(/^Fix/)).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(queryByText(/Auto-fix isn't available yet/)).toBeTruthy();
  });

  it("keys rows by rule AND token so one token can hold two findings", () => {
    const second: LintIssue = { ...warn, rule: "pure-black", message: "Pure black" };
    const { container } = render(<LintSection issues={[warn, second]} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
});
