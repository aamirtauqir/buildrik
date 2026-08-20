/**
 * My-Templates sync (#13/25). Mirrors save-as-template to the server + hydrates
 * server templates into the local cache. Best-effort, never throws.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const list = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    userTemplates: { upsert: { mutate: upsert }, list: { query: list } },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

import {
  mirrorUserTemplate,
  hydrateUserTemplatesFromServer,
  onTemplateSyncError,
  retryTemplateSync,
  getTemplateSyncPendingCount,
} from "../templateSync";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";

beforeEach(async () => {
  window.history.replaceState({}, "", "/edit/site-123");
  localStorage.clear();
  [upsert, list].forEach((m) => m.mockReset());
  // The retry queue is module-level shared state; flush anything a prior test
  // left queued (reset mocks now resolve) so each test starts from empty, then
  // clear the call history the flush incurred so per-test counts start at 0.
  await retryTemplateSync();
  upsert.mockClear();
});

describe("templateSync", () => {
  it("mirrors a saved template to userTemplates.upsert with the URL siteId", async () => {
    await mirrorUserTemplate({ id: "user-1", name: "Hero", html: "<p>", category: "landing" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-123",
        templateId: "user-1",
        name: "Hero",
        html: "<p>",
        category: "landing",
      })
    );
  });

  it("hydrate appends server templates not already local, skipping existing ids", async () => {
    localStorage.setItem(
      STORAGE_KEYS.MY_TEMPLATES,
      JSON.stringify([{ id: "local1", name: "Local", html: "<a>" }])
    );
    list.mockResolvedValueOnce([
      { templateId: "local1", name: "Local", html: "<a>", category: null, css: null, thumbnail: null, description: null },
      { templateId: "srv1", name: "Server", html: "<b>", category: null, css: null, thumbnail: null, description: null },
    ]);
    await hydrateUserTemplatesFromServer();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!) as Array<{ id: string }>;
    expect(stored.map((t) => t.id)).toEqual(["local1", "srv1"]);
  });

  it("no-ops the mirror when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await mirrorUserTemplate({ id: "user-1", name: "X", html: "" });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("resolves the siteId from the legacy ?siteId= URL", async () => {
    window.history.replaceState({}, "", "/?siteId=legacy-7");
    await mirrorUserTemplate({ id: "user-1", name: "X", html: "<p>" });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ siteId: "legacy-7" }));
  });

  it("maps absent optional fields to explicit nulls in the upsert payload", async () => {
    await mirrorUserTemplate({ id: "user-2", name: "Bare", html: "<div>" });
    expect(upsert).toHaveBeenCalledWith({
      siteId: "site-123",
      templateId: "user-2",
      name: "Bare",
      category: null,
      description: null,
      html: "<div>",
      css: null,
      thumbnail: null,
    });
  });
});

// AUDIT P1-1 (2026-07-16) — FIXED: templateSync now shares cmsSync's retry
// queue (SyncRetryQueue) and exposes an onTemplateSyncError channel. A failed
// mirror is queued (not dropped), notified, and replayed on reconnect.
describe("templateSync failure semantics (audit P1-1 — retry queue)", () => {
  it("a failed mirror warns, never throws, notifies, and queues", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onTemplateSyncError(() => heard.push(1));
    /* Resolves FALSE, not undefined: the save handler needs to know whether
       THIS mirror landed (pendingCount can't say — it counts every target). */
    await expect(
      mirrorUserTemplate({ id: "user-1", name: "Hero", html: "<p>" })
    ).resolves.toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1); // queued, not re-fired synchronously
    expect(heard).toEqual([1]); // no longer fully silent to the UI
    expect(getTemplateSyncPendingCount()).toBe(1); // kept for retry, not dropped
    expect(warn).toHaveBeenCalledWith("[template-sync] mirror failed (kept locally)", expect.any(Error));
    off();
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: a queued failed mirror is replayed on retry, then clears", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("network down"));
    await mirrorUserTemplate({ id: "user-1", name: "Hero", html: "<p>", category: "landing" });
    expect(getTemplateSyncPendingCount()).toBe(1);

    // upsert now resolves (reset default) — retry re-sends the SAME payload.
    await retryTemplateSync();
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ siteId: "site-123", templateId: "user-1", name: "Hero" })
    );
    expect(getTemplateSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: the window 'online' event auto-drains the queue", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("offline"));
    await mirrorUserTemplate({ id: "user-1", name: "Hero", html: "<p>" });
    expect(getTemplateSyncPendingCount()).toBe(1);

    window.dispatchEvent(new Event("online")); // upsert resolves now → flush
    await vi.waitFor(() => expect(getTemplateSyncPendingCount()).toBe(0));
    warn.mockRestore();
  });

  it("latest-wins: repeated failures for the same template hold ONE queue slot", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("down"));
    await mirrorUserTemplate({ id: "user-1", name: "First", html: "<p>" });
    upsert.mockRejectedValueOnce(new Error("still down"));
    await mirrorUserTemplate({ id: "user-1", name: "Second", html: "<p>" });
    expect(getTemplateSyncPendingCount()).toBe(1); // one slot per target

    await retryTemplateSync(); // upsert resolves now
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ name: "Second" }));
    expect(getTemplateSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });
});

describe("templateSync hydrate edge paths", () => {
  it("maps nullable server fields to undefined on the hydrated row", async () => {
    list.mockResolvedValueOnce([
      { templateId: "srv1", name: "Server", html: "<b>", category: null, css: null, thumbnail: null, description: null },
    ]);
    await hydrateUserTemplatesFromServer();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!) as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({ id: "srv1", name: "Server", html: "<b>" }); // undefineds dropped by JSON
  });

  it("recovers from corrupt localStorage (readLocal → []) and still hydrates", async () => {
    localStorage.setItem(STORAGE_KEYS.MY_TEMPLATES, "{not-json");
    list.mockResolvedValueOnce([
      { templateId: "srv1", name: "Server", html: "<b>", category: null, css: null, thumbnail: null, description: null },
    ]);
    await hydrateUserTemplatesFromServer();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!) as Array<{ id: string }>;
    expect(stored.map((t) => t.id)).toEqual(["srv1"]);
  });

  it("leaves localStorage untouched when the server has no templates", async () => {
    list.mockResolvedValueOnce([]);
    await hydrateUserTemplatesFromServer();
    expect(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)).toBeNull();
  });

  it("a failed hydrate warns + never throws into editor open", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    list.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateUserTemplatesFromServer()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[template-sync] hydrate from server failed", expect.any(Error));
    warn.mockRestore();
  });

  it("no-ops when unauthenticated/outside the editor URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await hydrateUserTemplatesFromServer();
    expect(list).not.toHaveBeenCalled();
  });
});
