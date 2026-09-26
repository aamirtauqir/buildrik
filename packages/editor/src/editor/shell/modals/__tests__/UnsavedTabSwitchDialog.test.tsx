/**
 * UnsavedTabSwitchDialog — the shared confirm useTabSwitchGuard (B-1) opens
 * before a tab switch would discard a dirty Settings screen, a staged Brand
 * edit, or an open CMS record.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { UnsavedTabSwitchDialog } from "../UnsavedTabSwitchDialog";

function mount(over: Partial<React.ComponentProps<typeof UnsavedTabSwitchDialog>> = {}) {
  const props = {
    open: true,
    body: "You have unsaved changes. Switching away will lose them.",
    leaveLabel: "Leave and lose changes",
    onKeepEditing: vi.fn(),
    onLeaveAnyway: vi.fn(),
    ...over,
  };
  render(<UnsavedTabSwitchDialog {...props} />);
  return props;
}

describe("UnsavedTabSwitchDialog", () => {
  it("carries the title and body", () => {
    mount();
    expect(screen.getByTestId("tab-switch-unsaved-title")).toHaveTextContent("Unsaved changes");
    expect(screen.getByTestId("tab-switch-unsaved-body")).toHaveTextContent(
      "You have unsaved changes. Switching away will lose them."
    );
  });

  it("renders the guard's may-discard copy and leave label as given", () => {
    mount({ body: "You have unsaved brand changes. Switching away may discard some of them.", leaveLabel: "Leave anyway" });
    expect(screen.getByTestId("tab-switch-unsaved-body")).toHaveTextContent("may discard some of them");
    expect(screen.getByTestId("tab-switch-unsaved-leave")).toHaveTextContent("Leave anyway");
  });

  it("Leave and lose changes · Keep editing, in that order; Keep editing takes focus", () => {
    const props = mount();
    const leave = screen.getByTestId("tab-switch-unsaved-leave");
    const keep = screen.getByTestId("tab-switch-unsaved-keep");
    expect(
      [...screen.getByTestId("tab-switch-unsaved-foot").querySelectorAll("button")].map((b) => b.textContent)
    ).toEqual(["Leave and lose changes", "Keep editing"]);
    expect(document.activeElement).toBe(keep);

    fireEvent.click(leave);
    expect(props.onLeaveAnyway).toHaveBeenCalledTimes(1);
    expect(props.onKeepEditing).not.toHaveBeenCalled();

    fireEvent.click(keep);
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
  });

  it("Escape keeps editing rather than leaving", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onLeaveAnyway).not.toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("tab-switch-unsaved")).toBeNull();
  });
});
