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
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));
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
