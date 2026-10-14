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

  it("renders nothing without a composer", () => {
    const { container } = render(<EditTextRow composer={null} elementId="h1" />);
    expect(container.textContent).toBe("");
  });
});
