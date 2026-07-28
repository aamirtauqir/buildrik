/**
 * PositionControls — position-mode buttons, offset inputs gated on a non-static
 * position, z-index row, disabled/reason plumbing, and Mixed badges.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PositionControls } from "../PositionControls";

type Props = React.ComponentProps<typeof PositionControls>;

function renderPos(props: Partial<Props> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <PositionControls styles={{}} onChange={onChange} {...props} />
  );
  return { onChange, ...utils };
}

describe("PositionControls — mode selection", () => {
  it("hides offset controls while position is static (default)", () => {
    renderPos();
    expect(screen.queryByPlaceholderText("top")).not.toBeInTheDocument();
  });

  it("clicking a position button writes position", () => {
    const { onChange } = renderPos();
    fireEvent.click(screen.getByRole("button", { name: /Positioned relative to nearest parent/ }));
    expect(onChange).toHaveBeenCalledWith("position", "absolute");
  });

  it("marks the active position button aria-pressed", () => {
    renderPos({ styles: { position: "fixed" } });
    expect(
      screen.getByRole("button", { name: /Pinned to the viewport/ })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("reveals offset + z-index controls once position is non-static", () => {
    renderPos({ styles: { position: "absolute" } });
    expect(screen.getByPlaceholderText("top")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("left")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("right")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("bottom")).toBeInTheDocument();
  });
});

describe("PositionControls — offsets + z-index", () => {
  it("editing an offset writes that longhand", () => {
    const { onChange } = renderPos({ styles: { position: "relative", top: "5px" } });
    fireEvent.change(screen.getByPlaceholderText("top"), { target: { value: "12px" } });
    expect(onChange).toHaveBeenCalledWith("top", "12px");
  });

  it("z-index edit calls onChange('z-index', ...)", () => {
    const { onChange, container } = renderPos({ styles: { position: "absolute" } });
    const zInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(zInput, { target: { value: "10" } });
    expect(onChange).toHaveBeenCalledWith("z-index", "10");
  });

  it("disables an offset input and surfaces its reason as a title", () => {
    renderPos({
      styles: { position: "absolute" },
      propertyStates: { top: { disabled: true, reason: "top is locked" } },
    });
    const topInput = screen.getByPlaceholderText("top") as HTMLInputElement;
    expect(topInput).toBeDisabled();
    expect(topInput).toHaveAttribute("title", "top is locked");
  });
});

describe("PositionControls — multi-select mixed badges", () => {
  it("shows a Mixed badge when position differs across selection", () => {
    renderPos({ styles: { position: "absolute" }, mixedKeys: new Set(["position"]) });
    expect(screen.getAllByLabelText("Mixed value").length).toBeGreaterThan(0);
  });

  it("shows a Mixed badge for a differing offset key", () => {
    renderPos({ styles: { position: "absolute" }, mixedKeys: new Set(["left"]) });
    expect(screen.getAllByLabelText("Mixed value").length).toBeGreaterThan(0);
  });
});
