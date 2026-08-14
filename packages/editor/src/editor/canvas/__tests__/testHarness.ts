/**
 * Canvas test harness — shared fixtures for canvas hook/component tests.
 *
 * One consistent mock of the composer boundary (per canvas test spec):
 * every canvas test that needs a composer builds it here and overrides
 * only the branches it exercises. Also provides a DataTransfer polyfill
 * (jsdom has no DataTransfer constructor) and DOM fixture helpers.
 *
 * NOT a test file — vitest only picks up *.test/spec.* names.
 *
 * @license BSD-3-Clause
 */

import { vi } from "vitest";
import type { Composer } from "../../../engine";

// =============================================================================
// DataTransfer polyfill
// =============================================================================

/**
 * Minimal DataTransfer stand-in. jsdom never implemented the DataTransfer
 * constructor, and real browsers zero the store outside the synchronous drop
 * handler — tests that need to prove the "snapshot synchronously" invariant
 * can call `zeroOut()` to simulate the browser behavior.
 */
export class TestDataTransfer {
  private store = new Map<string, string>();
  effectAllowed = "none";
  dropEffect = "none";
  files: File[] = [];
  setDragImage = vi.fn();

  setData(type: string, value: string): void {
    this.store.set(type, value);
  }

  getData(type: string): string {
    return this.store.get(type) ?? "";
  }

  clearData(type?: string): void {
    if (type) this.store.delete(type);
    else this.store.clear();
  }

  get types(): string[] {
    return [...this.store.keys()];
  }

  /** Simulate the browser zeroing the store after the sync drop handler. */
  zeroOut(): void {
    this.store.clear();
  }
}

// =============================================================================
// DOM fixtures
// =============================================================================

export function stubRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

export interface MakeCanvasOptions {
  /** Attach to document.body (default true) */
  attach?: boolean;
  rect?: DOMRect;
}

/** A canvas container div with a deterministic bounding rect. */
export function makeCanvas(options: MakeCanvasOptions = {}): HTMLDivElement {
  const { attach = true, rect = stubRect(0, 0, 1000, 800) } = options;
  const div = document.createElement("div");
  div.className = "buildrick-canvas";
  div.getBoundingClientRect = () => rect;
  if (attach) document.body.appendChild(div);
  return div;
}

export function makeCanvasRef(
  options: MakeCanvasOptions = {},
): React.RefObject<HTMLDivElement | null> {
  return { current: makeCanvas(options) };
}

/** DOM node carrying a data-buildrick-id, with a mocked bounding rect. */
export function makeDomElement(
  id: string,
  rect: DOMRect = stubRect(0, 0, 100, 50),
  tagName = "div",
): HTMLElement {
  const el = document.createElement(tagName);
  el.setAttribute("data-buildrick-id", id);
  el.getBoundingClientRect = () => rect;
  return el;
}

// =============================================================================
// Engine element stubs
// =============================================================================

export interface ElementStubOptions {
  id?: string;
  type?: string;
  parent?: ElementStub | null;
  children?: ElementStub[];
  locked?: boolean;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
}

export interface ElementStub {
  getId: () => string;
  getType: ReturnType<typeof vi.fn>;
  getParent: ReturnType<typeof vi.fn>;
  getChildren: ReturnType<typeof vi.fn>;
  getChildCount: ReturnType<typeof vi.fn>;
  getChildIndex: ReturnType<typeof vi.fn>;
  getDescendants: ReturnType<typeof vi.fn>;
  getStyles: ReturnType<typeof vi.fn>;
  getStyle: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  toJSON: ReturnType<typeof vi.fn>;
  isLocked: ReturnType<typeof vi.fn>;
  setLocked: ReturnType<typeof vi.fn>;
  isContainer: ReturnType<typeof vi.fn>;
  canHaveChildren: ReturnType<typeof vi.fn>;
  canBeWrapped: ReturnType<typeof vi.fn>;
  canBeUnwrapped: ReturnType<typeof vi.fn>;
  wrap: ReturnType<typeof vi.fn>;
  unwrap: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  /** Mutable — tests re-point parents/children mid-scenario. */
  _children: ElementStub[];
  _parent: ElementStub | null;
}

export function makeElementStub(options: ElementStubOptions = {}): ElementStub {
  const {
    id = "el-1",
    type = "container",
    parent = null,
    children = [],
    locked = false,
    styles = {},
    attributes = {},
  } = options;

  const stub: ElementStub = {
    getId: () => id,
    getType: vi.fn(() => type),
    getParent: vi.fn(() => stub._parent),
    getChildren: vi.fn(() => stub._children),
    getChildCount: vi.fn(() => stub._children.length),
    getChildIndex: vi.fn((child: ElementStub) => stub._children.indexOf(child)),
    getDescendants: vi.fn(() => []),
    getStyles: vi.fn(() => styles),
    getStyle: vi.fn((key: string) => styles[key]),
    setStyle: vi.fn((key: string, value: string) => {
      styles[key] = value;
    }),
    getAttribute: vi.fn((key: string) => attributes[key]),
    setAttribute: vi.fn((key: string, value: string) => {
      attributes[key] = value;
    }),
    setContent: vi.fn(),
    toJSON: vi.fn(() => ({ id, type })),
    isLocked: vi.fn(() => locked),
    setLocked: vi.fn(),
    isContainer: vi.fn(() => type === "container" || type === "section"),
    canHaveChildren: vi.fn(() => true),
    canBeWrapped: vi.fn(() => true),
    canBeUnwrapped: vi.fn(() => true),
    wrap: vi.fn(),
    unwrap: vi.fn(),
    remove: vi.fn(),
    _children: children,
    _parent: parent,
  };
  return stub;
}

