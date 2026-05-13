import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StorageQuotaBar } from "../StorageQuotaBar";

describe("StorageQuotaBar", () => {
  it("renders quota text in GB", () => {
    const { getByText } = render(<StorageQuotaBar used={2.4e9} total={5e9} />);
    expect(getByText(/2\.4 GB \/ 5 GB used/)).toBeInTheDocument();
  });

  it("renders progress bar with correct width %", () => {
    const { container } = render(<StorageQuotaBar used={1e9} total={5e9} />);
    const fill = container.querySelector(".med-quota-fill") as HTMLElement;
    expect(fill?.style.width).toBe("20%");
  });

  it("applies near-limit class at >= 80% used", () => {
    const { container } = render(<StorageQuotaBar used={4e9} total={5e9} />);
    expect(container.querySelector(".med-quota-bar--near-limit")).toBeInTheDocument();
  });

  it("applies exhausted class at >= 100% used", () => {
    const { container } = render(<StorageQuotaBar used={5e9} total={5e9} />);
    expect(container.querySelector(".med-quota-bar--exhausted")).toBeInTheDocument();
  });

  it("clamps fill width to 100% even when over total", () => {
    const { container } = render(<StorageQuotaBar used={6e9} total={5e9} />);
    const fill = container.querySelector(".med-quota-fill") as HTMLElement;
    expect(fill?.style.width).toBe("100%");
  });
});
