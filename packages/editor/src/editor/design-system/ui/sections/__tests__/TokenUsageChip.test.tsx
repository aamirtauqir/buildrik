import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { TokenUsageChip } from "../TokenUsageChip";

describe("TokenUsageChip", () => {
  it("renders 'used Nx' for count > 0", () => {
    const { getByText } = render(<TokenUsageChip count={23} />);
    expect(getByText("used 23×")).toBeTruthy();
  });

  it("renders 'unused' for count 0", () => {
    const { getByText } = render(<TokenUsageChip count={0} />);
    expect(getByText("unused")).toBeTruthy();
  });

  it("renders 'used 1×' for count 1 (no pluralization edge case)", () => {
    const { getByText } = render(<TokenUsageChip count={1} />);
    expect(getByText("used 1×")).toBeTruthy();
  });
});
