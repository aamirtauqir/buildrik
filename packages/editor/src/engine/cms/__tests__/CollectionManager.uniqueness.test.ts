/**
 * C1 — what the engine refuses to publish is what the server refuses
 * (shared validator): a slug another record holds (CMS-07), a page path that
 * is empty or another published record's (BD-14), and a new record saved
 * as Published is checked BEFORE it exists, so a refusal leaves nothing
 * behind (CMS-01).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager, CMSValidationError } from "../CollectionManager";
import * as Storage from "../CollectionStorage";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

async function seed() {
  const manager = new CollectionManager();
  await manager.initialize();
  const c = await manager.createCollection("Posts", "posts");
  await manager.addField(c.id, { name: "Title", slug: "title", type: "text", order: 0, validation: { required: true } });
  await manager.addField(c.id, { name: "Slug", slug: "slug", type: "slug", order: 1 });
  await manager.updateCollection(c.id, { pageSlugPattern: "/posts/{slug}" });
  return { manager, c };
}

describe("publishing beside other records", () => {
  it("refuses a slug another record already holds (CMS-07)", async () => {
    const { manager, c } = await seed();
    await manager.createContentItem(c.id, { title: "A", slug: "hello" }, { status: "published" });
    await expect(manager.createContentItem(c.id, { title: "B", slug: "hello" }, { status: "published" })).rejects.toBeInstanceOf(CMSValidationError);
  });

  it("refuses a record whose page path resolves to nothing (BD-14)", async () => {
    const { manager, c } = await seed();
    const draft = await manager.createContentItem(c.id, { title: "A", slug: "" });
    await expect(manager.updateContentItem(draft!.id, { status: "published" })).rejects.toThrow(/comes out empty/);
  });

  it("a refused new published record leaves nothing behind (CMS-01)", async () => {
    const { manager, c } = await seed();
    for (let i = 0; i < 3; i++) {
      await expect(manager.createContentItem(c.id, { slug: "x" }, { status: "published" })).rejects.toBeInstanceOf(CMSValidationError);
    }
    expect(await manager.getContentItems(c.id)).toHaveLength(0);
  });

  it("creates straight into Published in one write", async () => {
    const { manager, c } = await seed();
    const item = await manager.createContentItem(c.id, { title: "A", slug: "a" }, { status: "published" });
    expect(item?.status).toBe("published");
    expect((await manager.getContentItem(item!.id))?.status).toBe("published");
  });
});
