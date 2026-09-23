/**
 * MoveFailedModal — Clone 3699:20347 "Files could not be moved".
 *
 * Shown when the move the person asked for (from the Move modal or a drop
 * on a folder) was rejected by the engine. Nothing has changed; Retry runs
 * the same move again.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { MoveFailedModal } from "../MoveFailedModal";

function mount(open = true) {
  const props = { open, onClose: vi.fn(), onRetry: vi.fn() };
  render(<MoveFailedModal {...props} />);
  return props;
}

describe("Clone 3699:20347 · Files could not be moved", () => {
  it("says nothing moved and offers Cancel · Retry", () => {
    mount();
    expect(screen.getByTestId("mgr-move-failed-title")).toHaveTextContent("Files could not be moved");
    expect(screen.getByTestId("mgr-move-failed-body")).toHaveTextContent(
      "No files moved. Your selection and current folders are unchanged. Try again.",
    );
    expect(screen.getByTestId("mgr-move-failed-cancel")).toHaveTextContent("Cancel");
    expect(screen.getByTestId("mgr-move-failed-retry")).toHaveTextContent("Retry");
  });

  it("Retry re-runs the move; Cancel just closes", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("mgr-move-failed-retry"));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("mgr-move-failed-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    mount(false);
    expect(screen.queryByTestId("mgr-move-failed")).toBeNull();
  });
});
