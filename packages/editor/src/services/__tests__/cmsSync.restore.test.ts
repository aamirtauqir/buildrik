/**
 * REA #11a / L3-020 — Undo for a record delete restores the same server row
 * (`cms.entries.restore`), so its id — and every reference and binding that
 * names it — survives. L3-020: offline it queues in the outbox ("queued");
 * a refusal is "refused" and the row leaves this device again.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const entUpsert = vi.fn();
const entDelete = vi.fn();
const entRestore = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: {},
      entries: { upsert: { mutate: entUpsert }, delete: { mutate: entDelete }, restore: { mutate: entRestore } },
    },
  }),
}));
vi.mock("@/shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));
const deleteContentItem = vi.fn();
vi.mock("@/engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  loadCollections: async () => [],
  saveCollection: vi.fn(),
  saveContentItem: vi.fn(),
  loadContentItems: async () => [],
  loadContentItem: async () => null,
  deleteContentItem: (...a: unknown[]) => deleteContentItem(...a),
  deleteCollection: vi.fn(),
}));

const OUTBOX = "bk-cms-outbox-v1";
const keys = () => ((JSON.parse(localStorage.getItem(OUTBOX) ?? "{}")["site-A"] ?? []) as Array<{ key: string }>).map((o) => o.key);
const item = { id: "e1", collectionId: "c1", data: { name: "Margherita" }, status: "published", createdAt: "L0", updatedAt: "L1" } as never;
const offline = () => new Error("Failed to fetch");
const answer = (code: string, message: string) => Object.assign(new Error(message), { data: { code } });

async function load() {
  vi.resetModules();
  return import("../cmsSync");
}

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-A");
  localStorage.clear();
  [entUpsert, entDelete, entRestore, deleteContentItem].forEach((m) => m.mockReset());
  entDelete.mockResolvedValue({ ok: true });
  entRestore.mockResolvedValue({ id: "e1", updatedAt: "2026-10-10T10:00:00.000Z" });
  entUpsert.mockResolvedValue({ updatedAt: "2026-10-10T10:00:00.000Z" });
});

describe("syncEntryRestore (L3-020)", () => {
  it("restores the same server row, then a later save names its revision", async () => {
    const sync = await load();
    await sync.syncEntryDelete("e1");
    await expect(sync.syncEntryRestore(item)).resolves.toBe("restored");
    expect(entRestore).toHaveBeenCalledWith({ siteId: "site-A", id: "e1" });
    expect(entUpsert).not.toHaveBeenCalled();
    expect(keys()).toEqual([]);
    await sync.syncEntryUpsert(item);
    expect(entUpsert.mock.calls.at(-1)?.[0].expectedUpdatedAt).toBe("2026-10-10T10:00:00.000Z");
  });

  it("a delete that never reached the server is cancelled, and the restore still asks the server", async () => {
    const sync = await load();
    entDelete.mockRejectedValueOnce(offline());
    await sync.syncEntryDelete("e1");
    expect(keys()).toEqual(["entryDelete:e1"]);
    await sync.syncEntryRestore(item);
    expect(keys()).toEqual([]);
    expect(entRestore).toHaveBeenCalledTimes(1);
    expect(entDelete).toHaveBeenCalledTimes(1);
  });

  it("a record the server never held is created with its own id", async () => {
    const sync = await load();
    entRestore.mockRejectedValueOnce(answer("NOT_FOUND", "Entry not found"));
    await expect(sync.syncEntryRestore(item)).resolves.toBe("restored");
    expect(entUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", expectedUpdatedAt: null, status: "PUBLISHED" }));
  });

  it("refused (its page was taken since): the reason is kept and the row leaves this device again", async () => {
    const sync = await load();
    entRestore.mockRejectedValueOnce(new Error("CMS_INVALID:Another published record already has the page /p/a."));
    await expect(sync.syncEntryRestore(item)).resolves.toBe("refused");
    expect(sync.takeCmsInvalid("entry", "e1")).toBe("Another published record already has the page /p/a.");
    expect(deleteContentItem).toHaveBeenCalledWith("e1");
  });

  it("offline: queued in the outbox and replayed before any later save of the row", async () => {
    let sync = await load();
    entRestore.mockRejectedValueOnce(offline());
    await expect(sync.syncEntryRestore(item)).resolves.toBe("queued");
    expect(keys()).toEqual(["entryRestore:e1"]);
    sync = await load();
    await sync.flushCmsOutbox();
    expect(entRestore).toHaveBeenCalledTimes(2);
    expect(keys()).toEqual([]);
  });
});
