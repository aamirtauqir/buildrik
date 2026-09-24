/**
 * A fake engine for the CMS drawer + workspace tests: collections, records,
 * DataManager sources and element condition bindings, with getters that read
 * the arrays writes mutate so a save is observable the way it is in the engine.
 *
 * @license BSD-3-Clause
 */
import { vi } from "vitest";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

type Handler = (p: unknown) => void;

export function makeEngine(opts?: {
  collections?: CMSCollection[];
  items?: CMSContentItem[];
  /** cms.bindings.export(): element id → its CMS field bindings. */
  bindings?: Record<string, Array<{ collectionId: string; fieldSlug: string; property: string }>>;
}) {
  let collections = opts?.collections ?? [];
  let items = opts?.items ?? [];
  const listeners = new Map<string, Set<Handler>>();
  let settings: Record<string, unknown> = {};
  const sources = new Map<string, { id: string; name: string; type: string; data?: unknown }>();
  const elements: Array<{
    getId: () => string;
    getType: () => string;
    getContent: () => string;
    getCustomData?: (key: string) => unknown;
    getDataBindings: () => Record<string, unknown>;
    removeDataBinding: (p: string) => void;
  }> = [];
  const updateCollection = vi.fn((id: string, updates: Record<string, unknown>) => {
    collections = collections.map((c) => (c.id === id ? { ...c, ...updates } : c));
    return Promise.resolve(collections.find((c) => c.id === id) ?? null);
  });

  const composer = {
    on: (ev: string, fn: Handler) => (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn),
    off: (ev: string, fn: Handler) => listeners.get(ev)?.delete(fn),
    emit: (ev: string, p?: unknown) => listeners.get(ev)?.forEach((fn) => fn(p)),
    getProjectMetadata: () => ({ name: "test-proj" }),
    getProjectSettings: () => settings,
    setProjectSettings: vi.fn((next: Record<string, unknown>) => {
      settings = next;
    }),
    elements: {
      getAllElements: () => elements,
      getElement: (id: string) => elements.find((e) => e.getId() === id) ?? null,
      getAllPages: () => [
        { id: "p-home", name: "Home", slug: "home", isHome: true },
        { id: "p-item", name: "Menu item", slug: "menu-item" },
      ],
    },
    selection: { select: vi.fn() },
    data: {
      /* DataManager is an emitter — the panel subscribes to its
         source:registered/updated/unregistered events so the Sources view does
         not go stale when a source changes from elsewhere. The mock omitted
         on/off, which made it a weaker DataManager than the real one. */
      on: vi.fn(),
      off: vi.fn(),
      getSource: (id: string) => sources.get(id),
      registerSource: vi.fn((s: { id: string; name: string; type: string; data?: unknown }) => {
        if (sources.has(s.id)) throw new Error(`Data source "${s.id}" already exists`);
        sources.set(s.id, s);
      }),
      updateSourceData: vi.fn((id: string, data: unknown) => {
        const s = sources.get(id);
        if (s) s.data = data;
      }),
      getAllSources: () => [...sources.values()],
      importSampleData: vi.fn((json: string) => {
        const parsed = JSON.parse(json) as Record<string, unknown>;
        for (const key of Object.keys(parsed)) {
          sources.set(key, {
            id: key,
            name: key,
            type: Array.isArray(parsed[key]) ? "array" : "object",
            data: parsed[key],
          });
        }
      }),
      bindCondition: vi.fn(),
    },
    cms: {
      bindings: { export: () => opts?.bindings ?? {} },
      collections: {
        on: vi.fn(),
        off: vi.fn(),
        initialize: vi.fn(() => Promise.resolve()),
        getAllCollections: () => collections,
        getCollection: (id: string) => collections.find((c) => c.id === id) ?? null,
        getContentItems: vi.fn((cid: string) => Promise.resolve(items.filter((i) => i.collectionId === cid))),
        createContentItem: vi.fn((cid: string, data: Record<string, unknown>) => {
          const item: CMSContentItem = {
            id: `it-${items.length + 1}`,
            collectionId: cid,
            data,
            status: "draft",
            createdAt: "",
            updatedAt: "",
          };
          items = [...items, item];
          return Promise.resolve(item);
        }),
        updateContentItem: vi.fn((id: string, updates: Partial<CMSContentItem>) => {
          items = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
          return Promise.resolve(items.find((i) => i.id === id) ?? null);
        }),
        deleteContentItem: vi.fn(() => Promise.resolve(true)),
        addField: vi.fn(() => Promise.resolve(null)),
        deleteField: vi.fn(() => Promise.resolve(true)),
        /* Mutates the array the getters read from, so a save is observable the
           way it is in the engine — a spy that only records the call would pass
           even if the panel never re-read the collection. */
        updateCollection,
        deleteCollection: vi.fn((id: string) => {
          collections = collections.filter((c) => c.id !== id);
          items = items.filter((i) => i.collectionId !== id);
          return Promise.resolve(true);
        }),
      },
    },
  };
  return { composer, elements, sources, updateCollection };
}

export const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1 },
    { id: "f3", name: "Published?", slug: "pub", type: "boolean", order: 2 },
  ],
  displayField: "name",
} as unknown as CMSCollection;

export const ITEM: CMSContentItem = {
  id: "it-1",
  collectionId: "col-1",
  data: { name: "Margherita", price: "$12", pub: true },
  status: "published",
  createdAt: "",
  updatedAt: "",
};

