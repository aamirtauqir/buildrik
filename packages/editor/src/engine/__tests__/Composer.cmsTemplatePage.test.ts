/**
 * EDT-056 — renaming the template page's URL slug kept the collection on the
 * old file name ("post-template.html"), so its record pages silently stopped
 * generating. The collection now follows the page through the slug change,
 * and back through Undo.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "./test-utils/realComposer";

vi.mock("../cms/CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("../cms/__tests__/inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

describe("Composer — a collection follows its template page (EDT-056)", () => {
  it("a slug change on the template page moves pageTemplatePath, and Undo moves it back", async () => {
    const c = createTestComposer();
    if (c.elements.getAllPages().length === 0) c.elements.createPage("Home");
    const template = c.elements.createPage("Post template", { slug: "post-template" });
    c.history.flushPending();
    const posts = await c.cms.collections.createCollection("Posts", "posts", undefined, { pageSlugPattern: "{slug}" });
    await c.cms.collections.updateCollection(posts.id, { pageTemplatePath: "post-template.html" });

    c.elements.updatePage(template.id, { slug: "article-template" });
    c.history.flushPending();
    await vi.waitFor(() =>
      expect(c.cms.collections.getCollection(posts.id)?.pageTemplatePath).toBe("article-template.html")
    );

    c.history.undo();
    expect(c.elements.getPage(template.id)?.slug).toBe("post-template");
    await vi.waitFor(() =>
      expect(c.cms.collections.getCollection(posts.id)?.pageTemplatePath).toBe("post-template.html")
    );
  });

  it("a rename that leaves the file name alone does not touch the collection", async () => {
    const c = createTestComposer();
    if (c.elements.getAllPages().length === 0) c.elements.createPage("Home");
    const template = c.elements.createPage("Post template", { slug: "post-template" });
    const posts = await c.cms.collections.createCollection("Posts", "posts");
    const updated = (await c.cms.collections.updateCollection(posts.id, { pageTemplatePath: "post-template.html" }))!;
    c.elements.updatePage(template.id, { name: "Article layout" });
    await Promise.resolve();
    expect(c.cms.collections.getCollection(posts.id)?.updatedAt).toBe(updated.updatedAt);
  });
});
