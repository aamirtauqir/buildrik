/**
 * Editing a published record must announce an EDIT, not an unpublish.
 *
 * `updateContentItem` chose its event with
 * `updates.status !== "published" && existing.status === "published"`, which is
 * true whenever `updates` carries no status key at all — because
 * `undefined !== "published"`. So every ordinary, data-only edit to a live
 * record emitted CMS_CONTENT_UNPUBLISHED.
 *
 * That is not a cosmetic mislabel. The two surfaces that re-render bound
 * elements — CMSBindingManager and useCMSPreview — subscribe to
 * created/updated/deleted only, so the canvas went stale whenever anyone
 * edited the text of a published record, and stayed stale until an unrelated
 * event happened to arrive. useCmsSync listens to both, which is likely why
 * server sync kept working and the defect survived.
 *
 * Found while fixing the draft-records-ship bug; filed and fixed separately
 * because it is a different defect in a different line.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "../../../shared/constants/events";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };
beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

async function seedPublished() {
  const manager = new CollectionManager();
  await manager.initialize();
  const collection = await manager.createCollection("Dishes", "dishes");
  await manager.addField(collection.id, { name: "Name", slug: "name", type: "text", order: 0 });
  const item = await manager.createContentItem(collection.id, { name: "Margherita" });
  // createContentItem returns null when the collection is missing or full; the
  // seed cannot continue without a record, and a null here means the fixture
  // broke, not the behaviour under test.
  if (!item) throw new Error("seed: createContentItem returned null");
  await manager.updateContentItem(item.id, { status: "published" });
  return { manager, collection, item };
}

describe("updateContentItem — which event an edit announces", () => {
  it("emits UPDATED, not UNPUBLISHED, when a published record's data changes", async () => {
    const { manager, item } = await seedPublished();
    const seen: string[] = [];
    manager.on(EVENTS.CMS_CONTENT_UPDATED, () => seen.push("updated"));
    manager.on(EVENTS.CMS_CONTENT_UNPUBLISHED, () => seen.push("unpublished"));

    // A data-only edit: no `status` key at all, which is what every ordinary
    // edit from the Content panel sends.
    await manager.updateContentItem(item.id, { data: { name: "Marinara" } });

    expect(seen).toEqual(["updated"]);
  });

  it("still emits UNPUBLISHED when the status is explicitly moved off published", async () => {
    const { manager, item } = await seedPublished();
    const seen: string[] = [];
    manager.on(EVENTS.CMS_CONTENT_UPDATED, () => seen.push("updated"));
    manager.on(EVENTS.CMS_CONTENT_UNPUBLISHED, () => seen.push("unpublished"));

    await manager.updateContentItem(item.id, { status: "draft" });

    expect(seen).toEqual(["unpublished"]);
  });
});
