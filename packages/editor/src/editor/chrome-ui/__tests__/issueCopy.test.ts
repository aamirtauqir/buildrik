/**
 * issueCopy — the one source for issue-count copy (plan D14). Carried over
 * from IssueChip.test.tsx when the chip left the topbar (C3).
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { formatIssueSummary } from "../issueCopy";

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
