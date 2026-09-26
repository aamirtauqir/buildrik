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

  it("with neither prop, the dialog node has no accessible name (unchanged pre-fix behaviour for callers that haven't adopted it yet)", () => {
    render(
      <ModalRoot open onClose={() => {}}>
        <ModalContent>Body only</ModalContent>
      </ModalRoot>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeNull();
    expect(dialog.getAttribute("aria-label")).toBeNull();
  });
});
