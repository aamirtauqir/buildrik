import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StorageQuotaBar } from "../StorageQuotaBar";

describe("StorageQuotaBar", () => {
  // Board copy: "X of Y used" — MB-precise under a gigabyte (145:199).
  it("renders board quota copy — GB above 1 GB, MB below", () => {
    const { getByText, rerender } = render(<StorageQuotaBar used={2.4e9} total={5e9} />);
    expect(getByText(/2\.4 GB of 5 GB used/)).toBeInTheDocument();
    rerender(<StorageQuotaBar used={842e6} total={1e9} />);
    expect(getByText(/842 MB of 1 GB used/)).toBeInTheDocument();
  });

  // Board 145:199: the warn band carries the actionable exit.
  it("near-limit shows the Optimise link when wired", async () => {
    const onOptimize = vi.fn();
    const { getByTestId } = render(
      <StorageQuotaBar used={842e6} total={1e9} onOptimize={onOptimize} />,
    );
    await userEvent.setup().click(getByTestId("media-quota-optimize"));
    expect(onOptimize).toHaveBeenCalledOnce();
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

  // Board 145:250: at full there is no bar — the band carries the reason and
  // the reassurance instead ("Nothing already on your sites is affected.").
  it("exhausted replaces the track with the reason + reassurance lines", () => {
    const { container, getByText } = render(<StorageQuotaBar used={6e9} total={5e9} />);
    expect(container.querySelector(".med-quota-fill")).toBeNull();
    expect(getByText(/upload is off until you free space/)).toBeInTheDocument();
    expect(getByText("Nothing already on your sites is affected.")).toBeInTheDocument();
  });
});
