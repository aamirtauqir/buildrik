/**
 * ContentSection — 4428:141642 CONTENT (Source ● Static ○ From CMS) and the
 * bound state 4428:149540 (Collection · Field · Preview ⌁ Bound · note).
 * G3-078: binds to the page's record (no record), text / image src / link
 * href by element type, each change one undo step.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { ContentSection } from "../ContentSection";

const MENU = {
  id: "col-1",
  name: "Menu items",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text" },
    { id: "f2", name: "Photo", slug: "photo", type: "image" },
  ],
};

function makeComposer(type = "heading", collections = [MENU]) {
  const bindings: Array<Record<string, unknown>> = [];
  const listeners = new Map<string, Set<() => void>>();
  const emit = (ev: string) => listeners.get(ev)?.forEach((f) => f());
  const composer = {
    on: (ev: string, fn: () => void) => (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn),
    off: (ev: string, fn: () => void) => listeners.get(ev)?.delete(fn),
    elements: { getElement: () => ({ getType: () => type }) },
    cms: {
      collections: { getAllCollections: () => collections },
      bindings: {
        getBindings: () => bindings,
        bindToField: vi.fn((elementId: string, collectionId: string, itemId: string | undefined, fieldSlug: string, property: string) => {
          bindings.splice(0, bindings.length, { collectionId, itemId, fieldSlug, property });
          emit("binding:created");
        }),
        unbindAll: vi.fn(() => {
          bindings.splice(0);
          emit("binding:removed");
        }),
        resolveBinding: vi.fn(() => Promise.resolve("Margherita")),
      },
    },
  };
  return composer;
}

afterEach(() => cleanup());

describe("ContentSection", () => {
  it("draws Source with Static checked when unbound", () => {
    render(<ContentSection elementId="e1" composer={makeComposer() as never} isOpen />);
    expect(screen.getByRole("radio", { name: /Static/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /From CMS/ })).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByTestId("content-cms")).toBeNull();
  });

  it("From CMS → Field binds the page's record (no record), recorded, then previews it (4428:149540)", async () => {
    const composer = makeComposer();
    render(<ContentSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByTestId("content-source-cms"));
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "name" } });
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", undefined, "name", "content", undefined, "Bind Name");
    await waitFor(() => expect(screen.getByTestId("content-preview-value")).toHaveTextContent("Margherita"));
    expect(screen.getByTestId("content-note")).toHaveTextContent("Shows the record's Name on dynamic pages and in collection lists.");
    fireEvent.click(screen.getByTestId("content-source-static"));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalledWith("e1", "Unbind Name");
    expect(screen.getByRole("radio", { name: /Static/ })).toHaveAttribute("aria-checked", "true");
  });

  it("an image binds its source", () => {
    const composer = makeComposer("image");
    render(<ContentSection elementId="img" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByTestId("content-source-cms"));
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "photo" } });
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("img", "col-1", undefined, "photo", "src", undefined, "Bind Photo");
  });

  it("with no collections offers the create door", () => {
    const create = vi.fn();
    render(<ContentSection elementId="e1" composer={makeComposer("heading", []) as never} onOpenCreateCollection={create} isOpen />);
    fireEvent.click(screen.getByTestId("content-source-cms"));
    fireEvent.click(screen.getByTestId("content-create-collection"));
    expect(create).toHaveBeenCalled();
  });
});
