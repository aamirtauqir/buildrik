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

import { mirrorUserTemplate, hydrateUserTemplatesFromServer } from "../templateSync";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  localStorage.clear();
  [upsert, list].forEach((m) => m.mockReset());
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

// AUDIT P1-1 (2026-07-16): templateSync has NO retry queue AND no error-
// subscriber channel — a failed mirror is console.warn'ed and dropped.
// Pinning CURRENT behavior.
describe("templateSync failure semantics (audit P1-1 — no retry queue)", () => {
  it("a failed mirror warns once, never throws, and does NOT retry", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("network down"));
    await expect(
      mirrorUserTemplate({ id: "user-1", name: "Hero", html: "<p>" })
    ).resolves.toBeUndefined();
    expect(upsert).toHaveBeenCalledTimes(1); // no re-attempt — op is dropped
    expect(warn).toHaveBeenCalledWith("[template-sync] mirror failed (kept locally)", expect.any(Error));
    warn.mockRestore();
  });

  it.todo(
    "BUG P1-1: no retry queue and no onTemplateSyncError channel — a failed template mirror is fully silent to the UI (console.warn only), unlike version/component (notify) and cms (queue+notify)"
  );
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
