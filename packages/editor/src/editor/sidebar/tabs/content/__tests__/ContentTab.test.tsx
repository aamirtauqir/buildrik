/**
 * ContentTab tests — drill-in routing over a fake engine: root sections +
 * counts, empty state (board 149:7), collection → record save, fields add,
 * variables add (registers the live "site" source), conditions list + remove
 * + pick-to-create.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { ContentTab } from "../ContentTab";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

type Handler = (p: unknown) => void;

function makeEngine(opts?: { collections?: CMSCollection[]; items?: CMSContentItem[] }) {
  const collections = opts?.collections ?? [];
  let items = opts?.items ?? [];
  const listeners = new Map<string, Set<Handler>>();
  const sources = new Map<string, { id: string; name: string; type: string; data?: unknown }>();
  const elements: Array<{
    getId: () => string;
    getType: () => string;
    getContent: () => string;
    getDataBindings: () => Record<string, unknown>;
    removeDataBinding: (p: string) => void;
  }> = [];
  const composer = {
    on: (ev: string, fn: Handler) => (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn),
    off: (ev: string, fn: Handler) => listeners.get(ev)?.delete(fn),
    emit: (ev: string, p?: unknown) => listeners.get(ev)?.forEach((fn) => fn(p)),
    getProjectMetadata: () => ({ name: "test-proj" }),
    elements: {
      getAllElements: () => elements,
      getElement: (id: string) => elements.find((e) => e.getId() === id) ?? null,
    },
    selection: { select: vi.fn() },
    data: {
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
      },
    },
  };
  return { composer, elements, sources };
}

const MENU = {
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

const ITEM: CMSContentItem = {
  id: "it-1",
  collectionId: "col-1",
  data: { name: "Margherita", price: "$12", pub: true },
  status: "published",
  createdAt: "",
  updatedAt: "",
};

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("ContentTab", () => {
  it("empty project shows the board 149:7 empty state with the create CTA", async () => {
    const { composer } = makeEngine();
    render(<ContentTab composer={composer as never} onCreateCollection={vi.fn()} />);
    expect(await screen.findByTestId("content-empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a collection" })).toBeInTheDocument();
  });

  it("root lists collections with record counts and the Data rows", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    render(<ContentTab composer={composer as never} />);
    expect(await screen.findByText("Menu items")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("1").length).toBeGreaterThan(0)); // record count
    for (const row of ["Sources", "Variables", "Conditions"]) {
      expect(screen.getByText(row)).toBeInTheDocument();
    }
  });

  it("drills into a collection, opens a record, saves edits back through the engine", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Menu items"));
    expect(await screen.findByText("1 record")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Margherita"));
    const nameInput = await screen.findByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Margherita Extra" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(composer.cms.collections.updateContentItem).toHaveBeenCalledWith(
        "it-1",
        expect.objectContaining({
          data: expect.objectContaining({ name: "Margherita Extra" }),
          status: "published",
        }),
      ),
    );
  });

  it("fields view lists types + required and adds a field through the engine", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Menu items"));
    fireEvent.click(screen.getByText("Fields"));
    expect(await screen.findByText("Published?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Add field" }));
    fireEvent.change(screen.getByLabelText("Field name"), { target: { value: "Photo URL" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() =>
      expect(composer.cms.collections.addField).toHaveBeenCalledWith(
        "col-1",
        expect.objectContaining({ name: "Photo URL", slug: "photo-url", type: "text" }),
      ),
    );
  });

  it("variables: add registers the live 'site' source and persists", async () => {
    localStorage.setItem(
      "buildrick-site-variables-test-proj",
      JSON.stringify([{ key: "name", value: "Bella Cucina" }]),
    );
    const { composer, sources } = makeEngine();
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Variables"));
    expect(await screen.findByText("{{site.name}}")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ New variable" }));
    fireEvent.change(screen.getByLabelText("Variable key"), { target: { value: "phone" } });
    fireEvent.change(screen.getByLabelText("Variable value"), { target: { value: "+44 20" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText("{{site.phone}}")).toBeInTheDocument();
    expect(sources.get("site")?.data).toEqual({ name: "Bella Cucina", phone: "+44 20" });
    expect(JSON.parse(localStorage.getItem("buildrick-site-variables-test-proj") ?? "[]")).toHaveLength(2);
  });

  it("conditions: lists element condition bindings with summaries and removes them", async () => {
    const { composer, elements } = makeEngine({ collections: [MENU], items: [] });
    const removeDataBinding = vi.fn();
    elements.push({
      getId: () => "el-9",
      getType: () => "badge",
      getContent: () => "Sold out",
      getDataBindings: () => ({
        condition: {
          type: "condition",
          sourceId: "",
          path: "",
          condition: { operator: "==", left: "available", right: "false" },
        },
      }),
      removeDataBinding,
    });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Conditions"));
    expect(await screen.findByText("when available is false")).toBeInTheDocument();
    expect(screen.getByText(/badge · Sold out/)).toBeInTheDocument();
    /* Board 151:87 puts the row actions behind a `⋯`, so removal is two
       clicks now: open the row menu, then choose. */
    fireEvent.click(screen.getByRole("button", { name: /Actions for/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove condition" }));
    expect(removeDataBinding).toHaveBeenCalledWith("condition");
  });

  it("condition create: pick result opens the form and binds through the engine", async () => {
    const { composer, elements } = makeEngine({ collections: [MENU], items: [] });
    elements.push({
      getId: () => "el-5",
      getType: () => "section",
      getContent: () => "",
      getDataBindings: () => ({}),
      removeDataBinding: vi.fn(),
    });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Conditions"));
    fireEvent.click(screen.getByRole("button", { name: "+ New condition" }));
    act(() => composer.emit("inspector:pick-result", "el-5"));
    const path = await screen.findByLabelText("Condition path");
    fireEvent.change(path, { target: { value: "site.open" } });
    fireEvent.change(screen.getByLabelText("Condition value"), { target: { value: "true" } });
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    expect(composer.data.bindCondition).toHaveBeenCalledWith(
      elements[0],
      expect.objectContaining({ operator: "==", left: "site.open", right: "true" }),
    );
  });

  it("sources: JSON import goes through importSampleData; bad JSON shows the error", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    render(<ContentTab composer={composer as never} />);
    fireEvent.click(await screen.findByText("Sources"));
    // Board 151:46 names this "+ Connect a source".
    fireEvent.click(await screen.findByRole("button", { name: "+ Connect a source" }));
    const box = screen.getByLabelText("Source JSON");
    fireEvent.change(box, { target: { value: "{nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not valid JSON");
    fireEvent.change(box, { target: { value: '{"products": [{"name": "A"}]}' } });
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    await waitFor(() => expect(composer.data.importSampleData).toHaveBeenCalled());
    expect(await screen.findByText("products")).toBeInTheDocument();
  });
});
