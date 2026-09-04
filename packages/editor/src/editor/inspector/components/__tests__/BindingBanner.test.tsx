/**
 * BindingBanner — board 160:105.
 *
 * Binding an element needs a collection, a record and a field, so this state
 * is pinned rather than walked: what the banner says, and that Unbind reaches
 * the engine.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BindingBanner } from "../BindingBanner";

function makeComposer(bindings: { collectionId: string; fieldSlug: string }[]) {
  const unbindAll = vi.fn();
  const composer = {
    on: vi.fn(),
    off: vi.fn(),
    cms: {
      bindings: { getBindings: () => bindings, unbindAll },
      collections: { getCollection: (id: string) => ({ name: id === "c1" ? "Menu" : id }) },
    },
  } as never;
  return { composer, unbindAll };
}

afterEach(cleanup);

describe("binding banner", () => {
  it("names the element, the collection and the field", () => {
    const { composer } = makeComposer([{ collectionId: "c1", fieldSlug: "name" }]);
    render(<BindingBanner composer={composer} elementId="el-1" elementLabel="Text" />);
    expect(screen.getByText("Text is bound to Menu.name")).toBeInTheDocument();
    expect(
      screen.getByText("Edit the record in Content, or unbind to type here.")
    ).toBeInTheDocument();
  });

  it("unbinding goes to the engine, not just to local state", () => {
    const { composer, unbindAll } = makeComposer([{ collectionId: "c1", fieldSlug: "name" }]);
    render(<BindingBanner composer={composer} elementId="el-1" elementLabel="Text" />);
    fireEvent.click(screen.getByRole("button", { name: "Unbind" }));
    expect(unbindAll).toHaveBeenCalledWith("el-1");
  });

  it("says nothing about an element that follows nothing", () => {
    const { composer } = makeComposer([]);
    const { container } = render(
      <BindingBanner composer={composer} elementId="el-1" elementLabel="Text" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  /* Board 160:204 is edge-to-edge (x0, w300) at a 16px child inset, and
     "Unbind" is 11px regular text, not a boxed control at flowbite's fixed
     height. */
  it("insets the banner 16px and drops flowbite's fixed height off Unbind", () => {
    const { composer } = makeComposer([{ collectionId: "c1", fieldSlug: "name" }]);
    render(<BindingBanner composer={composer} elementId="el-1" elementLabel="Text" />);
    expect(screen.getByTestId("binding-banner").className).toContain("tw:px-4");
    const unbind = screen.getByRole("button", { name: "Unbind" });
    expect(unbind.className).toContain("tw:h-auto");
    expect(unbind.className).toContain("tw:text-[11px]");
  });
});
