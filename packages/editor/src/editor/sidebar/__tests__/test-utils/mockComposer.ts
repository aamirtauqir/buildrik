/**
 * Shared mock Composer harness for sidebar tests.
 *
 * One emitter-backed fake covering the composer surface the sidebar tabs
 * actually touch (pages CRUD, component library, selection, project
 * settings, media). Namespaces are plain objects of vi.fn stubs with just
 * enough default behavior for hook tests; anything test-specific comes in
 * via `overrides` (shallow-merged per namespace).
 *
 * Usage:
 *   const composer = createMockComposer({ pages: [pg("p1", "Home", { isHome: true })] });
 *   composer._emit(EVENTS.PROJECT_CHANGED, { type: "page:add" });
 *
 * @license BSD-3-Clause
 */

import { vi } from "vitest";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export interface MockPage {
  id: string;
  name: string;
  slug?: string;
  isHome?: boolean;
  settings?: {
    visibility?: string;
    seo?: Record<string, unknown>;
    head?: Record<string, unknown>;
  };
  updatedAt?: number;
}

export interface MockComponentDef {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface CreateMockComposerOpts {
  pages?: MockPage[];
  activePageId?: string;
  components?: MockComponentDef[];
  selectedIds?: string[];
  projectSettings?: Record<string, unknown>;
  projectMetadata?: { domain?: string | null } & Record<string, unknown>;
  /** Shallow-merged over the top-level composer object last. */
  overrides?: Record<string, unknown>;
}

/** Terse page factory for test fixtures. */
export function pg(id: string, name: string, extra: Partial<MockPage> = {}): MockPage {
  return { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), ...extra };
}

export type MockComposer = Composer & {
  _emit: (event: string, payload?: unknown) => void;
  _emitMedia: (event: string, payload?: unknown) => void;
  _pages: MockPage[];
  _components: MockComponentDef[];
};

export function createMockComposer(opts: CreateMockComposerOpts = {}): MockComposer {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const on = vi.fn((event: string, cb: (payload: unknown) => void) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(cb);
  });
  const off = vi.fn((event: string, cb: (payload: unknown) => void) => {
    listeners.get(event)?.delete(cb);
  });
  const emit = (event: string, payload?: unknown) => {
    listeners.get(event)?.forEach((cb) => cb(payload));
  };

  const pages: MockPage[] = opts.pages ? [...opts.pages] : [];
  let activePageId: string | null =
    opts.activePageId ?? (pages.length > 0 ? pages[0].id : null);
  let nextId = 1;

  const elements = {
    getAllPages: vi.fn(() => pages),
    getActivePage: vi.fn(() => pages.find((p) => p.id === activePageId) ?? null),
    setActivePage: vi.fn((id: string) => {
      activePageId = id;
      emit(EVENTS.PROJECT_CHANGED, { type: "page:activate" });
    }),
    createPage: vi.fn((name: string, extra: Partial<MockPage> = {}) => {
      const page: MockPage = { id: `pg-new-${nextId++}`, name, ...extra };
      pages.push(page);
      emit(EVENTS.PROJECT_CHANGED, { type: "page:add" });
      return page;
    }),
    duplicatePage: vi.fn((id: string) => {
      const src = pages.find((p) => p.id === id);
      if (!src) return null;
      const copy: MockPage = { ...src, id: `pg-copy-${nextId++}`, name: `${src.name} Copy`, isHome: false };
      pages.push(copy);
      emit(EVENTS.PROJECT_CHANGED, { type: "page:duplicate" });
      return copy;
    }),
    deletePage: vi.fn((id: string) => {
      const idx = pages.findIndex((p) => p.id === id);
      if (idx >= 0) pages.splice(idx, 1);
      emit(EVENTS.PROJECT_CHANGED, { type: "page:delete" });
    }),
    updatePage: vi.fn((id: string, patch: Partial<MockPage>) => {
      const page = pages.find((p) => p.id === id);
      if (page) Object.assign(page, patch);
      emit(EVENTS.PROJECT_CHANGED, { type: "page:update" });
    }),
    setHomePage: vi.fn((id: string) => {
      pages.forEach((p) => {
        p.isHome = p.id === id;
      });
      emit(EVENTS.PROJECT_CHANGED, { type: "page:home" });
    }),
  };

  const components: MockComponentDef[] = opts.components ? [...opts.components] : [];
  const componentsNs = {
    getAllComponents: vi.fn(() => components),
    getComponent: vi.fn((id: string) => components.find((c) => c.id === id) ?? null),
    updateComponent: vi.fn(async (id: string, patch: Record<string, unknown>) => {
      const c = components.find((x) => x.id === id);
      if (c) Object.assign(c, patch);
      emit(EVENTS.COMPONENT_LIST_UPDATED, { componentId: id });
    }),
    duplicateComponent: vi.fn(async (id: string) => {
      const src = components.find((x) => x.id === id);
      if (src) components.push({ ...src, id: `${id}-copy`, name: `${src.name} Copy` });
      emit(EVENTS.COMPONENT_LIST_UPDATED, { componentId: id });
    }),
    deleteComponent: vi.fn(async (id: string) => {
      const idx = components.findIndex((x) => x.id === id);
      if (idx >= 0) components.splice(idx, 1);
      emit(EVENTS.COMPONENT_LIST_UPDATED, { componentId: id });
    }),
    instantiateComponent: vi.fn(async () => {}),
  };

  const selection = {
    getSelectedIds: vi.fn(() => opts.selectedIds ?? []),
  };

  let projectSettings: Record<string, unknown> = opts.projectSettings ?? {};

  const composer = {
    on,
    off,
    emit: vi.fn(emit),
    elements,
    components: componentsNs,
    selection,
    history: { undo: vi.fn(), redo: vi.fn() },
    getProjectSettings: vi.fn(() => projectSettings),
    setProjectSettings: vi.fn((patch: Record<string, unknown>) => {
      projectSettings = { ...projectSettings, ...patch };
      emit(EVENTS.SETTINGS_CHANGE, projectSettings);
    }),
    get projectSettings() {
      return projectSettings;
    },
    saveProject: vi.fn(async () => {}),
    getProjectMetadata: vi.fn(() => opts.projectMetadata ?? { domain: null }),
    media: {
      on: vi.fn((event: string, cb: (payload: unknown) => void) => {
        if (!listeners.has(`media:${event}`)) listeners.set(`media:${event}`, new Set());
        listeners.get(`media:${event}`)!.add(cb);
      }),
      off: vi.fn((event: string, cb: (payload: unknown) => void) => {
        listeners.get(`media:${event}`)?.delete(cb);
      }),
      getAssets: vi.fn(() => []),
      uploadFile: vi.fn(async () => {}),
    },
    _emit: emit,
    _emitMedia: (event: string, payload?: unknown) => emit(`media:${event}`, payload),
    _pages: pages,
    _components: components,
    ...(opts.overrides ?? {}),
  };

  return composer as unknown as MockComposer;
}
