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
});
