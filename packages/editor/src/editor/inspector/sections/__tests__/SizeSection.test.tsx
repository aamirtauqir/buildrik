/**
 * SizeSection — value rendering, engine writes, hidden/disabled gates,
 * advanced (min/max) disclosure.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SizeSection } from "../SizeSection";

function renderSize(props: Partial<React.ComponentProps<typeof SizeSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <SizeSection styles={{}} onChange={onChange} isOpen={true} {...props} />
  );
  return { onChange, ...utils };
}

describe("SizeSection — current values render", () => {
  it("shows width/height numeric parts in the W/H inputs", () => {
    renderSize({ styles: { width: "100px", height: "50px" } });
    const pair = screen.getByRole("group", { name: "Width and height" });
    const inputs = within(pair).getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("100");
    expect(inputs[1]).toHaveValue("50");
  });

  it("renders a collapsed preview 'W × H' when either dimension is set", () => {
    renderSize({ styles: { width: "100px", height: "50px" } });
    expect(screen.getByText("100px × 50px")).toBeInTheDocument();
  });

  it("preview falls back to 'auto' for the unset dimension", () => {
    renderSize({ styles: { width: "100px" } });
    expect(screen.getByText("100px × auto")).toBeInTheDocument();
  });
});

describe("SizeSection — engine writes", () => {
  it("editing the W input writes width with the current unit", () => {
    const { onChange } = renderSize({ styles: { width: "100px" } });
    const pair = screen.getByRole("group", { name: "Width and height" });
    const [wInput] = within(pair).getAllByRole("textbox");
    fireEvent.change(wInput, { target: { value: "200" } });
    expect(onChange).toHaveBeenCalledWith("width", "200px");
  });

  it("editing the H input writes height", () => {
    const { onChange } = renderSize({ styles: { height: "40px" } });
    const pair = screen.getByRole("group", { name: "Width and height" });
    const inputs = within(pair).getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "80" } });
    expect(onChange).toHaveBeenCalledWith("height", "80px");
  });

  it("object-fit select writes object-fit", () => {
    const { onChange, container } = renderSize();
    const selects = Array.from(container.querySelectorAll("select"));
    const objectFit = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === "cover")
    );
    expect(objectFit).toBeTruthy();
    fireEvent.change(objectFit as HTMLSelectElement, { target: { value: "cover" } });
    expect(onChange).toHaveBeenCalledWith("object-fit", "cover");
  });
});

describe("SizeSection — propertyStates gates", () => {
  it("hides the W/H pair when width+height are hidden", () => {
    renderSize({
      propertyStates: {
        width: { hidden: true },
        height: { hidden: true },
      },
    });
    expect(
      screen.queryByRole("group", { name: "Width and height" })
    ).not.toBeInTheDocument();
  });

  it("disables the W input and suppresses its token chain button when width is disabled", () => {
    renderSize({
      styles: { width: "100px" },
      propertyStates: { width: { disabled: true, reason: "Inline elements ignore width/height" } },
    });
    const pair = screen.getByRole("group", { name: "Width and height" });
    const [wInput] = within(pair).getAllByRole("textbox");
    expect(wInput).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Link width to spacing token" })
    ).not.toBeInTheDocument();
    // Height stays enabled with its chain button.
    expect(
      screen.getByRole("button", { name: "Link height to spacing token" })
    ).toBeInTheDocument();
  });

  it("hides object-fit when propertyStates marks it hidden", () => {
    const { container } = renderSize({
      propertyStates: { "object-fit": { hidden: true } },
    });
    const selects = Array.from(container.querySelectorAll("select"));
    const objectFit = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === "cover")
    );
    expect(objectFit).toBeUndefined();
  });
});

describe("SizeSection — advanced (min/max) disclosure", () => {
  it("hides min/max groups until advancedExpanded and shows a count of 5 on the toggle", () => {
    const onAdvancedToggle = vi.fn();
    renderSize({ onAdvancedToggle });
    expect(screen.queryByRole("group", { name: "Width constraints" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Height constraints" })).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "More settings" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(toggle).getByText("5")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(onAdvancedToggle).toHaveBeenCalledTimes(1);
  });

  it("shows min/max inputs when advancedExpanded and writes min-width on edit", () => {
    const { onChange } = renderSize({
      advancedExpanded: true,
      onAdvancedToggle: vi.fn(),
      styles: { "min-width": "10px" },
    });
    const widthConstraints = screen.getByRole("group", { name: "Width constraints" });
    const [minW] = within(widthConstraints).getAllByRole("textbox");
    expect(minW).toHaveValue("10");
    fireEvent.change(minW, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith("min-width", "20px");
    // Expanded toggle relabels to "Less".
    expect(screen.getByRole("button", { name: "Less" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("does not render the toggle at all when onAdvancedToggle is not wired", () => {
    renderSize();
    // onAdvancedToggle omitted → no MoreSettingsToggle
    expect(screen.queryByRole("button", { name: "More settings" })).not.toBeInTheDocument();
  });
});
