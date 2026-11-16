/**
 * ComponentSourcePickBar — 2L9 B6-K13 (217:40475) and B6-K14 (217:40648):
 * the bar over the canvas while a component's source is being chosen.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "@/shared/constants";
import { ComponentSourcePickBar } from "../ComponentSourcePickBar";
import { beginUpdateFromSelection, chooseOnCanvas, getSourcePick } from "@/editor/sidebar/tabs/component-library/sourcePick";

function setup() {
  const listeners = new Map<string, Set<(p?: unknown) => void>>();
  let selected: string[] = [];
  const node = (id: string, parent: unknown, locked = false) => ({
    getId: () => id,
    getType: () => "section",
    getParent: () => parent,
    getChildren: () => [],
    isLocked: () => locked,
    getCustomData: () => undefined,
  });
  const root = node("root", null);
  const sec = node("sec", root);
  const locked = node("locked", root, true);
  Object.assign(root, { getChildren: () => [locked, sec] });
  const nodes: Record<string, unknown> = { root, sec, locked };
  const composer = {
    emit: vi.fn((e: string, p?: unknown) => listeners.get(e)?.forEach((fn) => fn(p))),
    on: (e: string, fn: (p?: unknown) => void) => listeners.set(e, (listeners.get(e) ?? new Set()).add(fn)),
    off: (e: string, fn: (p?: unknown) => void) => listeners.get(e)?.delete(fn),
    selection: { getSelectedIds: () => selected },
    elements: { getElement: (id: string) => nodes[id] ?? null, getAllPages: () => [{ id: "home", name: "Home", root: { id: "root" } }] },
    components: { getComponent: () => ({ id: "c1", name: "Hero card" }), findInstanceContainingElement: () => null },
  };
  const select = (ids: string[]) =>
    act(() => {
      selected = ids;
      composer.emit(EVENTS.ELEMENT_SELECTED);
    });
  return { composer: composer as never, raw: composer, select };
}

describe("ComponentSourcePickBar (B6-K13 / K14)", () => {
  it("is absent unless a source is being picked", () => {
    const { composer } = setup();
    render(<ComponentSourcePickBar composer={composer} />);
    expect(screen.queryByTestId("comp-source-pick-bar")).toBeNull();
    act(() => beginUpdateFromSelection(composer, "c1"));
    expect(screen.queryByTestId("comp-source-pick-bar")).toBeNull();
  });

  it("asks for a section, ignores what cannot be a source, then names the one chosen", () => {
    const { composer, raw, select } = setup();
    render(<ComponentSourcePickBar composer={composer} />);
    act(() => {
      beginUpdateFromSelection(composer, "c1");
      chooseOnCanvas(composer);
    });
    expect(screen.getByTestId("comp-source-pick-message").textContent).toBe(
      "Choose the section to update Hero card from. Locked and nested component content can’t be chosen.",
    );
    expect(screen.getByTestId("comp-source-pick-return")).toBeDisabled();
    select(["locked"]);
    expect(screen.getByTestId("comp-source-pick-return")).toBeDisabled();
    select(["sec"]);
    expect(screen.getByTestId("comp-source-pick-message").textContent).toBe("Section 2 on Home is selected as the source for Hero card.");
    fireEvent.click(screen.getByTestId("comp-source-pick-return"));
    expect(getSourcePick(composer)?.phase).toBe("review");
    expect(raw.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
    expect(screen.queryByTestId("comp-source-pick-bar")).toBeNull();
  });

  it("Cancel ends the session and brings Components back", () => {
    const { composer, raw } = setup();
    render(<ComponentSourcePickBar composer={composer} />);
    act(() => {
      beginUpdateFromSelection(composer, "c1");
      chooseOnCanvas(composer);
    });
    fireEvent.click(screen.getByTestId("comp-source-pick-cancel"));
    expect(getSourcePick(composer)).toBeNull();
    expect(raw.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "components" });
  });
});
