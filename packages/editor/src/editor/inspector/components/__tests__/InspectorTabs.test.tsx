/**
 * InspectorTabs — job-language labels (Look / Layout / Effects), active
 * state, click → onChange contract, and arrow-key relabel. ARIA-role +
 * focus movement via ProInspector is covered by
 * inspector/__tests__/TabNavigation.test.tsx; this unit tests the tab
 * component in isolation, focusing on the onChange callback.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InspectorTabs } from "../InspectorTabs";

describe("InspectorTabs — labels + selection", () => {
  it("renders the three job-language labels", () => {
    render(<InspectorTabs activeTab="style" onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "Look" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Layout" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Effects" })).toBeInTheDocument();
  });

  it("marks the active tab as selected", () => {
    render(<InspectorTabs activeTab="element" onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "Layout" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Look" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });
});

describe("InspectorTabs — onChange contract", () => {
  it("clicking a tab fires onChange with its id", () => {
    const onChange = vi.fn();
    render(<InspectorTabs activeTab="style" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Effects" }));
    expect(onChange).toHaveBeenCalledWith("effects");
  });

  it("ArrowRight from the first tab requests the next tab id", () => {
    const onChange = vi.fn();
    render(<InspectorTabs activeTab="style" onChange={onChange} />);
    const look = screen.getByRole("tab", { name: "Look" });
    look.focus();
    fireEvent.keyDown(look, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("element");
  });

  it("ArrowLeft wraps from the first tab to the last", () => {
    const onChange = vi.fn();
    render(<InspectorTabs activeTab="style" onChange={onChange} />);
    const look = screen.getByRole("tab", { name: "Look" });
    look.focus();
    fireEvent.keyDown(look, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("effects");
  });
});
