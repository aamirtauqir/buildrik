// @vitest-environment jsdom
/**
 * LayersPanel — single-row Delete / Cut / Copy run the ENGINE commands
 * (audit 2026-10-08 P1-1). The single-row branch used to call
 * `removeElement` directly, which has no lock check: the row menu deleted a
 * locked element the keyboard Delete in the same panel refused.
 *
 * Setup copied from LayersPanel.deleteSelection.test.tsx —
 * (original docblock) deleting a multi-selection (boards 6881:71323 → 6887:78291 →
 * 6881:71749; audit G2-068, decision 17).
 *
 * The selection banner and its inline "Delete 3 layers?" strip are gone. With
 * three rows selected, the context menu on one of them reads "Delete · 3
 * elements"; choosing it opens the one confirm ("Delete 3 elements?" · "This
 * removes A, B and C." · Cancel · "Delete 3 elements"); confirming runs the
 * engine's delete (one transaction) and toasts "3 elements deleted" with
 * Undo. One selected row deletes at once, no dialog.
 *
 * A REAL Composer: the panel reaches the engine through seven hooks, and a
 * stub wide enough for all of them would be a second engine.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { LayersPanel } from "../index";

beforeAll(() => {
  /* A real Composer builds MediaManager → MediaOptimizer, which wants a 2d
     canvas context jsdom does not have (same stub the engine's own
     Composer tests carry). */
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: vi.fn((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});
afterEach(cleanup);

const SEED = [
  { id: "lx-heading", type: "heading", name: "Heading" },
  { id: "lx-subtitle", type: "text", name: "Subtitle" },
  { id: "lx-menu", type: "container", name: "Menu previews" },
  { id: "lx-footer", type: "container", name: "Footer" },
];

function seeded(): Composer {
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "lx-page",
    root: { id: "lx-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  for (const s of SEED) {
    const el = c.elements.createElement(s.type as never, { id: s.id, content: s.name });
    c.elements.addElement(el, page.root.id);
  }
  /* History coalesces rapid changes (~500 ms); the seed must be its own step
     before the delete is (engine/AGENTS.md). */
  c.history.flushPending();
  return c;
}

function mount(select: string[], locked: string[] = []) {
  const composer = seeded();
  for (const id of locked) composer.elements.getElement(id)!.setLocked(true);
  composer.history.flushPending();
  act(() => {
    if (select.length > 1) {
      composer.selection.selectMultiple(select.map((id) => composer.elements.getElement(id)!));
    } else if (select.length === 1) {
      composer.selection.select(composer.elements.getElement(select[0])!);
    }
  });
  render(
    <ToastProvider>
      <LayersPanel composer={composer} selectedElement={null} />
    </ToastProvider>,
  );
  return composer;
}

const has = (c: Composer, id: string) => Boolean(c.elements.getElement(id));

describe("LayersPanel — single-row Delete/Cut go through the engine lock gate", () => {
  it("Delete on a locked row is refused, and says so", () => {
    const composer = mount([], ["lx-footer"]);
    const skipped = vi.fn();
    composer.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-delete"));
    });
    expect(has(composer, "lx-footer")).toBe(true);
    expect(skipped).toHaveBeenCalled();
  });

  it("Delete on a row inside a component instance is refused (L2-004)", () => {
    const composer = mount([]);
    vi.spyOn(composer.components, "findInstanceContainingElement").mockImplementation((id: string) =>
      id === "lx-footer" ? ({ id: "inst-1", elementId: "lx-menu" } as never) : null,
    );
    const skipped = vi.fn();
    composer.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-delete"));
    });
    expect(has(composer, "lx-footer")).toBe(true);
    expect(skipped).toHaveBeenCalled();
  });

  it("Cut on a locked row is refused and leaves the element in place", () => {
    const composer = mount([], ["lx-footer"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-cut"));
    });
    expect(has(composer, "lx-footer")).toBe(true);
  });

  it("Delete on an unlocked row still deletes it in one undo step", () => {
    const composer = mount([]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-delete"));
    });
    expect(has(composer, "lx-footer")).toBe(false);
    composer.history.flushPending();
    act(() => composer.history.undo());
    expect(has(composer, "lx-footer")).toBe(true);
  });

  it("Cut on an unlocked row removes it and puts it on the clipboard", () => {
    const composer = mount([]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-cut"));
    });
    expect(has(composer, "lx-footer")).toBe(false);
    expect(composer.clipboard).toHaveLength(1);
  });

  it("Copy on a row runs the engine copy (CLIPBOARD_COPY fires)", () => {
    const composer = mount([]);
    const copied = vi.fn();
    composer.on(EVENTS.CLIPBOARD_COPY, copied);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-copy"));
    });
    expect(copied).toHaveBeenCalledTimes(1);
    expect(composer.clipboard).toHaveLength(1);
  });
});
