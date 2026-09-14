/**
 * UnsavedSettingsDialog — Clone 3737:43639 "Unsaved settings" (640): the
 * guard on every door out of a dirty settings screen. One `it` per
 * prototype fact a DOM assertion can prove; the visual half is the live
 * walk's shot pair.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { UnsavedSettingsDialog } from "../UnsavedSettingsDialog";

function mount(over: Partial<React.ComponentProps<typeof UnsavedSettingsDialog>> = {}) {
  const props = { open: true, siteName: "Bella Cucina", onKeepEditing: vi.fn(), onDiscard: vi.fn(), ...over };
  render(<UnsavedSettingsDialog {...props} />);
  return props;
}

describe("Clone 3737:43639 · Unsaved settings", () => {
  it("carries the frame's title and body, at the 640 table width", () => {
    mount();
    expect(screen.getByTestId("set-unsaved-title")).toHaveTextContent("Unsaved settings");
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent(
      "These settings have not been saved. Keep editing to finish them, or discard the pending edits and return to the canvas.",
    );
    expect(screen.getByTestId("set-unsaved")).toHaveClass("tw:w-[640px]");
    expect(screen.getByTestId("set-unsaved")).toHaveAttribute("aria-label", "Unsaved settings · Bella Cucina");
  });

  it("Keep editing is the secondary and takes focus; Discard and return to canvas is the danger action", () => {
    const props = mount();
    const keep = screen.getByTestId("set-unsaved-keep");
    const discard = screen.getByTestId("set-unsaved-discard");
    expect(keep).toHaveTextContent("Keep editing");
    expect(discard).toHaveTextContent("Discard and return to canvas");
    expect(document.activeElement).toBe(keep);
    /* 32 high, in the library modal's shape: flowbite's xs (h-8) on both. */
    expect(keep).toHaveClass("tw:h-8");
    expect(discard).toHaveClass("tw:h-8");
    expect(discard).toHaveClass("tw:bg-[var(--bk-error)]");

    fireEvent.click(keep);
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
    fireEvent.click(discard);
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
  });

  it("Escape keeps editing rather than discarding", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it("the scrim keeps editing too", () => {
    const props = mount();
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it("names the dialog without a site when none is known", () => {
    mount({ siteName: "" });
    expect(screen.getByTestId("set-unsaved")).toHaveAttribute("aria-label", "Unsaved settings");
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
  });
});
