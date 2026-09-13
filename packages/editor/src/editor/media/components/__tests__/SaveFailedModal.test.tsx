/**
 * SaveFailedModal — Clone 3695:45542 "Assets · failure" (640): the image
 * editor's save rejected; the draft is kept. Edges: `Continue editing|CLIC|CLOS`
 * and `Retry save|CLIC|SWA>3681:20026 Saved`.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { SaveFailedModal } from "../SaveFailedModal";

function mount(over: Partial<React.ComponentProps<typeof SaveFailedModal>> = {}) {
  const props = { open: true, retrying: false, onContinueEditing: vi.fn(), onRetry: vi.fn(), ...over };
  render(<SaveFailedModal {...props} />);
  return props;
}

describe("Clone 3695:45542 · Version could not be saved", () => {
  it("carries the board's title and body", () => {
    mount();
    expect(screen.getByTestId("image-editor-failed-title")).toHaveTextContent("Version could not be saved");
    expect(screen.getByTestId("image-editor-failed-body")).toHaveTextContent(
      "Your edits are retained. Check your connection and try again.",
    );
  });

  it("Continue editing returns to the editor; Retry save is the primary and re-runs the save", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("image-editor-failed-continue"));
    expect(props.onContinueEditing).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("image-editor-failed-retry"));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("while a retry runs, Retry save reads Saving… and both buttons are inert", () => {
    mount({ retrying: true });
    expect(screen.getByTestId("image-editor-failed-retry")).toHaveTextContent("Saving…");
    expect(screen.getByTestId("image-editor-failed-retry")).toBeDisabled();
    expect(screen.getByTestId("image-editor-failed-continue")).toBeDisabled();
  });

  it("Escape continues editing", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onContinueEditing).toHaveBeenCalledTimes(1);
  });
});
