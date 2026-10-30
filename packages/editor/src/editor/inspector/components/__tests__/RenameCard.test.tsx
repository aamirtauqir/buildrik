/**
 * RenameCard — 2L9 258:35802 (S28): the Name field, the note naming the real
 * DOM id and tag a rename leaves alone, "Rename to {name}" / Cancel; Enter
 * commits, Escape restores.
 *
 * @license BSD-3-Clause
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { RenameCard } from "../RenameCard";
import { getLayerName, renameElement } from "@/editor/panels/layers/hooks/layersPersistence";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup({ id, name }: { id?: string; name?: string } = {}) {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const made = c.elements.createElement("heading" as never, {} as never);
  c.elements.addElement(made, root);
  const el = c.elements.getElement(made.getId())!;
  el.setTagName("h1");
  if (id) el.setAttribute("id", id);
  if (name) renameElement(c, el.getId(), name);
  const onClose = vi.fn();
  render(<RenameCard composer={c} elementId={el.getId()} onClose={onClose} />);
  return { c, el, onClose, input: screen.getByRole("textbox", { name: "Name" }) };
}

describe("RenameCard (2L9 S28)", () => {
  it("names what a rename leaves alone: the real DOM id and tag", () => {
    setup({ id: "hero-title", name: "Hero heading" });
    expect(screen.getByText("Element name")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-rename-note")).toHaveTextContent(
      'Editor label only. DOM ID "hero-title" and tag H1 are unchanged. Enter commits; Escape restores “Hero heading”.',
    );
  });

  it("no DOM id: only the tag is named", () => {
    setup({ name: "Hero heading" });
    expect(screen.getByTestId("inspector-rename-note")).toHaveTextContent("Editor label only. Tag H1 is unchanged.");
  });

  it("the button names the new label; Enter commits through the Layers writer", () => {
    const { el, onClose, input } = setup({ name: "Hero heading" });
    expect(screen.getByRole("button", { name: "Rename to Hero heading" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "Opening headline" } });
    expect(screen.getByRole("button", { name: "Rename to Opening headline" })).toBeEnabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(getLayerName(el)).toBe("Opening headline");
    expect(onClose).toHaveBeenCalled();
  });

  it("Escape and Cancel close without renaming", () => {
    const { el, onClose, input } = setup({ name: "Hero heading" });
    fireEvent.change(input, { target: { value: "Other" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(getLayerName(el)).toBe("Hero heading");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(getLayerName(el)).toBe("Hero heading");
  });
});
