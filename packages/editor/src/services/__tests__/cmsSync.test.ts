/**
 * CMS sync mapping (E7). Verifies the editor maps engine CMS objects to the
 * server upsert payloads using the /edit/<siteId> URL, and that a failed network
 * call is swallowed (best-effort — the local IndexedDB write already happened, so
 * the engine must never see a throw).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colUpsert = vi.fn();
const entUpsert = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: { upsert: { mutate: colUpsert }, delete: { mutate: vi.fn() } },
      entries: { upsert: { mutate: entUpsert }, delete: { mutate: vi.fn() } },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

import { syncCollectionUpsert, syncEntryUpsert } from "../cmsSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  colUpsert.mockReset();
  entUpsert.mockReset();
});

describe("cmsSync", () => {
  it("maps a collection to the upsert payload with the URL siteId", async () => {
    await syncCollectionUpsert({
      id: "c1", name: "Posts", slug: "posts", fields: [], createdAt: "", updatedAt: "",
    } as never);
    expect(colUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1", siteId: "site-123", name: "Posts", slug: "posts" }),
    );
  });

  it("maps content status published → PUBLISHED, else DRAFT", async () => {
    await syncEntryUpsert({ id: "e1", collectionId: "c1", data: { t: 1 }, status: "published", createdAt: "", updatedAt: "" } as never);
    expect(entUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", siteId: "site-123", status: "PUBLISHED" }));
    await syncEntryUpsert({ id: "e2", collectionId: "c1", data: {}, status: "draft", createdAt: "", updatedAt: "" } as never);
    expect(entUpsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: "e2", status: "DRAFT" }));
  });

  it("swallows a failed sync (best-effort) — never throws into the engine", async () => {
    colUpsert.mockRejectedValueOnce(new Error("network down"));
    await expect(
      syncCollectionUpsert({ id: "c1", name: "X", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never),
    ).resolves.toBeUndefined();
  });

  it("no-ops when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await syncCollectionUpsert({ id: "c1", name: "X", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never);
    expect(colUpsert).not.toHaveBeenCalled();
  });
});
