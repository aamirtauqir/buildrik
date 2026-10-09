/**
 * EDT-056 — a collection's template page is referenced by its published file
 * name (`pageTemplatePath`, e.g. "post-template.html"). Renaming that page's
 * slug used to leave the collection pointing at a file that no longer exists,
 * so its record pages silently stopped generating. Until the template is
 * referenced by page id (D-12), the collection follows the page's file name.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "@/shared/constants/events";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };
beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

async function seed() {
  const manager = new CollectionManager();
  await manager.initialize();
  const posts = await manager.createCollection("Posts", "posts");
  await manager.updateCollection(posts.id, { pageSlugPattern: "{slug}", pageTemplatePath: "post-template.html" });
  const other = await manager.createCollection("Team", "team");
  await manager.updateCollection(other.id, { pageSlugPattern: "{slug}", pageTemplatePath: "about.html" });
  return { manager, posts, other };
}

const files = (entries: Array<[string, string]>) => new Map(entries);

describe("CollectionManager.followPageFiles (EDT-056)", () => {
  it("moves a collection's template path when its page's file name changes, through updateCollection", async () => {
    const { manager, posts, other } = await seed();
    const updated = vi.fn();
    manager.on(EVENTS.CMS_COLLECTION_UPDATED, updated);

    await manager.followPageFiles(files([["home", "index.html"], ["p1", "post-template.html"], ["p2", "about.html"]]));
    expect(updated).not.toHaveBeenCalled();

    await manager.followPageFiles(files([["home", "index.html"], ["p1", "article-template.html"], ["p2", "about.html"]]));
    expect(manager.getCollection(posts.id)?.pageTemplatePath).toBe("article-template.html");
    expect(manager.getCollection(other.id)?.pageTemplatePath).toBe("about.html");
    expect(updated).toHaveBeenCalledTimes(1);
    expect(updated.mock.calls[0]![0]).toMatchObject({ id: posts.id, pageTemplatePath: "article-template.html" });
    // Persisted, so the server mirror and the next load see it too.
    const stored = await Storage.loadCollections();
    expect(stored.find((c) => c.id === posts.id)?.pageTemplatePath).toBe("article-template.html");
  });

  it("follows two pages that swap file names", async () => {
    const { manager, posts, other } = await seed();
    await manager.followPageFiles(files([["p1", "post-template.html"], ["p2", "about.html"]]));
    await manager.followPageFiles(files([["p1", "about.html"], ["p2", "post-template.html"]]));
    expect(manager.getCollection(posts.id)?.pageTemplatePath).toBe("about.html");
    expect(manager.getCollection(other.id)?.pageTemplatePath).toBe("post-template.html");
  });

  it("does not follow a page that became the home page, nor one that was deleted", async () => {
    const { manager, posts } = await seed();
    await manager.followPageFiles(files([["p1", "post-template.html"]]));
    // The home page cannot be a template (the server refuses index.html).
    await manager.followPageFiles(files([["p1", "index.html"]]));
    expect(manager.getCollection(posts.id)?.pageTemplatePath).toBe("post-template.html");
    await manager.followPageFiles(files([["p1", "post-template.html"]]));
    await manager.followPageFiles(files([]));
    expect(manager.getCollection(posts.id)?.pageTemplatePath).toBe("post-template.html");
  });

  it("only records the first set of file names (nothing to compare against yet)", async () => {
    const { manager, posts } = await seed();
    await manager.followPageFiles(files([["p1", "article-template.html"]]));
    expect(manager.getCollection(posts.id)?.pageTemplatePath).toBe("post-template.html");
  });
});
