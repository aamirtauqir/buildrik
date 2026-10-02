/**
 * P-7b — per-element scroll memory.
 *
 * The memory saved the PREVIOUS element's scrollTop in an effect that ran
 * after the NEW element's content had rendered into the same scroll
 * container. A shorter body had already clamped scrollTop by then, so A's
 * saved position was B's clamp, and coming back to A landed near the top —
 * measured live, the memory never worked. The stub body below reproduces the
 * browser's clamp (and the scroll event it fires) on each element switch.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, act, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";

/* Tallest scrollTop each element's body allows. */
const MAX: Record<string, number> = { "el-1": 1000, "el-2": 40 };

vi.mock("../InspectorErrorBoundary", () => ({
  InspectorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../../tabs/InspectorTabContent", () => ({
  InspectorTabContent: ({ selectedElement }: { selectedElement: { id: string } | null }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
      const scroller = ref.current?.closest(".bdi-panel-scroll") as HTMLElement | null;
      if (!scroller || !selectedElement) return;
      const max = MAX[selectedElement.id] ?? 0;
      if (scroller.scrollTop > max) {
        scroller.scrollTop = max;
        scroller.dispatchEvent(new Event("scroll"));
      }
    }, [selectedElement?.id]);
    return <div ref={ref} data-testid="inspector-body" />;
  },
}));
vi.mock("../../sections/ComponentRow", () => ({ ComponentRow: () => null }));
vi.mock("../InspectorElementMenu", () => ({ InspectorElementMenu: () => null }));
vi.mock("../DeleteConfirmModal", () => ({ DeleteConfirmModal: () => null }));

import { ProInspector } from "@/editor/inspector/ProInspector";

type Handler = (p: unknown) => void;

function makeComposer() {
  const listeners = new Map<string, Set<Handler>>();
  return {
    on: vi.fn((ev: string, fn: Handler) => {
      (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn);
    }),
    off: vi.fn((ev: string, fn: Handler) => listeners.get(ev)?.delete(fn)),
    emit: vi.fn((ev: string, p?: unknown) => listeners.get(ev)?.forEach((fn) => fn(p))),
    isProjectLoading: () => false,
    elements: {
      getElement: () => ({
        getStyles: () => ({}),
        getClasses: () => [],
        getCustomData: () => undefined,
        getId: () => "el-1",
        getParent: () => null,
        getTagName: () => "button",
        getType: () => "button",
      }),
      // Two same-type peers besides the selected element — the banner reads
      // "all 3 buttons" (peers + this one), and ScopeDropdown's "All like
      // this" option is only enabled when peers.length > 0.
      getAllElements: () => [
        { getId: () => "el-1", getType: () => "button" },
        { getId: () => "el-2", getType: () => "button" },
        { getId: () => "el-3", getType: () => "button" },
      ],
    },
    selection: {
      select: vi.fn(),
      selectParent: vi.fn(),
      getSelected: () => null,
      getAllSelected: () => [],
    },
    styles: {
      getBreakpointStyle: () => ({}),
      getRule: () => undefined,
      getGlobalClasses: () => [],
    },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  };
}

const el = (id: string) => ({ id, type: "button", tagName: "button" });
const frame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));

afterEach(() => cleanup());

describe("ProInspector — per-element scroll memory (P-7b)", () => {
  it("returning to an element restores where it was scrolled, even after a shorter one", async () => {
    const composer = makeComposer();
    const view = (id: string) => (
      <ProInspector selectedElement={el(id)} composer={composer as never} currentBreakpoint="desktop" />
    );
    const { container, rerender } = render(view("el-1"), { wrapper: ToastProvider });
    const scroller = container.querySelector(".bdi-panel-scroll") as HTMLElement;
    /* jsdom lays nothing out; the column on screen is 780 tall. */
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 780 });
    await frame();

    scroller.scrollTop = 600;
    fireEvent.scroll(scroller);

    rerender(view("el-2"));
    await frame();
    expect(scroller.scrollTop).toBe(0);

    rerender(view("el-1"));
    await frame();
    expect(scroller.scrollTop).toBe(600);
  });

  it("a collapsed column (a full page is open) does not overwrite the memory", async () => {
    const composer = makeComposer();
    const view = (id: string) => (
      <ProInspector selectedElement={el(id)} composer={composer as never} currentBreakpoint="desktop" />
    );
    const { container, rerender } = render(view("el-1"), { wrapper: ToastProvider });
    const scroller = container.querySelector(".bdi-panel-scroll") as HTMLElement;
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 780 });
    await frame();
    scroller.scrollTop = 600;
    fireEvent.scroll(scroller);
    /* The full page collapses the column to 0x0 and the browser clamps. */
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 0 });
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 780 });
    rerender(view("el-2"));
    await frame();
    rerender(view("el-1"));
    await frame();
    expect(scroller.scrollTop).toBe(600);
  });

  /* Measured live: the restore ran in the next frame, but the element's
     sections had not all rendered yet, so the body was too short to hold the
     offset and the browser clamped it to 0. The restore now re-applies as the
     body grows. The scroller below clamps like a browser does. */
  it("re-applies the saved offset once the body is tall enough to hold it", async () => {
    const observers: Array<() => void> = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        cb: () => void;
        constructor(cb: () => void) {
          this.cb = cb;
          observers.push(() => this.cb());
        }
        observe() {}
        unobserve() {}
        disconnect() {
          const i = observers.indexOf(this.cb);
          if (i >= 0) observers.splice(i, 1);
        }
      },
    );
    try {
      const composer = makeComposer();
      const view = (id: string) => (
        <ProInspector selectedElement={el(id)} composer={composer as never} currentBreakpoint="desktop" />
      );
      const { container, rerender } = render(view("el-1"), { wrapper: ToastProvider });
      const scroller = container.querySelector(".bdi-panel-scroll") as HTMLElement;
      Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 780 });
      let max = 1000;
      let top = 0;
      Object.defineProperty(scroller, "scrollTop", {
        configurable: true,
        get: () => top,
        set: (v: number) => {
          top = Math.max(0, Math.min(v, max));
        },
      });
      await frame();
      scroller.scrollTop = 600;
      fireEvent.scroll(scroller);

      max = 0;
      rerender(view("el-2"));
      await frame();

      /* Back on el-1, but its sections are still rendering. */
      rerender(view("el-1"));
      await frame();
      expect(scroller.scrollTop).toBe(0);
      max = 1000;
      act(() => observers.slice().forEach((fire) => fire()));
      expect(scroller.scrollTop).toBe(600);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
