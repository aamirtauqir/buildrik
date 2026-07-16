/**
 * FlexboxSection — enable-flex prompt, container controls (direction, wrap,
 * align-content), flex-item controls, disabled gates, collapsed preview.
 *
 * DOM notes (verified against the real render):
 *  - The align-content row shares its short button labels ("bet", "aro",
 *    "sta"…) with the justify-content / align-items rows in AlignmentSection,
 *    so those names are AMBIGUOUS globally. We scope to the "A-Cont" row via
 *    the row's <label> before querying its buttons.
 *  - Direction button "Column" and wrap button "wrap" are globally unique.
 *  - Flex-item numeric inputs (Grow/Shrink/Order) are role=spinbutton in DOM
 *    order Grow(0), Shrink(1), Order(2); Basis is a textbox.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FlexboxSection } from "../index";

function renderFlex(props: Partial<React.ComponentProps<typeof FlexboxSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <FlexboxSection styles={{}} onChange={onChange} isOpen={true} {...props} />
  );
  return { onChange, ...utils };
}

/** The A-Cont row = the div that directly contains the "A-Cont" label. */
function aContentRow(): HTMLElement {
  const label = screen.getByText("A-Cont");
  return label.closest("div") as HTMLElement;
}

describe("FlexboxSection — enable-flex prompt", () => {
  it("shows the Enable Flex prompt when the element is not a flex container", () => {
    const { onChange } = renderFlex();
    fireEvent.click(screen.getByRole("button", { name: "Enable Flex" }));
    expect(onChange).toHaveBeenCalledWith("display", "flex");
  });

  it("hides container controls (direction) when not a flex container", () => {
    renderFlex();
    expect(screen.queryByText("Flex Direction")).not.toBeInTheDocument();
  });
});

describe("FlexboxSection — container controls", () => {
  const flexStyles = { display: "flex" };

  it("direction button writes flex-direction", () => {
    const { onChange } = renderFlex({ styles: flexStyles });
    fireEvent.click(screen.getByRole("button", { name: "Column" }));
    expect(onChange).toHaveBeenCalledWith("flex-direction", "column");
  });

  it("wrap button writes flex-wrap", () => {
    const { onChange } = renderFlex({ styles: flexStyles });
    fireEvent.click(screen.getByRole("button", { name: "wrap" }));
    expect(onChange).toHaveBeenCalledWith("flex-wrap", "wrap");
  });

  it("align-content 'bet' (scoped to A-Cont row) writes space-between", () => {
    const { onChange } = renderFlex({ styles: flexStyles });
    const betBtn = within(aContentRow()).getByRole("button", { name: "bet" });
    fireEvent.click(betBtn);
    expect(onChange).toHaveBeenCalledWith("align-content", "space-between");
  });

  it("renders a 'row · center' preview from direction + justify", () => {
    renderFlex({ styles: { display: "flex", "justify-content": "center" } });
    expect(screen.getByText("row · center")).toBeInTheDocument();
  });

  it("no Enable Flex prompt once the element is a flex container", () => {
    renderFlex({ styles: flexStyles });
    expect(screen.queryByRole("button", { name: "Enable Flex" })).not.toBeInTheDocument();
  });
});

describe("FlexboxSection — flex item controls", () => {
  it("renders item controls when isFlexItem and writes flex-grow", () => {
    const { onChange } = renderFlex({ isFlexItem: true });
    expect(screen.getByText("Flex Item (Self)")).toBeInTheDocument();
    const spinners = screen.getAllByRole("spinbutton");
    fireEvent.change(spinners[0], { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("flex-grow", "2");
  });

  it("shows current flex-grow value", () => {
    renderFlex({ isFlexItem: true, styles: { "flex-grow": "3" } });
    expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(3);
  });

  it("disables item inputs via propertyStates", () => {
    renderFlex({
      isFlexItem: true,
      propertyStates: {
        "flex-grow": { disabled: true, reason: "Applies only to flex items" },
      },
    });
    expect(screen.getAllByRole("spinbutton")[0]).toBeDisabled();
  });

  it("hides item controls when the element is not a flex item", () => {
    renderFlex();
    expect(screen.queryByText("Flex Item (Self)")).not.toBeInTheDocument();
  });
});
