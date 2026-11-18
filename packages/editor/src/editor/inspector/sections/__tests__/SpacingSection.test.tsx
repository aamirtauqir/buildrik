/**
 * SpacingSection — 2L9 247:22853: one row per edge (Padding top · sides ·
 * bottom, Margin top · bottom), sides splitting once they differ, a Source
 * group for a token-bound edge; no gap rows. Each row carries its CSS
 * property, so an override lights a dot on that row (board 26).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InspectorFieldContext, type InspectorFieldContextValue } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { SpacingSection } from "../SpacingSection";

function renderSpacing(styles: Record<string, string> = {}, field?: Partial<InspectorFieldContextValue>) {
  const onChange = vi.fn();
  const onBatchChange = vi.fn();
  const ui = <SpacingSection styles={styles} onChange={onChange} onBatchChange={onBatchChange} isOpen />;
  render(
    field ? (
      <InspectorFieldContext.Provider
        value={{ readOnly: false, readOnlyReason: null, mixedKeys: new Set(), overrides: new Map(), overrideLabels: {}, resetOverride: vi.fn(), ...field }}
      >
        {ui}
      </InspectorFieldContext.Provider>
    ) : (
      ui
    ),
  );
  return { onChange, onBatchChange };
}

const order = (names: string[]) => {
  const els = names.map((n) => screen.getByLabelText(n));
  return [...els].sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).map((el) => names[els.indexOf(el)]);
};

describe("SpacingSection — rows (247:22853)", () => {
  it("Padding top · Padding sides · Padding bottom · Margin top · Margin bottom, from longhands and the shorthand", () => {
    renderSpacing({ padding: "24px", "margin-top": "-8px" });
    const names = ["Padding top", "Padding sides", "Padding bottom", "Margin top", "Margin bottom"];
    expect(order(names)).toEqual(names);
    expect(screen.getByLabelText("Padding sides")).toHaveValue("24");
    expect(screen.getByLabelText("Margin top")).toHaveValue("-8");
    expect(screen.queryByLabelText("Margin sides")).not.toBeInTheDocument();
  });

  it("an edge writes its own longhand; sides write left and right in one change", () => {
    const { onChange, onBatchChange } = renderSpacing();
    fireEvent.change(screen.getByLabelText("Padding top"), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("padding-top", "12px");
    fireEvent.change(screen.getByLabelText("Padding sides"), { target: { value: "20" } });
    expect(onBatchChange).toHaveBeenCalledWith({ "padding-left": "20px", "padding-right": "20px" });
  });

  it("sides that differ split into Left / Right; a set margin side shows", () => {
    renderSpacing({ padding: "24px 16px 24px 8px", "margin-left": "auto", "margin-right": "auto" });
    expect(screen.getByLabelText("Padding left")).toHaveValue("8");
    expect(screen.getByLabelText("Padding right")).toHaveValue("16");
    expect(screen.queryByLabelText("Padding sides")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Margin sides")).toBeInTheDocument();
  });

  it("no gap rows (DD-9)", () => {
    renderSpacing();
    expect(screen.queryByLabelText("Gap")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Row gap")).not.toBeInTheDocument();
  });

  it("a token-bound edge gets the Source group with Unlink, and Remove local override when overridden", () => {
    document.documentElement.style.setProperty("--buildrick-design-space-24", "24px");
    const v = "var(--buildrick-design-space-24)";
    const { onChange } = renderSpacing({ "padding-top": v }, { overrides: new Map([["padding-top", ["breakpoint"]]]) });
    const source = screen.getByTestId("inspector-spacing-source");
    expect(source.textContent).toContain("Padding top · spacing token · 24 px resolved");
    fireEvent.click(screen.getByRole("button", { name: "Unlink to 24 px" }));
    expect(onChange).toHaveBeenCalledWith("padding-top", "24px");
    expect(screen.getByRole("button", { name: "Remove local override" })).toBeInTheDocument();
    document.documentElement.style.removeProperty("--buildrick-design-space-24");
  });
});

describe("SpacingSection — field context", () => {
  it("an overridden side draws its dot (board 26, padding overrides master)", () => {
    renderSpacing({ "padding-top": "32px" }, { overrides: new Map([["padding-top", ["master"]]]) });
    expect(screen.getByRole("button", { name: "Overrides master" })).toBeInTheDocument();
    expect(screen.getAllByTestId("inspector-override-dot-master")).toHaveLength(1);
  });

  it("read-only keeps the values legible and refuses edits", () => {
    renderSpacing({ "padding-top": "32px" }, { readOnly: true, readOnlyReason: "locked" });
    const input = screen.getByLabelText("Padding top");
    expect(input).toHaveValue("32");
    expect(input).toHaveAttribute("readonly");
  });

  it("a mixed side says so instead of showing one element's value", () => {
    renderSpacing({ "padding-top": "32px" }, { mixedKeys: new Set(["padding-top"]) });
    expect(screen.getByRole("textbox", { name: "Padding top Mixed values" })).toHaveAttribute("placeholder", "Mixed");
  });
});

describe("SpacingSection — the page panel (2L9 S06)", () => {
  const renderPage = (styles: Record<string, string>, advancedExpanded = false) => {
    const onBatchChange = vi.fn();
    render(<SpacingSection styles={styles} onChange={vi.fn()} onBatchChange={onBatchChange} isOpen variant="page" advancedExpanded={advancedExpanded} onAdvancedToggle={vi.fn()} />);
    return { onBatchChange };
  };
  const labels = () => Array.from(document.querySelectorAll(".bdi-lb")).map((l) => l.textContent?.trim());

  it("four equal sides are one 'Padding' row, which writes all four; no margin rows while none is set", () => {
    const { onBatchChange } = renderPage({ padding: "32px" });
    expect(labels()).toEqual(["Padding"]);
    fireEvent.change(screen.getByRole("textbox", { name: /^Padding/ }), { target: { value: "40" } });
    expect(onBatchChange).toHaveBeenCalledWith({ "padding-top": "40px", "padding-right": "40px", "padding-bottom": "40px", "padding-left": "40px" });
  });

  it("sides that differ keep their own rows — one row would not be true", () => {
    renderPage({ "padding-top": "32px", "padding-right": "16px", "padding-bottom": "32px", "padding-left": "16px" });
    expect(labels()).toEqual(expect.arrayContaining(["Padding top", "Padding sides", "Padding bottom"]));
  });

  it("a set margin still shows its rows; More settings splits the padding again", () => {
    renderPage({ padding: "32px", "margin-top": "8px" }, true);
    expect(labels()).toEqual(expect.arrayContaining(["Padding top", "Margin top"]));
  });
});
