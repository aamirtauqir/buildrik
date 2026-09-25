/**
 * LayoutSection (index) — collapsed preview string + advanced disclosure of the
 * Overflow / Visibility groups behind the MoreSettingsToggle.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LayoutSection } from "../index";

type Props = React.ComponentProps<typeof LayoutSection>;

function renderLayout(props: Partial<Props> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <LayoutSection styles={{}} onChange={onChange} isOpen={true} {...props} />
  );
  return { onChange, ...utils };
}

describe("LayoutSection — collapsed preview", () => {
  it("combines display and a non-static position", () => {
    renderLayout({ isOpen: false, styles: { display: "flex", position: "absolute" } });
    expect(screen.getByText("flex · absolute")).toBeInTheDocument();
  });

  it("omits a static position from the preview", () => {
    renderLayout({ isOpen: false, styles: { display: "block", position: "static" } });
    expect(screen.getByText("block")).toBeInTheDocument();
    expect(screen.queryByText(/static/)).not.toBeInTheDocument();
  });
});

describe("LayoutSection — advanced disclosure", () => {
  it("hides Position / Overflow / Visibility groups until advancedExpanded", () => {
    renderLayout({ onAdvancedToggle: vi.fn() });
    expect(screen.queryByText("Position")).not.toBeInTheDocument();
    expect(screen.queryByText("Overflow")).not.toBeInTheDocument();
    expect(screen.queryByText("Visibility & Float")).not.toBeInTheDocument();
  });

  /* Board 7058:78647: expanded, the block is the Position row; Overflow and
     Visibility & Float wait behind their own "Overflow & visibility" toggle. */
  it("expanded shows Position; Overflow + Visibility & Float one click further", () => {
    renderLayout({ advancedExpanded: true, onAdvancedToggle: vi.fn() });
    expect(screen.getByRole("combobox", { name: /Position/ })).toBeInTheDocument();
    expect(screen.queryByText("Visibility & Float")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Overflow & visibility" }));
    expect(screen.getByText("Overflow")).toBeInTheDocument();
    expect(screen.getByText("Visibility & Float")).toBeInTheDocument();
  });

  it("renders the toggle only when onAdvancedToggle is supplied and fires it", () => {
    const onAdvancedToggle = vi.fn();
    renderLayout({ onAdvancedToggle });
    const toggle = screen.getByRole("button", { name: "Position, overflow & visibility" });
    fireEvent.click(toggle);
    expect(onAdvancedToggle).toHaveBeenCalled();
  });

  it("omits the toggle entirely when onAdvancedToggle is absent", () => {
    renderLayout();
    expect(
      screen.queryByRole("button", { name: "Position, overflow & visibility" })
    ).not.toBeInTheDocument();
  });
});

/* Board 4428:141170: LAYOUT carries Display and a "Size  Fill · Hug" row —
   width and height sizing modes. Exact numbers stay in the Size section. */
describe("LayoutSection — Size row", () => {
  it("reads width/height as Fill · Hug and writes the chosen mode", () => {
    const { onChange } = renderLayout({ styles: { width: "100%", height: "fit-content" } });
    const w = screen.getByRole("combobox", { name: "Width sizing" }) as HTMLSelectElement;
    const h = screen.getByRole("combobox", { name: "Height sizing" }) as HTMLSelectElement;
    expect(w.value).toBe("fill");
    expect(h.value).toBe("hug");
    fireEvent.change(w, { target: { value: "hug" } });
    expect(onChange).toHaveBeenCalledWith("width", "fit-content");
    fireEvent.change(h, { target: { value: "fill" } });
    expect(onChange).toHaveBeenCalledWith("height", "100%");
  });

  it("a fixed size reads as its value and Fixed keeps it", () => {
    const { onChange } = renderLayout({ styles: { width: "320px" } });
    const w = screen.getByRole("combobox", { name: "Width sizing" }) as HTMLSelectElement;
    expect(w.value).toBe("fixed");
    expect(w.selectedOptions[0].textContent).toBe("320px");
    fireEvent.change(w, { target: { value: "fixed" } });
    expect(onChange).not.toHaveBeenCalledWith("width", "200px");
  });
});
