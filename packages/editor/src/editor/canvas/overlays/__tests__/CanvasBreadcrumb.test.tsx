/**
 * CanvasBreadcrumb — the ancestor-path computation (getElementName + chain
 * walk + "Canvas" root prepend + isCurrent flag). Visual chrome is not asserted.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import type { Composer } from "@/engine";
import { CanvasBreadcrumb } from "../CanvasBreadcrumb";

interface El {
  getId: () => string;
  getType: () => string;
  getTagName: () => string;
  getParent: () => El | null;
}

function el(id: string, type: string, parent: El | null): El {
  return {
    getId: () => id,
    getType: () => type,
    getTagName: () => type,
    getParent: () => parent,
  };
}

// section > button(selected)
const section = el("sec-1", "section", null);
const button = el("btn-1", "button", section);

function makeComposer(selectedEl: El | null): Composer {
  return {
    elements: {
      getElement: (id: string) => (id === "btn-1" ? selectedEl : null),
    },
  } as unknown as Composer;
}

describe("CanvasBreadcrumb — empty states", () => {
  it("renders nothing when nothing is selected", () => {
    const { container } = render(
      <CanvasBreadcrumb composer={makeComposer(button)} selectedId={null} onSelectElement={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("CanvasBreadcrumb — path building", () => {
  it("renders the Canvas root plus the full ancestor chain", () => {
    render(
      <CanvasBreadcrumb
        composer={makeComposer(button)}
        selectedId="btn-1"
        onSelectElement={vi.fn()}
      />
    );
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
  });

  it("selects an ancestor segment on click but not the current or root segment", () => {
    const onSelectElement = vi.fn();
    render(
      <CanvasBreadcrumb
        composer={makeComposer(button)}
        selectedId="btn-1"
        onSelectElement={onSelectElement}
      />
    );

    // Ancestor (section) is clickable → fires with its id
    fireEvent.click(screen.getByText("Section"));
    expect(onSelectElement).toHaveBeenCalledWith("sec-1");

    // Current element (button) is guarded → no additional call
    onSelectElement.mockClear();
    fireEvent.click(screen.getByText("Button"));
    expect(onSelectElement).not.toHaveBeenCalled();

    // Canvas root is disabled → no call
    fireEvent.click(screen.getByText("Canvas"));
    expect(onSelectElement).not.toHaveBeenCalled();
  });
});
