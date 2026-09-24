/**
 * TextContentRow — board 4418:107674 "Text content · Edit text on canvas"
 * asks the canvas to start its inline edit (G2-027).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "../../../../engine/Composer";
import { EVENTS } from "../../../../shared/constants/events";
import { TextContentRow } from "../TextContentRow";

describe("TextContentRow", () => {
  it("a text element gets the row; its button asks for the canvas edit", () => {
    const composer = { emit: vi.fn() } as unknown as Composer;
    render(<TextContentRow composer={composer} selectedElement={{ id: "h1", type: "heading" }} />);
    expect(screen.getByText("Text content")).toBeTruthy();
    expect(screen.getByText("Edit this text on the canvas.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit text on canvas" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId: "h1" });
  });

  it("a non-text element gets nothing", () => {
    const composer = { emit: vi.fn() } as unknown as Composer;
    const { container } = render(<TextContentRow composer={composer} selectedElement={{ id: "s", type: "section" }} />);
    expect(container.textContent).toBe("");
  });
});
