/**
 * DM-07: a collection create whose slug the server already holds (another
 * device made "Blog" first) was an untranslated 500, retried forever. The
 * server now answers CONFLICT SLUG_TAKEN:<its id>, and this device adopts
 * that collection: its records move there, its own copy goes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colUpsert = vi.fn();
const entUpsert = vi.fn();
const colList = vi.fn();
const entList = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: { upsert: { mutate: colUpsert }, list: { query: colList } },
      entries: { upsert: { mutate: entUpsert }, list: { query: entList } },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));
const store = vi.hoisted(() => ({
  items: [] as Array<{ id: string; collectionId: string }>,
  saveContentItem: vi.fn(),
  deleteCollection: vi.fn(),
  saveCollection: vi.fn(),
}));
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  loadCollections: vi.fn(async () => []),
  saveCollection: (...a: unknown[]) => store.saveCollection(...a),
  saveContentItem: (...a: unknown[]) => store.saveContentItem(...a),
  loadContentItems: vi.fn(async (cid: string) => store.items.filter((i) => i.collectionId === cid)),
  deleteCollection: (...a: unknown[]) => store.deleteCollection(...a),
  deleteContentItem: vi.fn(),
}));

import { onCmsConflict, onCmsSyncError, syncCollectionUpsert } from "../cmsSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-1");
  localStorage.clear();
  [colUpsert, entUpsert, colList, entList, store.saveContentItem, store.deleteCollection, store.saveCollection].forEach((m) => m.mockReset());
  colList.mockResolvedValue([
    { id: "c-server", name: "Blog", slug: "blog", description: null, icon: null, displayField: null, fields: [], createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null },
  ]);
  entList.mockResolvedValue([]);
  entUpsert.mockResolvedValue({ updatedAt: new Date(0) });
  store.items = [{ id: "e1", collectionId: "c-local" } as never];
});

describe("SLUG_TAKEN (DM-07)", () => {
  it("adopts the server's collection: records move to it, the local copy goes, no conflict prompt", async () => {
    const off = onCmsSyncError(() => {});
    const prompts: string[] = [];
    const offConflict = onCmsConflict((c) => prompts.push(c.id));
    colUpsert.mockRejectedValueOnce(new Error("CMS_CONFLICT:SLUG_TAKEN:c-server"));
    await syncCollectionUpsert({ id: "c-local", name: "Blog", slug: "blog", fields: [], createdAt: "", updatedAt: "" } as never);
    await vi.waitFor(() => expect(entUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", collectionId: "c-server" })));
    expect(store.saveContentItem).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", collectionId: "c-server" }));
    expect(store.deleteCollection).toHaveBeenCalledWith("c-local");
    expect(store.saveCollection).toHaveBeenCalledWith(expect.objectContaining({ id: "c-server" }));
    expect(prompts).toEqual([]);
    offConflict();
    off();
  });
});
