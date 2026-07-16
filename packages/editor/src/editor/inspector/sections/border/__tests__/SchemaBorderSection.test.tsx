/**
 * SchemaBorderSection — the borderSchema-powered drop-in replacement for
 * BorderSection. Wraps SchemaDrivenSection (collapsible header + schema
 * renderer). Field-level behavior is covered by the border schema tests; this
 * verifies the wrapper forwards styles/onChange/onBatchChange/isOpen/onToggle.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SchemaBorderSection } from "../SchemaBorderSection";

const STYLES = {
  "border-width": "2px",
  "border-style": "solid",
  "border-color": "#333333",
  "border-top-left-radius": "4px",
  "border-top-right-radius": "4px",
  "border-bottom-right-radius": "4px",
  "border-bottom-left-radius": "4px",
};

describe("SchemaBorderSection", () => {
  it("renders the border essentials when open", () => {
    render(
      <SchemaBorderSection styles={STYLES} onChange={vi.fn()} onBatchChange={vi.fn()} isOpen />
    );
    expect(screen.getByLabelText("Width")).toBeInTheDocument();
    expect(screen.getByLabelText("Style")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
  });

  it("collapses its body when isOpen is false", () => {
    render(
      <SchemaBorderSection
        styles={STYLES}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
        isOpen={false}
      />
    );
    expect(screen.queryByLabelText("Width")).toBeNull();
  });

  it("forwards border-width edits through onChange", () => {
    const onChange = vi.fn();
    render(
      <SchemaBorderSection styles={STYLES} onChange={onChange} onBatchChange={vi.fn()} isOpen />
    );
    fireEvent.change(screen.getByLabelText("Width"), { target: { value: "5px" } });
    expect(onChange).toHaveBeenCalledWith("border-width", "5px");
  });

  it("forwards linked corner-radius edits through onBatchChange", () => {
    const onBatchChange = vi.fn();
    render(
      <SchemaBorderSection
        styles={STYLES}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
        isOpen
      />
    );
    fireEvent.change(screen.getByLabelText("TR"), { target: { value: "16px" } });
    expect(onBatchChange).toHaveBeenLastCalledWith({ "border-radius": "16px" });
  });

  it("fires onToggle when the section header is clicked", () => {
    const onToggle = vi.fn();
    render(
      <SchemaBorderSection
        styles={STYLES}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
        isOpen
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Border section/ }));
    expect(onToggle).toHaveBeenCalled();
  });
});
