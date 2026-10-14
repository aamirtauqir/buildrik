/**
 * PositionControls — position-mode buttons, offset inputs gated on a non-static
 * position, z-index row, disabled/reason plumbing, and Mixed from the field context.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PositionControls } from "../PositionControls";
import { InspectorFieldContext, type InspectorFieldContextValue } from "@/editor/inspector/shared/controls/InspectorFieldContext";

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

  /* Board 7058:78647: "Position [Static ▾]" — one select. */
  it("choosing a position writes position", () => {
    const { onChange } = renderPos();
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("static");
    fireEvent.change(select, { target: { value: "absolute" } });
    expect(onChange).toHaveBeenCalledWith("position", "absolute");
  });

  it("the select shows the current position", () => {
    renderPos({ styles: { position: "fixed" } });
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("fixed");
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

describe("PositionControls — Mixed across a multi-selection (field context)", () => {
  const mixed = (keys: string[]): InspectorFieldContextValue => ({
    readOnly: false,
    readOnlyReason: null,
    mixedKeys: new Set(keys),
    overrides: new Map(),
    overrideLabels: {},
    resetOverride: () => undefined,
  });

  it("the Position select reads Mixed when position differs", () => {
    render(
      <InspectorFieldContext.Provider value={mixed(["position"])}>
        <PositionControls styles={{ position: "absolute" }} onChange={vi.fn()} />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.getByRole("combobox", { name: "Position, Mixed values" })).toBeInTheDocument();
  });

  it("a differing offset marks the offset group Mixed", () => {
    render(
      <InspectorFieldContext.Provider value={mixed(["left"])}>
        <PositionControls styles={{ position: "absolute" }} onChange={vi.fn()} />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.getByText("Mixed")).toBeInTheDocument();
  });
});
