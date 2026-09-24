/**
 * G2-139: the inspector header names the element by its layer name (or its
 * type) and renames it in place — the same name Layers, the canvas tag and
 * the canvas bar show.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EVENTS } from "@/shared/constants/events";
import { ElementNameField } from "../ElementNameField";

function setup(layerName?: string) {
  const handlers = new Map<string, (p: unknown) => void>();
  const data: Record<string, unknown> = { layerName };
  const el = { getCustomData: (k: string) => data[k], setData: vi.fn((k: string, v: unknown) => (data[k] = v)) };
  const composer = {
    elements: { getElement: () => el },
    markDirty: vi.fn(),
    emit: vi.fn((e: string, p: unknown) => handlers.get(e)?.(p)),
    on: (e: string, h: (p: unknown) => void) => handlers.set(e, h),
    off: (e: string) => handlers.delete(e),
  };
  render(<ElementNameField composer={composer as never} elementId="e1" typeLabel="Section" />);
  return { el, composer, handlers };
}

describe("ElementNameField", () => {
  it("shows the layer name, else the type", () => {
    setup("Hero");
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Hero");
  });

  it("falls back to the type label", () => {
    setup();
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Section");
  });

  it("double-click edits; Enter saves through renameElement", () => {
    const { el, composer } = setup();
    fireEvent.doubleClick(screen.getByTestId("inspector-element-name"));
    const input = screen.getByRole("textbox", { name: "Element name" });
    fireEvent.change(input, { target: { value: "Hero" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(el.setData).toHaveBeenCalledWith("layerName", "Hero");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_RENAMED, { id: "e1", name: "Hero" });
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Hero");
  });

  it("Escape cancels", () => {
    const { el } = setup("Hero");
    fireEvent.doubleClick(screen.getByTestId("inspector-element-name"));
    const input = screen.getByRole("textbox", { name: "Element name" });
    fireEvent.change(input, { target: { value: "Other" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(el.setData).not.toHaveBeenCalled();
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Hero");
  });

  it("follows a rename made elsewhere (Layers)", () => {
    const { handlers } = setup();
    act(() => handlers.get(EVENTS.ELEMENT_RENAMED)?.({ id: "e1", name: "Menu" }));
    expect(screen.getByTestId("inspector-element-name")).toHaveTextContent("Menu");
  });
});
