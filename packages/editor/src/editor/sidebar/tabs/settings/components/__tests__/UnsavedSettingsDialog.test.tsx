/**
 * UnsavedSettingsDialog — board 4418:165478 "Unsaved settings" (560): the
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
  const props = { open: true, siteName: "Bella Cucina", onKeepEditing: vi.fn(), onDiscard: vi.fn(), onSaveAndContinue: vi.fn(), ...over };
  render(<UnsavedSettingsDialog {...props} />);
  return props;
}

describe("4418:165478 · Unsaved settings", () => {
  it("carries the board's title and body, at 560", () => {
    mount();
    expect(screen.getByTestId("set-unsaved-title")).toHaveTextContent("Unsaved settings");
    expect(screen.getByTestId("set-unsaved-body")).toHaveTextContent(
      "These settings have not been saved. Save them and continue, keep editing, or discard the pending edits.",
    );
    expect(screen.getByTestId("set-unsaved")).toHaveClass("tw:w-[560px]");
    expect(screen.getByTestId("set-unsaved")).toHaveAttribute("aria-label", "Unsaved settings · Bella Cucina");
  });

  it("Discard changes · Keep editing · Save and continue, in that order; Keep editing takes focus", () => {
    const props = mount();
    const keep = screen.getByTestId("set-unsaved-keep");
    const discard = screen.getByTestId("set-unsaved-discard");
    const save = screen.getByTestId("set-unsaved-save");
    expect([...screen.getByTestId("set-unsaved-foot").querySelectorAll("button")].map((b) => b.textContent)).toEqual([
      "Discard changes", "Keep editing", "Save and continue",
    ]);
    expect(keep).toHaveTextContent("Keep editing");
    expect(discard).toHaveTextContent("Discard changes");
    fireEvent.click(save);
    expect(props.onSaveAndContinue).toHaveBeenCalledTimes(1);
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
