/**
 * C1 (DM-09): a write the server refuses under the shared validator is
 * answered, not retried. Before, CMS_INVALID did not exist — the server took
 * anything — and any 400 sat in the retry queue for the session.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const entUpsert = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ cms: { entries: { upsert: { mutate: entUpsert } }, collections: {} } }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));
const saveContentItem = vi.fn(async () => undefined);
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  saveContentItem: (...a: unknown[]) => saveContentItem(...(a as [])),
  deleteContentItem: vi.fn(),
  loadContentItems: vi.fn(async () => []),
}));

import { getCmsSyncPendingCount, onCmsInvalid, onCmsSyncError, syncEntryUpsert, takeCmsInvalid } from "../cmsSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  entUpsert.mockReset();
  saveContentItem.mockClear();
  localStorage.removeItem("bk-cms-outbox-v1");
  localStorage.removeItem("bk-sync-stamps-v1");
});

describe("CMS_INVALID", () => {
  it("is not queued, leaves the outbox, keeps the reason for the sheet and announces it", async () => {
    const off = onCmsSyncError(() => {});
    const seen: string[] = [];
    const offInvalid = onCmsInvalid((i) => seen.push(`${i.id}:${i.message}`));
    entUpsert.mockRejectedValueOnce(new Error("CMS_INVALID:Name is required"));
    entUpsert.mockResolvedValue({ updatedAt: new Date(0) });
    const reached = await syncEntryUpsert({ id: "e1", collectionId: "c1", data: {}, status: "published", createdAt: "", updatedAt: "" } as never);
    expect(reached).toBe(false);
    expect(getCmsSyncPendingCount()).toBe(0);
    expect(seen).toEqual(["e1:Name is required"]);
    expect(takeCmsInvalid("entry", "e1")).toBe("Name is required");
    expect(takeCmsInvalid("entry", "e1")).toBeNull();
    expect(JSON.parse(localStorage.getItem("bk-cms-outbox-v1") ?? "{}")["site-123"]?.some((o: { key: string; item?: { status: string } }) => o.item?.status === "published") ?? false).toBe(false);
    offInvalid();
    off();
  });

  it("a never-synced published record is kept here as a draft and mirrored as one", async () => {
    const off = onCmsSyncError(() => {});
    entUpsert.mockRejectedValueOnce(new Error("CMS_INVALID:Slug taken"));
    entUpsert.mockResolvedValue({ updatedAt: new Date(0) });
    await syncEntryUpsert({ id: "e2", collectionId: "c1", data: { a: 1 }, status: "published", createdAt: "", updatedAt: "" } as never);
    await vi.waitFor(() => expect(entUpsert).toHaveBeenCalledTimes(2));
    expect(saveContentItem).toHaveBeenCalledWith(expect.objectContaining({ id: "e2", status: "draft" }));
    expect(entUpsert.mock.calls[1][0]).toMatchObject({ id: "e2", status: "DRAFT" });
    off();
  });
});

describe("the server's sanitized copy comes back (DM-10)", () => {
  it("keeps what the server stored, not what was sent", async () => {
    entUpsert.mockResolvedValueOnce({ updatedAt: new Date(1), data: { name: "Hi", body: "<p>ok</p>" } });
    await syncEntryUpsert({ id: "e9", collectionId: "c1", data: { name: "<b>Hi</b>", body: "<p>ok</p><script>x</script>" }, status: "draft", createdAt: "", updatedAt: "L" } as never);
    expect(saveContentItem).toHaveBeenCalledWith(expect.objectContaining({ id: "e9", data: { name: "Hi", body: "<p>ok</p>" }, updatedAt: "L" }));
  });

  it("writes nothing when the server stored exactly what was sent", async () => {
    entUpsert.mockResolvedValueOnce({ updatedAt: new Date(1), data: { name: "Hi" } });
    await syncEntryUpsert({ id: "e10", collectionId: "c1", data: { name: "Hi" }, status: "draft", createdAt: "", updatedAt: "L" } as never);
    expect(saveContentItem).not.toHaveBeenCalled();
  });
});

describe("publish snapshot rows → engine collections (BD-12 live)", () => {
  it("keep the URL pattern, which {{item.url}} reads", async () => {
    const { cmsFromRows } = await import("../cmsSync");
    const { collections } = cmsFromRows({
      collections: [{ id: "c", name: "P", slug: "p", fields: [], pageSlugPattern: "/p/{slug}", updatedAt: "2026-10-05T00:00:00.000Z" }],
      entries: [],
    });
    expect(collections[0].pageSlugPattern).toBe("/p/{slug}");
  });
});
