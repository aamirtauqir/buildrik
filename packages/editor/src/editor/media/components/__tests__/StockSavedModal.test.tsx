/**
 * StockSavedModal — Clone 3695:45573 "Stock image saved". The result of
 * `Save to library` on 3695:45569; replaces the "Saved to library ✓" toast.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { StockSavedModal } from "../StockSavedModal";

function mount(over: Partial<React.ComponentProps<typeof StockSavedModal>> = {}) {
  const props = {
    saved: { name: "restaurant-interior.jpg" },
    onClose: vi.fn(),
    onViewAsset: vi.fn(),
    ...over,
  };
  const utils = render(<StockSavedModal {...props} />);
  return { ...utils, props };
}

describe("Clone 3695:45573 · Assets · Stock image saved", () => {
  it("reads the board's copy with the real file name, and offers Done (primary) · View asset", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Stock image saved" })).toBeInTheDocument();
    expect(screen.getByTestId("stock-saved-body")).toHaveTextContent("restaurant-interior.jpg is now in your asset library.");
    expect(screen.getByTestId("stock-saved-note")).toHaveTextContent(
      "Not used on this site. Choose it from Assets when you are ready to insert or replace an image.",
    );
    const names = Array.from(screen.getByTestId("stock-saved-foot").querySelectorAll("button")).map((b) =>
      b.textContent?.trim(),
    );
    expect(names).toEqual(["Done", "View asset"]);
  });

  it("Done closes; View asset hands up and closes", () => {
    const { props } = mount();
    fireEvent.click(screen.getByTestId("stock-saved-done"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("stock-saved-view"));
    expect(props.onViewAsset).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it("renders nothing without a saved file", () => {
    mount({ saved: null });
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
