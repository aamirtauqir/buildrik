/**
 * ModalRoot — B-7/A13-4: `labelledBy`/`ariaLabel` used to be dropped on the
 * floor between ModalRoot and OverlayMount, so the role="dialog" node
 * OverlayMount actually renders had no accessible name — ModalContent's
 * `srTitle` only ever reached a redundant `aria-label` on the CONTENT div,
 * one level in from the real dialog node.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModalRoot, ModalContent, ModalTitle } from "../index";

describe("ModalRoot — dialog naming", () => {
  it("forwards labelledBy to the dialog node's aria-labelledby", () => {
    render(
      <ModalRoot open onClose={() => {}} labelledBy="rename-title">
        <ModalContent>
          <ModalTitle id="rename-title">Rename page</ModalTitle>
        </ModalContent>
      </ModalRoot>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe("rename-title");
    expect(screen.getByRole("dialog", { name: "Rename page" })).toBeInTheDocument();
  });

  it("falls back to ariaLabel when there's no visible heading to point at", () => {
    render(
      <ModalRoot open onClose={() => {}} ariaLabel="Confirm delete">
        <ModalContent>Are you sure?</ModalContent>
      </ModalRoot>,
    );
    expect(screen.getByRole("dialog", { name: "Confirm delete" })).toBeInTheDocument();
  });

  it("with neither prop and no ModalTitle in the tree, the dialog node has no accessible name", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent>Body only</ModalContent>
      </ModalRoot>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeNull();
    expect(dialog.getAttribute("aria-label")).toBeNull();
  });

  /* B-7: ~50 existing ModalRoot consumers render a visible
     `<ModalTitle>` but never wire `labelledBy` up to ModalRoot manually —
     DeleteConfirmModal.tsx is one (see the twin test in that file). Without
     wiring every one of them by hand, the dialog node they render was
     unnamed. ModalTitle now registers its own id into the dialog's name
     automatically — no `labelledBy` prop, no `id` prop from the caller. */
  it("auto-detects a ModalTitle with no explicit labelledBy prop and no caller-supplied id", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent>
          <ModalTitle>Delete this page?</ModalTitle>
        </ModalContent>
      </ModalRoot>,
    );
    expect(screen.getByRole("dialog", { name: "Delete this page?" })).toBeInTheDocument();
  });

  /* A visible ModalTitle wins over ModalContent's srTitle — a sighted user
     and a screen-reader user should be told the same name for the dialog. */
  it("prefers the auto-detected ModalTitle over ModalContent's srTitle", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent srTitle="Fallback name">
          <ModalTitle>Visible title wins</ModalTitle>
        </ModalContent>
      </ModalRoot>,
    );
    expect(screen.getByRole("dialog", { name: "Visible title wins" })).toBeInTheDocument();
  });

  /* No visible ModalTitle at all — ModalContent's srTitle names the dialog
     without the caller wiring ModalRoot's ariaLabel by hand. */
  it("auto-detects ModalContent's srTitle when there is no visible ModalTitle", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent srTitle="Screen-reader-only name">Are you sure?</ModalContent>
      </ModalRoot>,
    );
    expect(screen.getByRole("dialog", { name: "Screen-reader-only name" })).toBeInTheDocument();
  });

  it("an explicit labelledBy/ariaLabel prop still wins over auto-detection", () => {
    render(
      <ModalRoot open onClose={() => {}} ariaLabel="Explicit override">
        <ModalContent>
          <ModalTitle>Auto-detected title</ModalTitle>
        </ModalContent>
      </ModalRoot>,
    );
    // The explicit ariaLabel wins; the auto-detected labelledBy must not
    // also apply (aria-labelledby beats aria-label per the ARIA spec, so
    // leaving both set would silently lose the explicit override).
    expect(screen.getByRole("dialog", { name: "Explicit override" })).toBeInTheDocument();
  });
});
