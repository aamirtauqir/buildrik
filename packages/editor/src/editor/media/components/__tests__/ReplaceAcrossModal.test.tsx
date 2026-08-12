import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ReplaceAcrossModal, type ReplaceAcrossPageEntry } from "../ReplaceAcrossModal";

const samplePages: ReplaceAcrossPageEntry[] = [
  { pageId: "p1", pageName: "Home", placeCount: 2 },
  { pageId: "p2", pageName: "About", placeCount: 1 },
  { pageId: "p3", pageName: "Pricing", placeCount: 1 },
];

function renderModal(overrides: Partial<React.ComponentProps<typeof ReplaceAcrossModal>> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    oldName: "logo-old.png",
    oldSrc: "old.png",
    newName: "logo-new.svg",
    newSrc: "new.png",
    pages: samplePages,
    onConfirm: vi.fn(),
    ...overrides,
  };
  return { ...render(<ReplaceAcrossModal {...props} />), props };
}

describe("ReplaceAcrossModal", () => {
  it("renders nothing when not open", () => {
    const { container } = renderModal({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders title with old asset name + page count", () => {
    const { getByText } = renderModal();
    expect(getByText(/Replace logo-old.png across pages/)).toBeTruthy();
    expect(getByText(/Used in 3 pages/)).toBeTruthy();
  });

  it("defaults to all pages selected and shows 'Replace on N pages' CTA", () => {
    const { getByText } = renderModal();
    expect(getByText("Replace on 3 pages")).toBeTruthy();
    expect(getByText(/3 of 3 pages selected/)).toBeTruthy();
  });

  it("computes total element-change count from selected pages", () => {
    const { getByText } = renderModal();
    // 2 + 1 + 1 = 4 places
    expect(getByText(/~4 element changes/)).toBeTruthy();
  });

  it("unchecking a row updates the CTA and place count", () => {
    const { getByText, getByLabelText } = renderModal();
    const aboutCheckbox = getByLabelText("Replace on About");
    fireEvent.click(aboutCheckbox);
    expect(getByText("Replace on 2 pages")).toBeTruthy();
    expect(getByText(/~3 element changes/)).toBeTruthy();
  });

  it("CTA disabled when zero pages selected", () => {
    const { getByText, getByLabelText } = renderModal();
    fireEvent.click(getByLabelText("Replace on Home"));
    fireEvent.click(getByLabelText("Replace on About"));
    fireEvent.click(getByLabelText("Replace on Pricing"));
    const cta = getByText("Replace on 0 pages") as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });

  it("Cancel button calls onOpenChange(false)", () => {
    const { getByText, props } = renderModal();
    fireEvent.click(getByText("Cancel"));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Confirm passes selected page ids to onConfirm + closes modal", () => {
    const { getByText, getByLabelText, props } = renderModal();
    fireEvent.click(getByLabelText("Replace on About")); // uncheck
    fireEvent.click(getByText("Replace on 2 pages"));
    expect(props.onConfirm).toHaveBeenCalledWith(["p1", "p3"]);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets selection when pages prop changes (new asset opened)", () => {
    const { getByText, getByLabelText, rerender, props } = renderModal();
    fireEvent.click(getByLabelText("Replace on About")); // uncheck p2
    expect(getByText("Replace on 2 pages")).toBeTruthy();

    const newPages: ReplaceAcrossPageEntry[] = [
      { pageId: "px", pageName: "Other", placeCount: 1 },
    ];
    rerender(<ReplaceAcrossModal {...props} pages={newPages} />);
    // Reset to all-checked for the new set.
    expect(getByText("Replace on 1 page")).toBeTruthy();
  });

  it("dimmed row label says '(skipped)' when unchecked", () => {
    const { getByText, getByLabelText } = renderModal();
    fireEvent.click(getByLabelText("Replace on About"));
    expect(getByText(/\(skipped\)/)).toBeTruthy();
  });

  /* The modal took oldSrc/newSrc and destructured them to `_oldSrc`/`_newSrc`,
     so the confirm that exists to answer "am I replacing the right picture with
     the right picture" showed two coloured boxes. The harness passed both srcs
     all along — nothing here asserted they reached the DOM. */
  it("shows both images, so the swap can actually be checked", () => {
    /* baseElement, not container: the modal portals out of the render root. */
    const { baseElement } = renderModal();
    const srcs = Array.from(baseElement.querySelectorAll("img")).map((i) => i.getAttribute("src"));
    expect(srcs).toContain("old.png");
    expect(srcs).toContain("new.png");
  });

  it("keeps the plain frame when an asset has no src, not a broken image", () => {
    const { baseElement } = renderModal({ oldSrc: undefined, newSrc: undefined });
    expect(baseElement.querySelectorAll("img")).toHaveLength(0);
  });
});
