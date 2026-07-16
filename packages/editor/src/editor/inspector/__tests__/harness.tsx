/**
 * Shared inspector test harness — mock element + composer factories reused
 * across the inspector UI test suite (sections, controls, components).
 *
 * Not a test file (no .test suffix) — vitest's include glob skips it.
 *
 * All spies are `vi.fn` so call args can be asserted; state-backed getters
 * (styles / attrs / content / tagName) mutate so re-reads after a write see
 * the new value, matching engine behavior closely enough for UI tests.
 *
 * @license BSD-3-Clause
 */

import { vi } from "vitest";

// ============================================================================
// ELEMENT
// ============================================================================

export interface MockElementOptions {
  id?: string;
  type?: string;
  tagName?: string;
  styles?: Record<string, string>;
  attrs?: Record<string, string>;
  classes?: string[];
  content?: string;
  parent?: MockElement | null;
  children?: MockElement[];
}

export type MockElement = ReturnType<typeof makeMockElement>;

export function makeMockElement(opts: MockElementOptions = {}) {
  const id = opts.id ?? "el-1";
  const type = opts.type ?? "container";
  const styles: Record<string, string> = { ...(opts.styles ?? {}) };
  const attrs = new Map<string, string>(Object.entries(opts.attrs ?? {}));
  let content = opts.content ?? "";
  let tagName = opts.tagName ?? "div";

  return {
    id,
    getId: vi.fn(() => id),
    getType: vi.fn(() => type),
    getTagName: vi.fn(() => tagName),
    setTagName: vi.fn((t: string) => {
      tagName = t;
    }),
    getStyles: vi.fn(() => ({ ...styles })),
    setStyle: vi.fn((prop: string, value: string) => {
      styles[prop] = value;
    }),
    removeStyle: vi.fn((prop: string) => {
      delete styles[prop];
    }),
    getAttribute: vi.fn((name: string) => attrs.get(name) ?? ""),
    setAttribute: vi.fn((name: string, value: string) => {
      attrs.set(name, value);
    }),
    removeAttribute: vi.fn((name: string) => {
      attrs.delete(name);
    }),
    getClasses: vi.fn(() => opts.classes ?? []),
    addClass: vi.fn(),
    removeClass: vi.fn(),
    getContent: vi.fn(() => content),
    setContent: vi.fn((c: string) => {
      content = c;
    }),
    getParent: vi.fn(() => opts.parent ?? null),
    getChildren: vi.fn(() => opts.children ?? []),
    addChild: vi.fn(),
    getAnimation: vi.fn(() => null),
    getInteractions: vi.fn(() => []),
  };
}

// ============================================================================
// COMPOSER
// ============================================================================

export interface MockComposerOptions {
  /** Primary element returned by elements.getElement for unknown ids. */
  element?: MockElement;
  /** Full element set — id-addressable via elements.getElement. */
  elements?: MockElement[];
  pages?: Array<{ id: string; name: string; isHome?: boolean }>;
  globalClasses?: string[];
  selected?: MockElement | null;
  allSelected?: MockElement[];
}

export type MockComposer = ReturnType<typeof makeMockComposer>;

export function makeMockComposer(opts: MockComposerOptions = {}) {
  const primary = opts.element ?? makeMockElement();
  const all = opts.elements ?? [primary];
  const byId = new Map(all.map((e) => [e.getId(), e]));

  return {
    elements: {
      getElement: vi.fn((id: string) => byId.get(id) ?? primary),
      getAllElements: vi.fn(() => all),
      getAllPages: vi.fn(() => opts.pages ?? []),
      createElement: vi.fn((type: string) => makeMockElement({ type, id: `new-${type}` })),
      removeElement: vi.fn(),
    },
    selection: {
      getSelected: vi.fn(() => opts.selected ?? null),
      getAllSelected: vi.fn(() => opts.allSelected ?? []),
      select: vi.fn(),
      clear: vi.fn(),
      selectParent: vi.fn(),
    },
    styles: {
      getBreakpointStyle: vi.fn(() => ({})),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
      getRule: vi.fn(() => undefined),
      setRule: vi.fn(),
      getGlobalClasses: vi.fn(() => opts.globalClasses ?? []),
    },
    history: { push: vi.fn() },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}
