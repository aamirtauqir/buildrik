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
  render(
    <ToastProvider>
      <CmsAddSection composer={c} onBlankList={onBlankList} />
    </ToastProvider>,
  );
  return { c, blog, onBlankList };
}

describe("CmsAddSection", () => {
  it("on a collection page: CMS fields · Blog, a row inserts the bound element, selected, with Undo", async () => {
    const { c, blog } = await setup(true);
    expect(await screen.findByText("CMS fields · Blog")).toBeInTheDocument();
    expect(screen.getByText("This page’s record")).toBeInTheDocument();
    expect(screen.getByTestId("add-cms-field-excerpt")).toHaveTextContent("Paragraph");
    fireEvent.click(screen.getByTestId("add-cms-field-excerpt"));
    expect(await screen.findByText("Excerpt inserted · bound to Blog")).toBeInTheDocument();
    const selected = c.selection.getSelectedIds();
    expect(selected).toHaveLength(1);
    const bindings = c.cms.bindings.getBindings(selected[0]);
    expect(bindings).toEqual([expect.objectContaining({ collectionId: blog.id, fieldSlug: "excerpt", property: "content" })]);
  });

  it("on any page: List of Blog builds a list bound to Blog; blank is the catalog's", async () => {
    const { c, blog, onBlankList } = await setup(false);
    expect(await screen.findByText("Collection lists")).toBeInTheDocument();
    expect(screen.queryByText("CMS fields · Blog")).toBeNull();
    expect(screen.getByText("Each list uses ordinary editable elements.")).toBeInTheDocument();
    // The in-memory store outlives one test: the newest Blog is this test's.
    fireEvent.click(screen.getAllByTestId("add-cms-list-blog").at(-1)!);
    expect(await screen.findByText("List of Blog inserted")).toBeInTheDocument();
    const listId = c.selection.getSelectedIds()[0];
    await waitFor(() => expect(c.cms.bindings.getCollectionBinding(listId)).toMatchObject({ collectionId: blog.id }));
    fireEvent.click(screen.getByTestId("add-cms-list-blank"));
    expect(onBlankList).toHaveBeenCalled();
  });
});
