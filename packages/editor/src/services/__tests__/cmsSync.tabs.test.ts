/**
 * EDT-002 — two tabs of one browser must not silently overwrite each other.
 *
 * The write precondition (`expectedUpdatedAt`) used to come from the
 * browser-wide stamp map in localStorage. Tab 1 saves a record and stamps the
 * server's new updatedAt; tab 2, whose form was loaded from the older
 * version, then saves with tab 1's FRESH stamp, the server accepts, and tab
 * 1's change is gone (live D-02, 2026-10-08). Each tab here is its own module
 * instance (`vi.resetModules`) alive at the same time over ONE localStorage —
 * exactly what two tabs share and what they do not.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const entUpsert = vi.fn();
const colListQuery = vi.fn();
const entListQuery = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: { upsert: { mutate: vi.fn() }, delete: { mutate: vi.fn() }, list: { query: colListQuery } },
      entries: { upsert: { mutate: entUpsert }, delete: { mutate: vi.fn() }, list: { query: entListQuery } },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  loadCollections: async () => [],
  saveCollection: vi.fn(),
  saveContentItem: vi.fn(),
  loadContentItems: async () => [],
  loadContentItem: vi.fn(),
  deleteContentItem: vi.fn(),
  deleteCollection: vi.fn(),
}));

const S0 = "2026-10-08T19:50:00.000Z";
const S1 = "2026-10-08T19:51:26.000Z";
const S2 = "2026-10-08T19:52:00.000Z";

/** The server: one row, refusing any write whose precondition is not its current updatedAt. */
let serverAt = S0;
function serverUpsert(input: { expectedUpdatedAt: string | null }, next: string) {
  if (input.expectedUpdatedAt && input.expectedUpdatedAt !== serverAt) {
    return Promise.reject(new Error(`CMS_CONFLICT:${serverAt}`));
  }
  serverAt = next;
  return Promise.resolve({ updatedAt: next, data: undefined });
}

async function openTab() {
  vi.resetModules();
  const tab = await import("../cmsSync");
  colListQuery.mockResolvedValueOnce([
    {
      id: "c1", name: "Posts", slug: "posts", description: null, icon: null, displayField: null, fields: [],
      createdAt: S0, updatedAt: S0,
      pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null,
    },
  ]);
  entListQuery.mockResolvedValueOnce([
    { id: "e1", data: { title: "CSV post 12" }, status: "DRAFT", createdAt: S0, updatedAt: serverAt },
  ]);
  await tab.hydrateCmsFromServer();
  return tab;
}

const record = (title: string, updatedAt: string) =>
  ({ id: "e1", collectionId: "c1", data: { title }, status: "draft", createdAt: S0, updatedAt }) as never;

const sentPrecondition = () => entUpsert.mock.calls.at(-1)?.[0].expectedUpdatedAt;

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-A");
  localStorage.clear();
  [entUpsert, colListQuery, entListQuery].forEach((m) => m.mockReset());
  serverAt = S0;
});

describe("two tabs, one browser (EDT-002)", () => {
  it("the stale tab's save carries the version IT loaded and comes back CONFLICT", async () => {
    const tab1 = await openTab();
    const tab2 = await openTab();

    entUpsert.mockImplementationOnce((input) => serverUpsert(input, S1));
    await expect(tab1.syncEntryUpsert(record("CSV post 12 TAB1", "L1"))).resolves.toBe(true);
    expect(sentPrecondition()).toBe(S0);

    const seen: string[] = [];
    tab2.onCmsConflict((c) => seen.push(c.id));
    entUpsert.mockImplementationOnce((input) => serverUpsert(input, S2));
    await expect(tab2.syncEntryUpsert(record("CSV post 12 + body", "L2"))).resolves.toBe(false);

    expect(sentPrecondition()).toBe(S0);
    expect(tab2.isCmsConflictPending("entry", "e1")).toBe(true);
    expect(seen).toEqual(["e1"]);
    expect(serverAt).toBe(S1);
  });

  it("a tab's own successful save moves its precondition on — no conflict with itself", async () => {
    const tab1 = await openTab();
    entUpsert.mockImplementation((input) => serverUpsert(input, serverAt === S0 ? S1 : S2));
    await expect(tab1.syncEntryUpsert(record("first", "L1"))).resolves.toBe(true);
    await expect(tab1.syncEntryUpsert(record("second", "L2"))).resolves.toBe(true);
    expect(sentPrecondition()).toBe(S1);
  });

  it("an offline edit replayed after a reload sends the version it was edited against", async () => {
    const tab = await openTab();
    entUpsert.mockRejectedValueOnce(new Error("Failed to fetch"));
    await tab.syncEntryUpsert(record("offline edit", "L2"));

    /* Meanwhile the server moved on and this browser's shared stamp map
       learned of it (any other writer of `bk-sync-stamps-v1`). */
    serverAt = S1;
    const { recordServerStamp } = await import("../syncRetryQueue");
    recordServerStamp("entry:e1", S1, "L1");

    /* Reload: a fresh module with no memory of the edit's base — the outbox
       entry has to carry it. */
    vi.resetModules();
    const reloaded = await import("../cmsSync");
    entUpsert.mockImplementationOnce((input) => serverUpsert(input, S2));
    await reloaded.flushCmsOutbox();
    expect(sentPrecondition()).toBe(S0);
    expect(reloaded.isCmsConflictPending("entry", "e1")).toBe(true);
    expect(serverAt).toBe(S1);
  });

  it("Keep mine overwrites the copy that refused it — with that copy's stamp, not blind", async () => {
    const tab1 = await openTab();
    const tab2 = await openTab();
    entUpsert.mockImplementationOnce((input) => serverUpsert(input, S1));
    await tab1.syncEntryUpsert(record("tab 1", "L1"));

    let choice: { keepMine(): Promise<boolean> } | null = null;
    tab2.onCmsConflict((c) => (choice = c));
    entUpsert.mockImplementation((input) => serverUpsert(input, S2));
    await tab2.syncEntryUpsert(record("tab 2", "L2"));
    await expect(choice!.keepMine()).resolves.toBe(true);
    expect(sentPrecondition()).toBe(S1);
    expect(serverAt).toBe(S2);
  });
});
