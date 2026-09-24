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
    fireEvent.click(screen.getByTestId("insert-group-mine"));
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
    fireEvent.click(screen.getByTestId("insert-group-mine"));
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
    fireEvent.click(screen.getByTestId("insert-group-mine"));
    fireEvent.click(await screen.findByTestId("insert-library-price"));
    await waitFor(() => expect(components.instantiateComponent).toHaveBeenCalledWith("price", "root"));
    expect(sync.fetchLibraryComponent).toHaveBeenCalledWith("price");
    expect(components.adoptLibraryComponent).toHaveBeenCalledWith({ id: "price", name: "Price row" });
  });

  it("a master already linked here is inserted without fetching it again", async () => {
    sync.fetchComponentLibrary.mockResolvedValue([{ componentId: "btn", name: "Button / primary", siteCount: 3, onThisSite: true }]);
    const { composer, components } = makeComposer([{ id: "btn", name: "Button / primary" }]);
    renderTab(composer);
    fireEvent.click(screen.getByTestId("insert-group-mine"));
    fireEvent.click(await screen.findByTestId("insert-library-btn"));
    await waitFor(() => expect(components.instantiateComponent).toHaveBeenCalledWith("btn", "root"));
    expect(sync.fetchLibraryComponent).not.toHaveBeenCalled();
    expect(components.adoptLibraryComponent).not.toHaveBeenCalled();
  });
});
