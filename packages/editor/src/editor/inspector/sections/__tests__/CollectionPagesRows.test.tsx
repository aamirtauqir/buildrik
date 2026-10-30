// @vitest-environment jsdom
/**
 * Collection list › Pages / When empty (B-30; 2L9 B5-D80, D81, D78):
 * Split adds the pager after the list and lists the published paths; a path
 * another page owns is named with its way out; the No items choice adds the
 * list's empty block. Each choice is one Undo.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { emptySlotOf, pagerOf } from "@/engine/cms/listPages";
import { CollectionPagesRows } from "../CollectionPagesRows";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

const now = "2026-01-01T00:00:00.000Z";
function withList(records: number, otherPageSlug?: string) {
  const c = createTestComposer();
  const home = c.elements.createPage("Home");
  c.elements.setActivePage(home.id);
  if (otherPageSlug) c.elements.createPage("Archive", { slug: otherPageSlug } as never);
  const list = c.elements.createElement("container", { tagName: "div" });
  c.elements.addElement(list, home.root.id);
  c.elements.addElement(c.elements.createElement("container", { tagName: "div" }), list.getId());
  const blog = { id: "c1", name: "Blog", slug: "blog", fields: [] };
  const cms = c.cms as unknown as { collections: Record<string, unknown> };
  cms.collections.getAllCollections = () => [blog];
  cms.collections.getCollection = () => blog;
  cms.collections.queryContent = async () => ({
    items: Array.from({ length: records }, (_, i) => ({ id: `r${i}`, collectionId: "c1", data: {}, status: "published", createdAt: now, updatedAt: now })),
    total: records,
    hasMore: false,
  });
  c.cms.bindings.bindCollection(list.getId(), "c1", { repeat: "children", limit: 6 });
  c.history.flushPending();
  const mount = () => render(<CollectionPagesRows composer={c} elementId={list.getId()} binding={c.cms.bindings.getCollectionBinding(list.getId())!} />);
  return { c, listId: list.getId(), mount };
}

describe("Collection list · Pages / When empty (B-30)", () => {
  it("Split into pages: one step adds the pager and the list publishes 3 pages at /, /page/2, /page/3", async () => {
    const { c, listId, mount } = withList(14);
    const { unmount } = mount();
    expect(screen.getByTestId("collection-pages-first")).toBeChecked();
    const steps = c.history.getUndoCount();
    fireEvent.click(screen.getByTestId("collection-pages-split"));
    c.history.flushPending();
    expect(c.cms.bindings.getCollectionBinding(listId)?.pages).toBe("split");
    expect(pagerOf(c, listId)?.getTagName().toLowerCase()).toBe("nav");
    expect(c.history.getUndoCount()).toBe(steps + 1);
    unmount();
    mount();
    await waitFor(() => expect(screen.getByTestId("collection-pages-paths")).toHaveTextContent("3 pages · /, /page/2, /page/3"));
    expect(screen.getByText("Generated on publish. Previous and Next are editable links.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("collection-pages-first"));
    expect(pagerOf(c, listId)).toBeNull();
  });

  it("a generated path another page already uses is named, with Open conflicting page ›", async () => {
    const { c, listId, mount } = withList(14, "page/2");
    c.cms.bindings.setListQuery(listId, { pages: "split" });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("collection-pages-collision")).toHaveTextContent("/page/2 is already used by another page. Rename that page or turn off pagination."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open conflicting page ›" }));
    expect(c.elements.getActivePage()?.name).toBe("Archive");
  });

  it("When empty: Hide list writes the choice; Show editable No items block adds the block", () => {
    const { c, listId, mount } = withList(0);
    const { unmount } = mount();
    fireEvent.click(screen.getByTestId("collection-empty-hide"));
    expect(c.cms.bindings.getCollectionBinding(listId)?.whenEmpty).toBe("hide");
    unmount();
    mount();
    fireEvent.click(screen.getByTestId("collection-empty-slot"));
    expect(c.cms.bindings.getCollectionBinding(listId)?.whenEmpty).toBeUndefined();
    expect(emptySlotOf(c, listId)?.getChildren()[0]?.getContent()).toBe("No items yet.");
  });
});
