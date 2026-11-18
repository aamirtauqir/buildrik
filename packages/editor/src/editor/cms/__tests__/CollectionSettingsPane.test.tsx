/**
 * Collection settings tab (4428:148660): rename + slug, the source row, and
 * the danger zone whose delete takes the typed-DELETE dialog (4757:150118,
 * decision #29) wired to `deleteCollection`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { ToastProvider } from "@/editor/chrome-ui";
import { CollectionSettingsPane } from "../CollectionSettingsPane";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  fields: [{ id: "f1", name: "Slug", slug: "slug", type: "text", order: 0 }],
} as unknown as CMSCollection;
const TEAM = { id: "col-2", name: "Team", slug: "team", fields: [] } as unknown as CMSCollection;

const rec = (id: string, status: CMSContentItem["status"] = "published"): CMSContentItem => ({
  id, collectionId: "col-1", data: { slug: id }, status, createdAt: "", updatedAt: "",
});

function mount(collection: CMSCollection, records: CMSContentItem[]) {
  const engine = makeEngine({ collections: [collection, TEAM], items: records });
  render(
    <ToastProvider>
      <CollectionSettingsPane composer={engine.composer as never} collection={collection} records={records} />
    </ToastProvider>,
  );
  return engine;
}

afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

describe("CollectionSettingsPane", () => {
  it("renames the collection and its slug", async () => {
    const { updateCollection } = mount(MENU, []);
    fireEvent.click(screen.getByTestId("cms-settings-rename"));
    expect(updateCollection).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId("cms-settings-name"), { target: { value: "Dishes" } });
    fireEvent.change(screen.getByTestId("cms-settings-slug"), { target: { value: "dishes" } });
    fireEvent.click(screen.getByTestId("cms-settings-rename"));
    await waitFor(() => expect(updateCollection).toHaveBeenCalledWith("col-1", { name: "Dishes", slug: "dishes" }));
  });

  it("C-6: a rename the manager answers with null says so instead of ending in silence", async () => {
    const { updateCollection } = mount(MENU, []);
    updateCollection.mockResolvedValueOnce(null);
    fireEvent.change(screen.getByTestId("cms-settings-name"), { target: { value: "Dishes" } });
    fireEvent.click(screen.getByTestId("cms-settings-rename"));
    expect(await screen.findByTestId("cms-settings-save-failed")).toBeInTheDocument();
    expect(screen.queryByText("Collection saved")).toBeNull();
  });

  it("refuses a slug another collection already uses, or an empty name", () => {
    mount(MENU, []);
    fireEvent.change(screen.getByTestId("cms-settings-slug"), { target: { value: "team" } });
    expect(screen.getByTestId("cms-settings-error")).toHaveTextContent("Team already uses the slug team.");
    expect(screen.getByTestId("cms-settings-rename")).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-settings-slug"), { target: { value: "menu" } });
    fireEvent.change(screen.getByTestId("cms-settings-name"), { target: { value: "  " } });
    expect(screen.getByTestId("cms-settings-error")).toHaveTextContent("A collection needs a name.");
  });

  it("states what the delete takes, counting generated pages only when the collection generates them", () => {
    mount({ ...MENU, pageSlugPattern: "/menu/{slug}", pageTemplatePath: "menu-item.html" } as CMSCollection, [rec("a"), rec("b"), rec("c", "draft")]);
    expect(screen.getByTestId("cms-settings-danger")).toHaveTextContent("Deleting removes 3 records and 2 generated pages.");
    cleanup();
    mount(MENU, [rec("a")]);
    expect(screen.getByTestId("cms-settings-danger")).toHaveTextContent("Deleting removes 1 record.");
  });

  it("deletes only after DELETE is typed, then returns to the CMS root", async () => {
    cmsWorkspace.openCollection("col-1", "settings");
    const { composer } = mount(MENU, [rec("a")]);
    fireEvent.click(screen.getByTestId("cms-settings-delete"));
    const confirm = screen.getByTestId("cms-delete-collection-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Click to type DELETE"), { target: { value: "DELETE" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(composer.cms.collections.deleteCollection).toHaveBeenCalledWith("col-1"));
    await waitFor(() => expect(cmsWorkspace.get().collectionId).toBeNull());
  });

  /* CMS-06: the delete warned only about records and left every bound
     element bound to nothing. */
  it("names the bound elements it will unbind, and unbinds them once the delete lands", async () => {
    const engine = makeEngine({
      collections: [MENU, TEAM],
      items: [rec("a")],
      bindings: { h1: [{ collectionId: "col-1", fieldSlug: "slug", property: "content" }], h2: [{ collectionId: "col-2", fieldSlug: "x", property: "content" }] },
      collectionBindings: [{ elementId: "list", collectionId: "col-1", repeat: "children" }],
    });
    render(
      <ToastProvider>
        <CollectionSettingsPane composer={engine.composer as never} collection={MENU} records={[rec("a")]} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("cms-settings-danger")).toHaveTextContent("Deleting removes 1 record, and unbinds 2 elements — each keeps what it shows now.");
    fireEvent.click(screen.getByTestId("cms-settings-delete"));
    fireEvent.change(screen.getByPlaceholderText("Click to type DELETE"), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByTestId("cms-delete-collection-confirm"));
    await waitFor(() => expect(engine.composer.cms.collections.deleteCollection).toHaveBeenCalledWith("col-1"));
    await waitFor(() => expect(engine.composer.cms.bindings.unbind).toHaveBeenCalledWith("h1", "content"));
    expect(engine.composer.cms.bindings.unbind).not.toHaveBeenCalledWith("h2", expect.anything());
    expect(engine.composer.cms.bindings.unbindCollection).toHaveBeenCalledWith("list");
  });

  /* 2L9 257:58639 / 257:58823 — pending, then a refused delete keeps the
     dialog, touches no binding, and offers Retry. */
  it("a refused delete keeps the dialog with Retry and leaves the bindings", async () => {
    const engine = makeEngine({
      collections: [MENU],
      items: [],
      bindings: { h1: [{ collectionId: "col-1", fieldSlug: "slug", property: "content" }] },
    });
    engine.composer.cms.collections.deleteCollection.mockImplementationOnce(() => Promise.resolve(false));
    render(
      <ToastProvider>
        <CollectionSettingsPane composer={engine.composer as never} collection={MENU} records={[]} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("cms-settings-delete"));
    fireEvent.change(screen.getByPlaceholderText("Click to type DELETE"), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByTestId("cms-delete-collection-confirm"));
    expect(await screen.findByText(`Couldn’t delete ${MENU.name}`)).toBeInTheDocument();
    expect(screen.getByTestId("cms-delete-collection-body")).toHaveTextContent(`${MENU.name}, its records and bindings are unchanged.`);
    expect(screen.getByTestId("cms-delete-collection-confirm")).toHaveTextContent("Retry");
    expect(engine.composer.cms.bindings.unbind).not.toHaveBeenCalled();
  });

  /* 2L9 259:94976 / 259:95177 — Save collection; a refused save keeps the draft. */
  it("Save collection: a refused save keeps the draft and says what is saved", async () => {
    const { updateCollection } = mount(MENU, []);
    updateCollection.mockImplementationOnce(() => Promise.reject(new Error("500")));
    fireEvent.change(screen.getByTestId("cms-settings-slug"), { target: { value: "dishes" } });
    expect(screen.getByTestId("cms-settings-rename")).toHaveTextContent("Save collection");
    fireEvent.click(screen.getByTestId("cms-settings-rename"));
    expect(await screen.findByTestId("cms-settings-save-failed")).toHaveTextContent(
      `Couldn’t save the collection. Your draft is still here; the saved name and slug remain ${MENU.name} · ${MENU.slug}.`,
    );
    expect(screen.getByTestId("cms-settings-slug")).toHaveValue("dishes");
    expect(screen.getByTestId("cms-settings-rename")).toHaveTextContent("Retry");
  });
});
