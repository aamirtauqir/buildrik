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

  it("applies used variant class for count > 0", () => {
    const { container } = render(<TokenUsageChip count={5} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.className).toContain("ds-token-usage-chip--used");
  });

  it("applies unused variant class for count 0", () => {
    const { container } = render(<TokenUsageChip count={0} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.className).toContain("ds-token-usage-chip--unused");
  });
});
