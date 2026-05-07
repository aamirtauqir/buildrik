import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { BindingPopover } from "../BindingPopover";

function makeComposer() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    elements: { getElement: () => null },
    styles: {},
    // No collections service — popover will render with empty state.
    // Post-D3: provide the cms facade shape so optional chaining doesn't
    // explode on partial mocks. `collections` field absent = empty state.
    cms: {},
  } as any;
}

describe("BindingPopover — Create Collection footer wires to prop", () => {
  it("invokes onOpenCreateCollection when the + Create Collection footer button is clicked", () => {
    const onOpenCreateCollection = vi.fn();
    render(
      <BindingPopover
        elementId="e1"
        composer={makeComposer()}
        onOpenCreateCollection={onOpenCreateCollection}
      />
    );

    // Open the popover via the Bind-to-collection trigger
    fireEvent.click(screen.getByLabelText(/bind to collection field/i));

    // Click the footer CTA
    fireEvent.click(screen.getByRole("button", { name: /create collection/i }));

    expect(onOpenCreateCollection).toHaveBeenCalledTimes(1);
  });

  it("does not throw when onOpenCreateCollection is omitted (optional prop)", () => {
    render(<BindingPopover elementId="e1" composer={makeComposer()} />);
    fireEvent.click(screen.getByLabelText(/bind to collection field/i));
    // Footer button still renders + handles click without prop
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /create collection/i }))
    ).not.toThrow();
  });
});
