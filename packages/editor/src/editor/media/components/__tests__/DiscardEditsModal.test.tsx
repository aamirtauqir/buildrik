/**
 * DiscardEditsModal — Clone 3695:45549 "Assets · discard" (640): Cancel on a
 * dirty image-editor draft asks before throwing the edits away. Edges:
 * `Keep editing|CLIC|CLOS` (back to the editor) and `Discard changes|CLIC|CLOS`.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { DiscardEditsModal } from "../DiscardEditsModal";

function mount(over: Partial<React.ComponentProps<typeof DiscardEditsModal>> = {}) {
  const props = { open: true, onKeepEditing: vi.fn(), onDiscard: vi.fn(), ...over };
  render(<DiscardEditsModal {...props} />);
  return props;
}

describe("Clone 3695:45549 · Discard unsaved changes?", () => {
  it("carries the board's title and body", () => {
    mount();
    expect(screen.getByTestId("image-editor-discard-title")).toHaveTextContent("Discard unsaved changes?");
    expect(screen.getByTestId("image-editor-discard-body")).toHaveTextContent(
      "The original and saved versions will remain unchanged.",
    );
  });

  it("Keep editing is the primary and returns to the editor; Discard changes is the danger action", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("image-editor-discard-keep"));
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("image-editor-discard-confirm"));
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
  });

  it("Escape keeps editing rather than discarding", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("image-editor-discard")).toBeNull();
  });
});
