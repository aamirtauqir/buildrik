// @vitest-environment jsdom
/**
 * Snap-to-grid is a setting the product offers twice — the ⌘K command "Toggle
 * Snap to Grid" and the Project Settings checkbox — and both wrote a flag the
 * resize path never read: `snap` was built from DEFAULT_SNAP_CONFIG
 * (snapToGrid: false) merged with `options.snap`, and no caller passes
 * `options.snap` (useCanvasResize sends only modifiers). Turning the setting on
 * changed nothing about a resize.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResizeHandler } from "../ResizeHandler";

const ID = "el-1";

function mountElement() {
  document.body.innerHTML = `<div class="buildrick-canvas"><div data-buildrick-id="${ID}"></div></div>`;
  const node = document.querySelector(`[data-buildrick-id="${ID}"]`) as HTMLElement;
  node.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 100, width: 200, height: 100, toJSON: () => ({}) }) as DOMRect;
  return node;
}

function makeHandler(snapToGrid: boolean, opts: { emit?: () => void } = {}) {
  const element = { getType: () => "container", getId: () => ID, getStyles: () => ({}) };
  const composer = {
    elements: { getElement: (id: string) => (id === ID ? element : null) },
    getState: () => ({ snapToGrid }),
    emit: opts.emit ?? vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  } as never;
  return new ResizeHandler(composer);
}

/** The config the orchestrator actually reads for this drag. */
const snapOf = (h: ResizeHandler) =>
  (h as unknown as { resizeState: { snap: { snapToGrid: boolean; gridSize: number } } | null }).resizeState?.snap;

beforeEach(() => mountElement());
afterEach(() => { document.body.innerHTML = ""; });

describe("ResizeHandler — the project's snap setting reaches the resize", () => {
  it("carries snapToGrid=true into the drag when the project has it on", () => {
    const h = makeHandler(true);
    expect(h.startResize(ID, "se", 200, 100)).toBe(true);
    expect(snapOf(h)?.snapToGrid).toBe(true);
  });

  it("carries snapToGrid=false when the project has it off", () => {
    const h = makeHandler(false);
    expect(h.startResize(ID, "se", 200, 100)).toBe(true);
    expect(snapOf(h)?.snapToGrid).toBe(false);
  });

  it("still lets an explicit per-drag option win", () => {
    const h = makeHandler(true);
    h.startResize(ID, "se", 200, 100, { snap: { snapToGrid: false, gridSize: 8 } });
    expect(snapOf(h)?.snapToGrid).toBe(false);
    expect(snapOf(h)?.gridSize).toBe(8);
  });
});
