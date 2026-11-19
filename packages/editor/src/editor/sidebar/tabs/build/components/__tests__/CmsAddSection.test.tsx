// @vitest-environment jsdom
/**
 * The Add panel's CMS rows (2L9 D37 176:21119, D38 176:21523, D74 189:21741),
 * against a real Composer: a field row inserts its bound element after the
 * insert target, selected, with an Undo receipt; "List of Blog" builds a list
 * bound to the collection; "Collection list · blank" is the catalog's.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "@/engine/__tests__/test-utils/realComposer";
import { pageFileNames } from "@/engine/export";
import { CmsAddSection } from "../CmsAddSection";
import { handleCmsDrop, type DropContext } from "@/editor/canvas/hooks/drag/dropOperations";
import { CMS_INSERT_MIME } from "@/editor/sidebar/tabs/build/cmsInsert";

vi.mock("@/engine/cms/CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("@/engine/cms/__tests__/inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

afterEach(cleanup);
beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

async function setup(template: boolean) {
  const c = createTestComposer();
  const home = c.elements.createPage("Home");
  c.elements.setActivePage(home.id);
  const blog = await c.cms.collections.createCollection("Blog", "blog", undefined, {
    displayField: "title",
    fields: [
      { id: "f-title", name: "Title", slug: "title", type: "text", order: 0 },
      { id: "f-excerpt", name: "Excerpt", slug: "excerpt", type: "textarea", order: 1 },
      { id: "f-cover", name: "Cover image", slug: "cover", type: "image", order: 2 },
    ] as never,
  });
  if (template) {
    const post = c.elements.createPage("Blog post");
    const file = pageFileNames(c.elements.getAllPages()).get(post.id)!;
    await c.cms.collections.updateCollection(blog.id, { pageSlugPattern: "/blog/{title}", pageTemplatePath: file } as never);
    c.elements.setActivePage(post.id);
  }
  const onBlankList = vi.fn();
  const onDragHint = vi.fn();
  render(
    <ToastProvider>
      <CmsAddSection composer={c} onBlankList={onBlankList} onDragHint={onDragHint} />
    </ToastProvider>,
  );
  return { c, blog, onBlankList, onDragHint };
}

describe("CmsAddSection", () => {
  it("on a collection page: CMS fields · Blog, a row's Enter inserts the bound element, selected, with Undo", async () => {
    const { c, blog } = await setup(true);
    expect(await screen.findByText("CMS fields · Blog")).toBeInTheDocument();
    expect(screen.getByText("This page’s record")).toBeInTheDocument();
    expect(screen.getByTestId("add-cms-field-excerpt")).toHaveTextContent("Paragraph");
    fireEvent.keyDown(screen.getByTestId("add-cms-field-excerpt"), { key: "Enter" });
    expect(await screen.findByText("Excerpt inserted · bound to Blog")).toBeInTheDocument();
    const selected = c.selection.getSelectedIds();
    expect(selected).toHaveLength(1);
    const bindings = c.cms.bindings.getBindings(selected[0]);
    expect(bindings).toEqual([expect.objectContaining({ collectionId: blog.id, fieldSlug: "excerpt", property: "content" })]);
  });

  it("an image field row reads 'Image + title alt' and binds both src and alt (176:21119)", async () => {
    const { c } = await setup(true);
    expect(await screen.findByTestId("add-cms-field-cover")).toHaveTextContent("Image + title alt");
    fireEvent.keyDown(screen.getByTestId("add-cms-field-cover"), { key: " " });
    expect(await screen.findByText("Cover image inserted · bound to Blog")).toBeInTheDocument();
    const bindings = c.cms.bindings.getBindings(c.selection.getSelectedIds()[0]);
    expect(bindings).toEqual([
      expect.objectContaining({ collectionName: "Blog", fieldSlug: "cover", property: "src" }),
      expect.objectContaining({ collectionName: "Blog", fieldSlug: "title", property: "alt" }),
    ]);
  });

  it("on any page: List of Blog (keyboard) builds a list bound to Blog; blank is the catalog's", async () => {
    const { c, blog, onBlankList } = await setup(false);
    expect(await screen.findByText("Collection lists")).toBeInTheDocument();
    expect(screen.queryByText("CMS fields · Blog")).toBeNull();
    expect(screen.getByText("Each list uses ordinary editable elements.")).toBeInTheDocument();
    // The in-memory store outlives one test: the newest Blog is this test's.
    /* A button's keyboard activation is a click with detail 0. */
    fireEvent.click(screen.getAllByTestId("add-cms-list-blog").at(-1)!, { detail: 0 });
    expect(await screen.findByText("List of Blog inserted")).toBeInTheDocument();
    const listId = c.selection.getSelectedIds()[0];
    await waitFor(() => expect(c.cms.bindings.getCollectionBinding(listId)).toMatchObject({ collectionId: blog.id }));
    fireEvent.click(screen.getByTestId("add-cms-list-blank"), { detail: 0 });
    expect(onBlankList).toHaveBeenCalled();
  });

  /* Drag-only Add (owner 2026-11-19): the CMS rows drag like the rest. */
  it("a pointer click on a field row, a list or the blank list only hints", async () => {
    const { c, onBlankList, onDragHint } = await setup(true);
    const row = await screen.findByTestId("add-cms-field-excerpt");
    fireEvent.click(row, { detail: 1 });
    fireEvent.click(screen.getAllByTestId("add-cms-list-blog").at(-1)!, { detail: 1 });
    fireEvent.click(screen.getByTestId("add-cms-list-blank"), { detail: 1 });
    expect(onDragHint).toHaveBeenCalledTimes(3);
    expect(onDragHint).toHaveBeenNthCalledWith(1, row);
    expect(onBlankList).not.toHaveBeenCalled();
    expect(c.selection.getSelectedIds()).toHaveLength(0);
    const setData = vi.fn();
    fireEvent.dragStart(row, { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith(CMS_INSERT_MIME, expect.stringContaining('"fieldSlug":"excerpt"'));
  });

  it("a dropped field row inserts the bound element at the drop target, selected", async () => {
    const { c, blog } = await setup(true);
    const root = c.elements.getActivePage()!.root.id;
    const onDropError = vi.fn();
    const onDropSuccess = vi.fn();
    const ctx = { composer: c, canvasRef: { current: null }, freshTargetId: root, freshDropPosition: null, onDropError, onDropSuccess } as unknown as DropContext;
    const e = { dataTransfer: { getData: (t: string) => (t === CMS_INSERT_MIME ? JSON.stringify({ collectionId: blog.id, fieldSlug: "excerpt" }) : "") } } as unknown as React.DragEvent;
    await expect(handleCmsDrop(e, ctx)).resolves.toBe(true);
    expect(onDropError).not.toHaveBeenCalled();
    const id = c.selection.getSelectedIds()[0];
    expect(c.elements.getElement(id)?.getParent()?.getId()).toBe(root);
    expect(c.cms.bindings.getBindings(id)).toEqual([expect.objectContaining({ collectionId: blog.id, fieldSlug: "excerpt", property: "content" })]);
    expect(onDropSuccess).toHaveBeenCalledWith({ elementLabel: "Excerpt", elementType: "text" });
  });

  it("a dropped List of Blog builds the bound list there", async () => {
    const { c, blog } = await setup(false);
    const ctx = { composer: c, canvasRef: { current: null }, freshTargetId: null, freshDropPosition: null, onDropError: vi.fn(), onDropSuccess: vi.fn() } as unknown as DropContext;
    const e = { dataTransfer: { getData: (t: string) => (t === CMS_INSERT_MIME ? JSON.stringify({ collectionId: blog.id }) : "") } } as unknown as React.DragEvent;
    await handleCmsDrop(e, ctx);
    const listId = c.selection.getSelectedIds()[0];
    await waitFor(() => expect(c.cms.bindings.getCollectionBinding(listId)).toMatchObject({ collectionId: blog.id }));
  });
});
