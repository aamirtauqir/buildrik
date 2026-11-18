/**
 * UnsavedSettingsDialog — 2L9 page 06: B8-S06 238:11495 / B8-GUARD 248:20642
 * (ask), B8-SAVING 248:20853 (saving), GAP-ST-E 277:28233 (failed). The
 * screen and destination names are props; the board's sample data is not
 * copied.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { UnsavedSettingsDialog } from "../UnsavedSettingsDialog";

type Props = React.ComponentProps<typeof UnsavedSettingsDialog>;

function mount(over: Partial<Props> = {}) {
  const props: Props = {
    open: true,
    phase: "ask",
    screenName: "General",
    destination: { kind: "screen", name: "Languages" },
    onKeepEditing: vi.fn(),
    onDiscard: vi.fn(),
    onSaveAndLeave: vi.fn(),
    ...over,
  };
  render(<UnsavedSettingsDialog {...props} />);
  return props;
}

const buttons = () => [...screen.getByTestId("set-unsaved-foot").querySelectorAll("button")].map((b) => b.textContent);

describe("B8-GUARD 248:20642 · Leave without saving?", () => {
  it("names the screen and the destination, at 480", () => {
    mount();
    expect(screen.getByTestId("set-unsaved-title")).toHaveTextContent("Leave without saving?");
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent(
      "Your General changes are unsaved. Continue to Languages after saving or discarding them.",
    );
    expect(screen.getByTestId("set-unsaved")).toHaveClass("tw:w-[var(--bk-size-dialog-sm)]");
    expect(screen.getByTestId("set-unsaved")).toHaveAttribute("aria-label", "Leave without saving?");
  });

  it("leaving Settings (B8-S06): save before you go, or discard", () => {
    mount({ destination: { kind: "leave" } });
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent(
      "Your General changes are unsaved. Save them before you go, or discard them.",
    );
  });

  it("Discard changes · Save and leave · Keep editing, in that order; Keep editing is the primary and takes focus", () => {
    const props = mount();
    expect(buttons()).toEqual(["Discard changes", "Save and leave", "Keep editing"]);
    const keep = screen.getByTestId("set-unsaved-keep");
    expect(document.activeElement).toBe(keep);
    /* Primary = flowbite's default colour (the accent); the other two are outlines. */
    expect(screen.getByTestId("set-unsaved-discard").className).not.toContain("tw:bg-[var(--bk-error)]");
    expect(keep).toHaveClass("tw:h-8");
    fireEvent.click(screen.getByTestId("set-unsaved-save"));
    expect(props.onSaveAndLeave).toHaveBeenCalledTimes(1);
    fireEvent.click(keep);
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
  });

  it("Escape and the scrim keep editing rather than discarding", () => {
    const props = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    expect(props.onKeepEditing).toHaveBeenCalledTimes(2);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
  });
});

describe("B8-SAVING 248:20853 · saving on the way out", () => {
  it("says the save is running and where it goes next; the one way back is Stay in {Screen}", () => {
    const props = mount({ phase: "saving" });
    expect(screen.getByTestId("set-unsaved-title")).toHaveTextContent("Saving General settings…");
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent(
      "Your destination is Languages. Wait for the save result; if it fails, your changes stay here.",
    );
    expect(buttons()).toEqual(["Stay in General"]);
    expect(document.activeElement).toBe(screen.getByTestId("set-unsaved-keep"));
    fireEvent.click(screen.getByTestId("set-unsaved-keep"));
    expect(props.onKeepEditing).toHaveBeenCalledTimes(1);
    expect(props.onDiscard).not.toHaveBeenCalled();
  });
});

describe("GAP-ST-E 277:28233 · save failed on the way out", () => {
  it("has not left; Keep editing (primary) · Retry save and leave, the destination kept", () => {
    const props = mount({ phase: "failed", screenName: "Security headers", destination: { kind: "screen", name: "Overview" } });
    expect(screen.getByTestId("set-unsaved-title")).toHaveTextContent("Couldn’t save Security headers");
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent("Your changes are still here. You have not left this screen.");
    expect(screen.getByTestId("set-unsaved-note")).toHaveTextContent(
      "Requested destination: Overview. Retry uses this same destination.",
    );
    expect(buttons()).toEqual(["Keep editing", "Retry save and leave"]);
    expect(document.activeElement).toBe(screen.getByTestId("set-unsaved-keep"));
    fireEvent.click(screen.getByTestId("set-unsaved-save"));
    expect(props.onSaveAndLeave).toHaveBeenCalledTimes(1);
  });

  it("names the editor when the way out was Back to Editor", () => {
    mount({ phase: "failed", destination: { kind: "leave" } });
    expect(screen.getByTestId("set-unsaved-note")).toHaveTextContent("Requested destination: the editor.");
  });
});
