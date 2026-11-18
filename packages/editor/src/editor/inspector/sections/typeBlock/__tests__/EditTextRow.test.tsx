/**
 * EditTextRow — the type block's "Edit text on canvas" asks the canvas to
 * start its inline edit (G2-027); the text itself is never a textarea here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import { EditTextRow } from "../EditTextRow";
import { InspectorFieldContext } from "@/editor/inspector/shared/controls/InspectorFieldContext";

describe("EditTextRow", () => {
  it("asks the canvas for the inline edit of this element", () => {
    const composer = { emit: vi.fn() } as unknown as Composer;
    render(<EditTextRow composer={composer} elementId="h1" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit text on canvas" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId: "h1" });
  });

  it("is shut while the panel is read-only (locked / save conflict)", () => {
    const composer = { emit: vi.fn() } as unknown as Composer;
    render(
      <InspectorFieldContext.Provider value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), resetOverride: () => {} } as never}>
        <EditTextRow composer={composer} elementId="h1" />
      </InspectorFieldContext.Provider>,
    );
    // Read-only is not disabled (DD-18): legible and focusable, the click refused.
    const button = screen.getByRole("button", { name: "Edit text on canvas" });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button);
    expect(composer.emit).not.toHaveBeenCalled();
  });

  it("2L9 TX09: its own lock says why and how — the name, Unlock in Layers, and that Enter / double-click do not edit", () => {
    const el = { getType: () => "heading", getCustomData: (k: string) => (k === "layerName" ? "Hero heading" : undefined) };
    const composer = { emit: vi.fn(), elements: { getElement: () => el } } as unknown as Composer;
    render(
      <InspectorFieldContext.Provider value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), resetOverride: () => {} } as never}>
        <EditTextRow composer={composer} elementId="h1" />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.getByTestId("inspector-text-locked")).toHaveTextContent("Hero heading is locked. Unlock it in Layers to edit its text or semantic tag.");
    expect(screen.getByTestId("inspector-text-locked-hint")).toHaveTextContent(
      "Locked — unlock Hero heading before editing. Enter and double-click do not start an edit.",
    );
  });

  it("147:77668: an ancestor's lock names the layer that holds it", () => {
    const hero = { getType: () => "section", getCustomData: (k: string) => (k === "layerName" ? "Hero" : undefined), isLocked: () => true, getParent: () => null };
    const el = { getType: () => "text", getCustomData: () => undefined, isLocked: () => false, getParent: () => hero };
    const composer = { emit: vi.fn(), elements: { getElement: () => el } } as unknown as Composer;
    render(
      <InspectorFieldContext.Provider value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), resetOverride: () => {} } as never}>
        <EditTextRow composer={composer} elementId="t1" />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.getByTestId("inspector-text-locked")).toHaveTextContent("Locked by Hero. Unlock Hero in Layers to edit this text or its semantic tag.");
    expect(screen.getByTestId("inspector-text-locked-hint")).toHaveTextContent("Locked — unlock Hero before editing.");
  });

  it("a save conflict is read-only too, but not a lock — no lock notice", () => {
    const composer = { emit: vi.fn() } as unknown as Composer;
    render(
      <InspectorFieldContext.Provider value={{ readOnly: true, readOnlyReason: "conflict", mixedKeys: new Set(), overrides: new Map(), resetOverride: () => {} } as never}>
        <EditTextRow composer={composer} elementId="h1" />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.queryByTestId("inspector-text-locked")).toBeNull();
  });

  it("renders nothing without a composer", () => {
    const { container } = render(<EditTextRow composer={null} elementId="h1" />);
    expect(container.textContent).toBe("");
  });
});
