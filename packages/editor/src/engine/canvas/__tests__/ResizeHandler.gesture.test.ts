// @vitest-environment jsdom
/**
 * The resize gesture (E-T2: BK-01, BK-02, BK-03, OV-E4, D3), on a real
 * Composer with the canvas at 50 % zoom — the page measures half its CSS size
 * on screen, as `transform: scale(.5)` makes it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let id: string;
const SCALE = 0.5;
const CSS = { w: 296, h: 28 };

function mount(scale: number) {
  document.body.innerHTML = `<div class="buildrick-canvas"><div data-buildrick-id="${id}"></div></div>`;
  const canvas = document.querySelector(".buildrick-canvas") as HTMLElement;
  Object.defineProperty(canvas, "offsetWidth", { value: 1000, configurable: true });
  canvas.getBoundingClientRect = () =>
    ({ x: 0, y: 0, left: 0, top: 0, right: 1000 * scale, bottom: 800 * scale, width: 1000 * scale, height: 800 * scale, toJSON: () => ({}) }) as DOMRect;
  const node = document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement;
  const w = CSS.w * scale;
  const h = CSS.h * scale;
  node.getBoundingClientRect = () =>
    ({ x: 10, y: 10, left: 10, top: 10, right: 10 + w, bottom: 10 + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
}

const styles = () => c.elements.getElement(id)!.getStyles();
const resize = () => c.canvas.resize!;
const move = (x: number, y: number) =>
  document.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, buttons: 1 }));
const up = (x: number, y: number) => document.dispatchEvent(new MouseEvent("mouseup", { clientX: x, clientY: y }));

beforeEach(() => {
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const el = c.elements.createElement("container" as never, {} as never);
  c.elements.addElement(el, root);
  id = el.getId();
  el.setStyle("width", `${CSS.w}px`);
  el.setStyle("height", `${CSS.h}px`);
  c.history.flushPending();
  mount(SCALE);
});
afterEach(() => {
  document.body.innerHTML = "";
});

describe("resize at 50 % zoom (BK-01)", () => {
  it("a press and release with no movement writes nothing", () => {
    const before = c.history.getUndoCount();
    resize().startResize(id, "se", 100, 50);
    up(100, 50);
    expect(styles()).toMatchObject({ width: "296px", height: "28px" });
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(before);
    expect(c.isTransactionActive()).toBe(false);
  });

  it("+20 screen px on the E handle is +40 CSS px on width only", () => {
    resize().startResize(id, "e", 100, 50);
    move(120, 50);
    up(120, 50);
    expect(styles().width).toBe("336px");
    expect(styles().height).toBe("28px");
  });
});

describe("cancel (BK-03)", () => {
  it("Escape restores the box and never undoes the edit before it", () => {
    c.elements.getElement(id)!.setStyle("text-align", "center");
    c.history.flushPending();
    const before = c.history.getUndoCount();
    resize().startResize(id, "e", 100, 50);
    move(160, 50);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(styles()).toMatchObject({ width: "296px", "text-align": "center" });
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(before);
    expect(c.isTransactionActive()).toBe(false);
    expect(document.querySelector<HTMLElement>(`[data-buildrick-id="${id}"]`)!.style.width).toBe("");
  });

  it("losing window focus mid-drag cancels and closes the transaction", () => {
    resize().startResize(id, "e", 100, 50);
    move(140, 50);
    window.dispatchEvent(new Event("blur"));
    expect(resize().isCurrentlyResizing()).toBe(false);
    expect(c.isTransactionActive()).toBe(false);
    expect(styles().width).toBe("296px");
  });
});

describe("one gesture at a time, never holding autosave (OV-E4, D3)", () => {
  it("a second start commits the open gesture first — never two transactions", () => {
    resize().startResize(id, "e", 100, 50);
    move(110, 50);
    resize().startResize(id, "s", 100, 50);
    expect(styles().width).toBe("316px");
    up(100, 60);
    expect(styles().height).toBe("48px");
    expect(c.isTransactionActive()).toBe(false);
  });

  it("a button released outside the window ends the drag on the next move", () => {
    resize().startResize(id, "e", 100, 50);
    move(110, 50);
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 130, clientY: 50, buttons: 0 }));
    expect(resize().isCurrentlyResizing()).toBe(false);
    expect(c.isTransactionActive()).toBe(false);
    expect(styles().width).toBe("356px");
  });
});

describe("keyboard (BK-02)", () => {
  it("arrows change one axis by CSS px; nothing non-finite is ever stored", () => {
    resize().keyboardResize(id, "right", 1);
    expect(styles().width).toBe("297px");
    expect(styles().height).toBe("28px");
    resize().keyboardResize(id, "down", 10);
    expect(styles().height).toBe("38px");
    expect(resize().startResize(id, "e", Number.NaN, Number.NaN)).toBe(false);
    expect(Object.values(styles()).some((v) => /NaN/.test(String(v)))).toBe(false);
    expect(c.isTransactionActive()).toBe(false);
  });
});