/** Wire a parent stub to its children (sets each child's _parent). */
export function linkChildren(parent: ElementStub, children: ElementStub[]): void {
  parent._children = children;
  for (const child of children) child._parent = parent;
}

// =============================================================================
// Composer stub
// =============================================================================

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

export interface ComposerStub {
  elements: {
    getActivePage: ReturnType<typeof vi.fn>;
    getElement: ReturnType<typeof vi.fn>;
    getAllElements: ReturnType<typeof vi.fn>;
    removeElement: ReturnType<typeof vi.fn>;
    duplicateElement: ReturnType<typeof vi.fn>;
    moveElement: ReturnType<typeof vi.fn>;
    addElement: ReturnType<typeof vi.fn>;
    createElement: ReturnType<typeof vi.fn>;
    pasteElement: ReturnType<typeof vi.fn>;
    groupElements: ReturnType<typeof vi.fn>;
    ungroupElement: ReturnType<typeof vi.fn>;
  };
  selection: {
    select: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    selectAll: ReturnType<typeof vi.fn>;
    selectMultiple: ReturnType<typeof vi.fn>;
    getSelectedIds: ReturnType<typeof vi.fn>;
    getSelected: ReturnType<typeof vi.fn>;
    reselect: ReturnType<typeof vi.fn>;
  };
  history: { undo: ReturnType<typeof vi.fn>; redo: ReturnType<typeof vi.fn> };
  canvas: {
    drag: {
      start: ReturnType<typeof vi.fn>;
      move: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
    };
    indicators: {
      calculateSmartGuides: ReturnType<typeof vi.fn>;
      calculateSnapPoints: ReturnType<typeof vi.fn>;
    };
  };
  media: { uploadFile: ReturnType<typeof vi.fn> };
  mediaOps: { insertMediaAt: ReturnType<typeof vi.fn> };
  commands: { run: ReturnType<typeof vi.fn> };
  designSystem: {
    tokenBindingResolver: { resolveForElements: ReturnType<typeof vi.fn> };
  };
  collab: { manager: { startSession: ReturnType<typeof vi.fn> } };
  beginTransaction: ReturnType<typeof vi.fn>;
  endTransaction: ReturnType<typeof vi.fn>;
  rollbackTransaction: ReturnType<typeof vi.fn>;
  saveProject: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  /** Canvas reads it to choose between the empty-state CTA and the loading
      placeholders (board 65:412). A composer without it is not a composer. */
  isProjectLoading: ReturnType<typeof vi.fn>;
  clipboard: unknown;
  styleClipboard: Record<string, string> | undefined;
}

/**
 * Build the canonical composer stub. Sections passed in `overrides` are
 * shallow-merged over the defaults so tests only spell out what they use.
 */
export function makeComposer(overrides: DeepPartial<ComposerStub> = {}): ComposerStub {
  const base: ComposerStub = {
    elements: {
      getActivePage: vi.fn(() => ({ id: "page-1", root: { id: "root-1" } })),
      getElement: vi.fn(() => null),
      getAllElements: vi.fn(() => []),
      removeElement: vi.fn(),
      duplicateElement: vi.fn(),
      moveElement: vi.fn(),
      addElement: vi.fn(),
      createElement: vi.fn(),
      pasteElement: vi.fn(),
      groupElements: vi.fn(),
      ungroupElement: vi.fn(),
    },
    selection: {
      select: vi.fn(),
      clear: vi.fn(),
      selectAll: vi.fn(),
      selectMultiple: vi.fn(),
      getSelectedIds: vi.fn(() => []),
      getSelected: vi.fn(() => null),
      reselect: vi.fn(),
    },
    history: { undo: vi.fn(), redo: vi.fn() },
    canvas: {
      drag: { start: vi.fn(), move: vi.fn(), end: vi.fn(), cancel: vi.fn() },
      indicators: {
        calculateSmartGuides: vi.fn(() => []),
        calculateSnapPoints: vi.fn(() => []),
      },
    },
    media: { uploadFile: vi.fn(() => Promise.resolve({ success: true, asset: { src: "" } })) },
    mediaOps: { insertMediaAt: vi.fn(() => true) },
    commands: { run: vi.fn() },
    designSystem: { tokenBindingResolver: { resolveForElements: vi.fn(() => []) } },
    collab: { manager: { startSession: vi.fn(() => Promise.resolve()) } },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    saveProject: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isProjectLoading: vi.fn(() => false),
    clipboard: null,
    styleClipboard: undefined,
  };

  for (const key of Object.keys(overrides) as (keyof ComposerStub)[]) {
    const value = overrides[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof base[key] === "object" &&
      base[key] !== null
    ) {
      Object.assign(base[key] as object, value);
    } else {
      (base as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return base;
}

/** Cast helper — the hooks take the real Composer type. */
export function asComposer(stub: ComposerStub): Composer {
  return stub as unknown as Composer;
}
