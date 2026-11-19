/**
 * G2-118 in the Add drawer (board 4418:99857): SAVED COMPONENTS lists masters
 * in scope on the open page, FROM LIBRARY lists the workspace's shared masters,
 * and inserting one from the library links it onto this site first.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";

const sync = vi.hoisted(() => ({
  fetchComponentLibrary: vi.fn(),
  fetchLibraryComponent: vi.fn(),
}));
vi.mock("@/services/componentSync", () => sync);

import { BuildTab, type BuildTabProps } from "../BuildTab";
import { handleLibraryComponentDrop, type DropContext } from "@/editor/canvas/hooks/drag/dropOperations";
import { LIBRARY_COMPONENT_MIME } from "@/editor/sidebar/tabs/component-library/instantiate";

type Def = { id: string; name: string; pageId?: string | null };

function makeComposer(saved: Def[]) {
  const registry = new Map(saved.map((c) => [c.id, c]));
  const components = {
    getAllComponents: () => [...registry.values()],
    getComponent: (id: string) => registry.get(id),
    adoptLibraryComponent: vi.fn(async (d: Def) => {
      registry.set(d.id, { ...d, pageId: null });
      return registry.get(d.id);
    }),
    instantiateComponent: vi.fn(async () => "new-el"),
  };
  const composer = {
    on: vi.fn(), off: vi.fn(), emit: vi.fn(),
    beginTransaction: vi.fn(), endTransaction: vi.fn(),
    components,
    selection: { getSelectedIds: () => [] },
    elements: { getActivePage: () => ({ id: "page-home", root: { id: "root" } }) },
  } as unknown as NonNullable<BuildTabProps["composer"]>;
  return { composer, components };
}

const renderTab = (composer: BuildTabProps["composer"]) =>
  render(
    <ToastProvider>
      <BuildTab composer={composer} />
    </ToastProvider>,
  );

beforeEach(() => {
  sync.fetchComponentLibrary.mockReset().mockResolvedValue([]);
  sync.fetchLibraryComponent.mockReset();
});

describe("SAVED COMPONENTS — scope", () => {
  it("lists site-wide masters and this page's, not another page's", async () => {
    const { composer } = makeComposer([
      { id: "site", name: "Site header" },
      { id: "here", name: "Hero", pageId: "page-home" },
      { id: "there", name: "Menu hero", pageId: "page-menu" },
    ]);
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    await waitFor(() => expect(sync.fetchComponentLibrary).toHaveBeenCalled());
    expect(screen.getByTestId("insert-mine-site")).toBeTruthy();
    expect(screen.getByTestId("insert-mine-here")).toBeTruthy();
    expect(screen.queryByTestId("insert-mine-there")).toBeNull();
  });
});

describe("FROM LIBRARY", () => {
  it("lists the library under its own label; a linked master moves out of SAVED", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([
      { componentId: "btn", name: "Button / primary", siteCount: 3, onThisSite: true },
      { componentId: "price", name: "Price row", siteCount: 2, onThisSite: false },
    ]);
    const { composer } = makeComposer([{ id: "mine", name: "Site header" }, { id: "btn", name: "Button / primary" }]);
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    await screen.findByTestId("insert-library-label");
    expect(screen.getByTestId("insert-library-label").textContent).toBe("FROM LIBRARY");
    expect(screen.getByTestId("insert-library-btn")).toBeTruthy();
    expect(screen.getByTestId("insert-library-price")).toBeTruthy();
    expect(screen.queryByTestId("insert-mine-btn")).toBeNull();
    expect(screen.getByTestId("insert-mine-mine")).toBeTruthy();
  });

  it("inserting a master not yet on this site fetches it, links it, then inserts an instance", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([{ componentId: "price", name: "Price row", siteCount: 2, onThisSite: false }]);
    sync.fetchLibraryComponent.mockResolvedValue({ id: "price", name: "Price row" });
    const { composer, components } = makeComposer([]);
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    fireEvent.keyDown(await screen.findByTestId("insert-library-price"), { key: "Enter" });
    await waitFor(() => expect(components.instantiateComponent).toHaveBeenCalledWith("price", "root"));
    expect(sync.fetchLibraryComponent).toHaveBeenCalledWith("price");
    expect(components.adoptLibraryComponent).toHaveBeenCalledWith({ id: "price", name: "Price row" });
  });

  it("a master already linked here is inserted without fetching it again", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([{ componentId: "btn", name: "Button / primary", siteCount: 3, onThisSite: true }]);
    const { composer, components } = makeComposer([{ id: "btn", name: "Button / primary" }]);
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    fireEvent.keyDown(await screen.findByTestId("insert-library-btn"), { key: "Enter" });
    await waitFor(() => expect(components.instantiateComponent).toHaveBeenCalledWith("btn", "root"));
    expect(sync.fetchLibraryComponent).not.toHaveBeenCalled();
    expect(components.adoptLibraryComponent).not.toHaveBeenCalled();
  });

  it("a damaged library master says so instead of asking to try again", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([{ componentId: "price", name: "Price row", siteCount: 2, onThisSite: false }]);
    sync.fetchLibraryComponent.mockResolvedValue({ id: "price", name: "Price row" });
    const { composer, components } = makeComposer([]);
    components.adoptLibraryComponent.mockRejectedValueOnce(new Error("LIBRARY_MASTER_MALFORMED"));
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    fireEvent.keyDown(await screen.findByTestId("insert-library-price"), { key: "Enter" });
    expect(await screen.findByText("This library component is damaged and can't be added.")).toBeTruthy();
    expect(screen.queryByText("Couldn't add component. Try again.")).toBeNull();
    expect(components.instantiateComponent).not.toHaveBeenCalled();
  });

  /* Drag-only Add (owner 2026-11-19): FROM LIBRARY rows drag like the rest. */
  it("a pointer click only hints; the row drags the shared id", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([{ componentId: "price", name: "Price row", siteCount: 2, onThisSite: false }]);
    const { composer, components } = makeComposer([]);
    renderTab(composer);
    fireEvent.click(screen.getByRole("tab", { name: "Components" }));
    const row = await screen.findByTestId("insert-library-price");
    fireEvent.click(row, { detail: 1 });
    expect(screen.getByTestId("add-drag-hint")).toHaveTextContent("Drag onto the canvas to add");
    expect(sync.fetchLibraryComponent).not.toHaveBeenCalled();
    expect(components.instantiateComponent).not.toHaveBeenCalled();
    const setData = vi.fn();
    fireEvent.dragStart(row, { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith(LIBRARY_COMPONENT_MIME, "price");
  });

  it("a drop fetches and adopts the master through the row's own path, then instantiates it at the drop target", async () => {
    sync.fetchLibraryComponent.mockResolvedValue({ id: "price", name: "Price row" });
    const { composer, components } = makeComposer([]);
    const select = vi.fn();
    Object.assign(composer, {
      rollbackTransaction: vi.fn(),
      selection: { getSelectedIds: () => [], select },
      elements: { getActivePage: () => ({ id: "page-home", root: { id: "root" } }), getElement: (id: string) => ({ id }) },
    });
    const onDropError = vi.fn();
    const ctx = { composer, canvasRef: { current: null }, freshTargetId: "hero", freshDropPosition: null, onDropError } as unknown as DropContext;
    const e = { dataTransfer: { getData: () => "" } } as unknown as React.DragEvent;
    await expect(handleLibraryComponentDrop(e, ctx, { multiData: "", elementData: "", componentId: "", templateData: "", blockData: "", libraryComponentId: "price" })).resolves.toBe(true);
    expect(sync.fetchLibraryComponent).toHaveBeenCalledWith("price");
    expect(components.adoptLibraryComponent).toHaveBeenCalledWith({ id: "price", name: "Price row" });
    expect(components.instantiateComponent).toHaveBeenCalledWith("price", "hero");
    expect(select).toHaveBeenCalledWith({ id: "new-el" });
    expect(onDropError).not.toHaveBeenCalled();
  });

  it("a drop of a master gone from the library says so", async () => {
    sync.fetchLibraryComponent.mockResolvedValue(null);
    const { composer, components } = makeComposer([]);
    const onDropError = vi.fn();
    const ctx = { composer, canvasRef: { current: null }, freshTargetId: null, freshDropPosition: null, onDropError } as unknown as DropContext;
    const e = { dataTransfer: { getData: (t: string) => (t === LIBRARY_COMPONENT_MIME ? "gone" : "") } } as unknown as React.DragEvent;
    await handleLibraryComponentDrop(e, ctx);
    expect(components.instantiateComponent).not.toHaveBeenCalled();
    expect(onDropError).toHaveBeenCalledWith({ type: "INSERT_FAILED", message: "That component is no longer in the library." });
  });
});
