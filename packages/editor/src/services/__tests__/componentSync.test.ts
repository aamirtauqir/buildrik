/**
 * Component-master sync (#4/27). The editor mirrors COMPONENT_CREATED/UPDATED/
 * DELETED to the server and hydrates server components into the local cache.
 * Mirrors are best-effort (never throw) and surface failures (not silent).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const del = vi.fn();
const list = vi.fn();
const get = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    siteComponents: {
      upsert: { mutate: upsert },
      delete: { mutate: del },
      list: { query: list },
      get: { query: get },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

const loadComponents = vi.fn();
const saveComponent = vi.fn();
vi.mock("../../engine/components/ComponentStorage", () => ({
  loadComponents: (...a: unknown[]) => loadComponents(...a),
  saveComponent: (...a: unknown[]) => saveComponent(...a),
}));

import {
  mirrorComponentUpsert,
  mirrorComponentDelete,
  hydrateComponentsFromServer,
  onComponentSyncError,
} from "../componentSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  [upsert, del, list, get, loadComponents, saveComponent].forEach((m) => m.mockReset());
});

const comp = (id: string, name = "Card") => ({ id, name }) as never;

describe("componentSync", () => {
  it("mirrors an upsert to siteComponents.upsert with the URL siteId", async () => {
    await mirrorComponentUpsert(comp("c1", "Hero"));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-123",
        componentId: "c1",
        name: "Hero",
        payload: expect.objectContaining({ id: "c1" }),
      })
    );
  });

  it("mirrors a deletion to siteComponents.delete", async () => {
    await mirrorComponentDelete("c9");
    expect(del).toHaveBeenCalledWith({ siteId: "site-123", componentId: "c9" });
  });

  it("a failed upsert notifies subscribers + never throws", async () => {
    upsert.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onComponentSyncError(() => heard.push(1));
    await expect(mirrorComponentUpsert(comp("c1"))).resolves.toBeUndefined();
    expect(heard).toEqual([1]);
    off();
  });

  it("hydrate writes server components not already local, skipping existing ids", async () => {
    list.mockResolvedValueOnce([{ componentId: "srv1" }, { componentId: "local1" }]);
    loadComponents.mockResolvedValueOnce([{ id: "local1" }]); // already local → skip
    get.mockResolvedValueOnce({ id: "srv1", name: "Server one" });
    await hydrateComponentsFromServer();
    expect(get).toHaveBeenCalledTimes(1);
    expect(saveComponent).toHaveBeenCalledTimes(1);
    expect(saveComponent.mock.calls[0][0]).toMatchObject({ id: "srv1" });
    expect(saveComponent.mock.calls[0][1]).toBe("site-123"); // projectId
  });

  it("no-ops when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await mirrorComponentUpsert(comp("c1"));
    expect(upsert).not.toHaveBeenCalled();
  });
});
