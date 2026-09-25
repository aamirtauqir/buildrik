/**
 * renameElement — the one writer of a layer's custom name (G2-139): Layers
 * and the inspector header both go through it, so the name, the dirty flag
 * and the ELEMENT_RENAMED announcement never drift apart.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { renameElement } from "../layersPersistence";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";

function setup() {
  const setData = vi.fn();
  const composer = {
    elements: { getElement: vi.fn(() => ({ setData })) },
    markDirty: vi.fn(),
    emit: vi.fn(),
  };
  return { composer, setData };
}

describe("renameElement", () => {
  it("stores a trimmed name, marks dirty and announces it", () => {
    const { composer, setData } = setup();
    renameElement(composer as never, "e1", "  Hero  ");
    expect(setData).toHaveBeenCalledWith(LAYER_NAME_KEY, "Hero");
    expect(composer.markDirty).toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_RENAMED, { id: "e1", name: "Hero" });
  });

  it("an empty name clears it (back to the type label)", () => {
    const { composer, setData } = setup();
    renameElement(composer as never, "e1", "   ");
    expect(setData).toHaveBeenCalledWith(LAYER_NAME_KEY, undefined);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_RENAMED, { id: "e1", name: null });
  });
});
