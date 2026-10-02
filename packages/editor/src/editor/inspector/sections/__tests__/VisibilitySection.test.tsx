/**
 * VisibilitySection — per-breakpoint show/hide toggles + hidden-count preview.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VisibilitySection } from "../VisibilitySection";
import { InspectorFieldContext } from "../../shared/controls/InspectorFieldContext";

function renderVisibility(styles: Record<string, string> = {}, isOpen = true) {
  const onChange = vi.fn();
  const utils = render(
    <VisibilitySection styles={styles} onChange={onChange} isOpen={isOpen} />
  );
  return { onChange, ...utils };
}

describe("VisibilitySection — rendering", () => {
  it("renders one checkbox per breakpoint (board 2), all ticked by default", () => {
    renderVisibility();
    for (const bp of ["Desktop", "Tablet", "Mobile"]) {
      expect(screen.getByRole("checkbox", { name: bp })).toBeChecked();
    }
  });

  it("reflects a hidden breakpoint from --hide-* styles", () => {
    renderVisibility({ "--hide-mobile": "true" });
    expect(screen.getByRole("checkbox", { name: "Mobile" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Desktop" })).toBeInTheDocument();
  });

  it("shows a 'hidden on N' preview when any breakpoint is hidden", () => {
    renderVisibility({ "--hide-mobile": "true", "--hide-tablet": "true" }, false);
    expect(screen.getByText("hidden on 2")).toBeInTheDocument();
  });

  it("shows no preview when nothing is hidden", () => {
    renderVisibility();
    expect(screen.queryByText(/hidden on/)).not.toBeInTheDocument();
  });
});

describe("VisibilitySection — writes", () => {
  it("hiding a visible breakpoint writes --hide-<bp>='true'", () => {
    const { onChange } = renderVisibility();
    fireEvent.click(screen.getByRole("checkbox", { name: "Desktop" }));
    expect(onChange).toHaveBeenCalledWith("--hide-desktop", "true");
  });

  it("showing a hidden breakpoint clears --hide-<bp>", () => {
    const { onChange } = renderVisibility({ "--hide-mobile": "true" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Mobile" }));
    expect(onChange).toHaveBeenCalledWith("--hide-mobile", "");
  });
});

/* QA 2026-10-02: on a locked element the boxes refused the click but the
   labels still offered it (pointer). Read-only, not disabled (§1.7): the box
   keeps its value legible, says aria-readonly, and nothing invites a click. */
describe("VisibilitySection — locked", () => {
  it("reads as read-only: aria-readonly, not disabled, no pointer on the labels, a click writes nothing", () => {
    const onChange = vi.fn();
    render(
      <InspectorFieldContext.Provider
        value={{ readOnly: true, readOnlyReason: "locked", mixedKeys: new Set(), overrides: new Map(), overrideLabels: {}, resetOverride: () => undefined }}
      >
        <VisibilitySection styles={{}} onChange={onChange} isOpen />
      </InspectorFieldContext.Provider>,
    );
    for (const bp of ["Desktop", "Tablet", "Mobile"]) {
      const box = screen.getByRole("checkbox", { name: bp });
      expect(box).toHaveAttribute("aria-readonly", "true");
      expect(box).not.toBeDisabled();
      const label = screen.getByText(bp, { selector: "label" });
      expect(label.className).not.toMatch(/cursor-pointer/);
      fireEvent.click(label);
      expect(box).toBeChecked();
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
