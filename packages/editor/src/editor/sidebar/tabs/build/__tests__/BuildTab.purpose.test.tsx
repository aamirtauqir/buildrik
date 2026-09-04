// @vitest-environment jsdom
/**
 * The Insert purpose line (IA-15) and the selection it names.
 *
 * Two things go wrong here silently, and both did:
 *
 * 1. `insertionContext` was computed, returned by useBuildTab and read by
 *    nobody, with deps `[composer]` while its body read `composer.selection`.
 *    A memo like that is not wrong until something renders it — then it names
 *    whatever was selected when the panel mounted, forever. Nothing failed,
 *    because nothing looked.
 * 2. The copy names affordances. Only the ELEMENTS group is draggable
 *    (GroupSection.tsx:189), so a blanket "drag onto the canvas" is false for
 *    blocks, components and mine rows.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import * as React from "react";
import { BuildTab, type BuildTabProps } from "../BuildTab";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

/** Minimal composer: a real listener registry plus the two reads
 *  insertionContext makes. Enough to prove the subscription, without the
 *  engine. */
function makeComposer(selected: string[], type = "container") {
  const listeners = new Map<string, Set<(p?: unknown) => void>>();
  let ids = selected;
  return {
    composer: {
      on(evt: string, fn: (p?: unknown) => void) {
        if (!listeners.has(evt)) listeners.set(evt, new Set());
        listeners.get(evt)!.add(fn);
        return this;
      },
      off(evt: string, fn: (p?: unknown) => void) {
        listeners.get(evt)?.delete(fn);
        return this; // chainable, exactly like the real EventEmitter
      },
      selection: { getSelectedIds: () => ids },
      elements: { getElement: (id: string) => (ids.includes(id) ? { getType: () => type } : null) },
    },
    select(next: string[]) {
      ids = next;
      for (const fn of listeners.get(EVENTS.ELEMENT_SELECTED) ?? []) fn();
    },
    listenerCount: () =>
      [...listeners.values()].reduce((n, set) => n + set.size, 0),
  };
}

const renderTab = (props: Partial<BuildTabProps> = {}) =>
  render(
    <ToastProvider>
      <BuildTab composer={null} onBlockClick={vi.fn()} {...props} />
    </ToastProvider>,
  );

describe("Insert purpose line", () => {
  it("says where a click lands when nothing is selected", () => {
    renderTab();
    expect(screen.getByTestId("insert-purpose").textContent).toContain(
      "at the end of the page",
    );
  });

  it("names the selected element, and updates when the selection changes", () => {
    const c = makeComposer([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderTab({ composer: c.composer as any });
    expect(screen.getByTestId("insert-purpose").textContent).toContain(
      "at the end of the page",
    );

    act(() => c.select(["el-1"]));

    // Before the selection subscription existed this still read "end of the
    // page" — the memo never recomputed. That is the regression this pins.
    expect(screen.getByTestId("insert-purpose").textContent).toContain(
      "next to Container",
    );
  });

  it("scopes the drag claim to elements, which are the only draggable rows", () => {
    renderTab();
    const text = screen.getByTestId("insert-purpose").textContent ?? "";
    expect(text).toContain("Drag elements onto the canvas");
    // A blanket claim would be false for blocks/components/mine rows.
    expect(text).not.toMatch(/drag (a row|any|it) onto/i);
  });

  it("unsubscribes on unmount — off() returns the composer, so a concise arrow would hand React a Composer as its destructor", () => {
    const c = makeComposer([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { unmount } = renderTab({ composer: c.composer as any });
    expect(c.listenerCount()).toBeGreaterThan(0);
    unmount();
    expect(c.listenerCount()).toBe(0);
  });
});
