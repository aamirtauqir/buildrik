/**
 * CmsWorkspace — the v3 CMS pane that replaces canvas + inspector:
 * root (4428:140486), records table (4428:143182), empty collection
 * (4428:148905), the collection ⋯ (7096:76270) and the Fields / Dynamic pages
 * tabs it hosts.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { EVENTS } from "@/shared/constants";
import { ToastProvider } from "@/editor/chrome-ui";
import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { PAGE_SIZE } from "../RecordsTable";
import { makeEngine, MENU, ITEM } from "./fakeCmsEngine";

const FULL = {
  ...MENU,
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1, validation: { required: true } },
    { id: "f3", name: "Description", slug: "description", type: "textarea", order: 2 },
    { id: "f4", name: "Category", slug: "category", type: "text", order: 3 },
    { id: "f5", name: "Available", slug: "available", type: "boolean", order: 4 },
    { id: "f6", name: "Photo", slug: "photo", type: "image", order: 5 },
  ],
} as unknown as CMSCollection;

const rec = (id: string, data: Record<string, unknown>, status: CMSContentItem["status"] = "published"): CMSContentItem => ({
  id,
  collectionId: "col-1",
  data,
  status,
  createdAt: "",
  updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
});

beforeEach(() => {
  localStorage.clear();
  cmsWorkspace.reset();
});
afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

describe("CmsWorkspace · root (4428:140486)", () => {
  it("names itself in the topbar crumb while open, and gives it back on close (4428:140486)", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    const crumbs: unknown[] = [];
    composer.on(EVENTS.UI_CRUMB_CONTEXT, (c) => crumbs.push(c));
    const { unmount } = render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    await screen.findByTestId("cms-workspace");
    expect(crumbs).toEqual([{ label: "CMS" }]);
    unmount();
    expect(crumbs).toEqual([{ label: "CMS" }, null]);
  });

  it("names the site, counts collections and records, and offers + New collection", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    const onCreate = vi.fn();
    render(<ToastProvider><CmsWorkspace composer={composer as never} onCreateCollection={onCreate} /></ToastProvider>);
    expect(screen.getByText("CMS · test-proj")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("cms-ws-meta")).toHaveTextContent("1 collection · 1 record"));
    fireEvent.click(screen.getByTestId("cms-ws-new-collection"));
    expect(onCreate).toHaveBeenCalled();
    expect(screen.getByTestId("cms-ws-hint")).toHaveTextContent("Select a collection");
  });

  it("invites the first collection when there are none (6881:79324)", async () => {
    const { composer } = makeEngine();
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    expect(await screen.findByTestId("cms-ws-empty")).toHaveTextContent("Create your first collection");
  });
});

describe("CmsWorkspace · records table (4428:143182)", () => {
  it("draws the display field, the short fields and Updated — long text and media stay in the sheet", async () => {
    const { composer } = makeEngine({
      collections: [FULL],
      items: [rec("r1", { name: "Margherita", price: "$12", category: "Pizza", available: true, description: "Tomato" })],
    });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    const table = await screen.findByTestId("cms-table");
    const heads = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(heads).toEqual(["Name", "Price", "Category", "Available", "Updated"]);
    const row = await screen.findByTestId("cms-row-r1");
    expect(row).toHaveTextContent("Margherita");
    expect(row).toHaveTextContent("Yes");
    expect(row).not.toHaveTextContent("Tomato");
    expect(row).toHaveTextContent("2h ago");
    expect(screen.getByTestId("cms-ws-title")).toHaveTextContent("Menu items");
    expect(screen.getByTestId("cms-ws-meta")).toHaveTextContent("· 1 record");
    // a full-width table: no hint column
    expect(screen.queryByTestId("cms-ws-hint")).toBeNull();
  });

  it("marks a missing required value in its cell (Tiramisu · Price required)", async () => {
    const { composer } = makeEngine({ collections: [FULL], items: [rec("r1", { name: "Tiramisu", category: "Dessert" })] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    expect(await screen.findByTestId("cms-row-r1")).toHaveTextContent("Price required");
  });

  it("sorts on a column head, ascending then descending", async () => {
    const { composer } = makeEngine({
      collections: [FULL],
      items: [rec("a", { name: "Diavola" }), rec("b", { name: "Caprese" }), rec("c", { name: "Margherita" })],
    });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    await screen.findByTestId("cms-row-a");
    const names = () => screen.getAllByTestId(/^cms-row-[abc]$/).map((r) => r.textContent?.split("·")[0]);
    fireEvent.click(screen.getByTestId("cms-th-name"));
    expect(names().map((n) => n?.slice(0, 4))).toEqual(["Capr", "Diav", "Marg"]);
    fireEvent.click(screen.getByTestId("cms-th-name"));
    expect(names().map((n) => n?.slice(0, 4))).toEqual(["Marg", "Diav", "Capr"]);
  });

  it("takes over the topbar search while a collection is open, and filters on it", async () => {
    const { composer } = makeEngine({
      collections: [FULL],
      items: [rec("a", { name: "Margherita" }), rec("b", { name: "Marinara" }), rec("c", { name: "Caprese" })],
    });
    const contexts: unknown[] = [];
    composer.on(EVENTS.UI_SEARCH_CONTEXT, (c) => contexts.push(c));
    cmsWorkspace.openCollection("col-1");
    const { unmount } = render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    await screen.findByTestId("cms-row-a");
    expect(contexts).toContainEqual({ placeholder: "Search Menu items…" });
    composer.emit(EVENTS.UI_SEARCH_QUERY, { query: "mar" });
    await waitFor(() => expect(screen.queryByTestId("cms-row-c")).toBeNull());
    expect(screen.getByTestId("cms-row-a")).toBeInTheDocument();
    composer.emit(EVENTS.UI_SEARCH_QUERY, { query: "sushi" });
    expect(await screen.findByTestId("cms-no-results")).toHaveTextContent("“sushi”");
    unmount();
    expect(contexts[contexts.length - 1]).toBeNull();
  });

  it("pages past PAGE_SIZE records", async () => {
    const items = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => rec(`r${i}`, { name: `Dish ${i}` }));
    const { composer } = makeEngine({ collections: [FULL], items });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    expect(await screen.findByTestId("cms-pager-range")).toHaveTextContent(`1–${PAGE_SIZE} of ${PAGE_SIZE + 3}`);
    fireEvent.click(screen.getByTestId("cms-pager-next"));
    expect(screen.getByTestId("cms-pager-range")).toHaveTextContent(`${PAGE_SIZE + 1}–${PAGE_SIZE + 3}`);
    expect(screen.getAllByRole("row")).toHaveLength(1 + 3);
  });

  it("a row click and + Add record open the side sheet through the store", async () => {
    const { composer } = makeEngine({ collections: [FULL], items: [rec("r1", { name: "Margherita" })] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    fireEvent.click(await screen.findByTestId("cms-row-r1"));
    expect(cmsWorkspace.get().recordId).toBe("r1");
    cmsWorkspace.openRecord(null);
    fireEvent.click(screen.getByTestId("cms-ws-add-record"));
    expect(cmsWorkspace.get().recordId).toBe("new");
  });
});

describe("CmsWorkspace · empty collection (4428:148905)", () => {
  it("offers Add record and Import JSON, with the hint column", async () => {
    const { composer } = makeEngine({ collections: [FULL], items: [] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    expect(await screen.findByTestId("cms-ws-no-records")).toHaveTextContent("No records yet");
    expect(screen.getByTestId("cms-ws-empty-import")).toHaveTextContent("Import JSON");
    expect(screen.getByTestId("cms-ws-hint")).toHaveTextContent("Add your first record");
  });

  it("imports records from a JSON file through createContentItem", async () => {
    const { composer } = makeEngine({ collections: [FULL], items: [] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    await screen.findByTestId("cms-ws-no-records");
    const file = new File([JSON.stringify([{ name: "Margherita", price: "$12" }])], "menu.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("cms-import-input"), { target: { files: [file] } });
    expect(await screen.findByTestId("cms-import-result")).toHaveTextContent("Imported 1 of 1 record");
    expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith(
      "col-1",
      expect.objectContaining({ name: "Margherita", price: "$12" }),
    );
  });
});

describe("CmsWorkspace · tabs and the collection ⋯ (7096:76270)", () => {
  it("Fields lists types and adds a field through the engine", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    fireEvent.click(await screen.findByRole("tab", { name: "Fields" }));
    expect(await screen.findByText("Published?")).toBeInTheDocument();
    expect(screen.getByTestId("cms-ws-meta")).toHaveTextContent(`· ${MENU.fields.length} field`);
    fireEvent.click(screen.getByTestId("cms-ws-add-field"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Photo URL" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() =>
      expect(composer.cms.collections.addField).toHaveBeenCalledWith(
        "col-1",
        expect.objectContaining({ name: "Photo URL", slug: "photo-url", type: "text" }),
      ),
    );
  });

  it("⋯ opens Dynamic pages and Settings, and offers Import JSON", async () => {
    const { composer } = makeEngine({ collections: [MENU], items: [ITEM] });
    cmsWorkspace.openCollection("col-1");
    render(<ToastProvider><CmsWorkspace composer={composer as never} /></ToastProvider>);
    fireEvent.click(await screen.findByTestId("cms-ws-more"));
    expect(screen.getByTestId("cms-ws-menu-import")).toHaveTextContent("Import JSON…");
    fireEvent.click(screen.getByTestId("cms-ws-menu-dynamic"));
    expect(cmsWorkspace.get().tab).toBe("dynamic-pages");
    expect(await screen.findByTestId("cms-ws-hint")).toHaveTextContent("Select a page");
    fireEvent.click(screen.getByTestId("cms-ws-more"));
    fireEvent.click(screen.getByTestId("cms-ws-menu-settings"));
    expect(cmsWorkspace.get().tab).toBe("settings");
  });
});
