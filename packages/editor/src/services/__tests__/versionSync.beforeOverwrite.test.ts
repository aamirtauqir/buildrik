/**
 * keepBeforeOverwrite (2L9 B7-G16 / G17): the server's newer copy is kept as a
 * Saves version named "Before overwrite" before a conflict overwrite — through
 * the existing siteVersions.create — and a failure throws, so the overwrite
 * stops instead of going ahead without it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ siteVersions: { create: { mutate: create } } }),
}));
vi.mock("@/shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));
const saveVersion = vi.fn();
vi.mock("@/engine/storage/VersionHistoryStorage", () => ({
  loadVersions: vi.fn(() => Promise.resolve([])),
  saveVersion: (...a: unknown[]) => saveVersion(...a),
}));
const loadProject = vi.fn();
vi.mock("../BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "site-1",
  loadProject: (...a: unknown[]) => loadProject(...a),
}));

import { keepBeforeOverwrite } from "../versionSync";

const SERVER = { version: "1", pages: [{ id: "p1" }], styles: [], assets: [] };

beforeEach(() => {
  [create, saveVersion, loadProject].forEach((m) => m.mockReset());
});

describe("keepBeforeOverwrite", () => {
  it("creates a \"Before overwrite\" version holding the server's current project", async () => {
    loadProject.mockResolvedValue(SERVER);
    create.mockResolvedValue({});
    const version = await keepBeforeOverwrite("site-1");
    expect(loadProject).toHaveBeenCalledWith("site-1");
    expect(create).toHaveBeenCalledTimes(1);
    const input = create.mock.calls[0][0];
    expect(input).toMatchObject({ siteId: "site-1", name: "Before overwrite", isAuto: false, versionId: version.id });
    expect(input.payload.snapshot).toBe(SERVER);
    expect(saveVersion).toHaveBeenCalledWith(version);
  });

  it("throws when the server copy can't be read or kept, so nothing is overwritten", async () => {
    loadProject.mockRejectedValue(new Error("offline"));
    await expect(keepBeforeOverwrite("site-1")).rejects.toThrow("offline");
    loadProject.mockResolvedValue(SERVER);
    create.mockRejectedValue(new Error("refused"));
    await expect(keepBeforeOverwrite("site-1")).rejects.toThrow("refused");
    expect(saveVersion).not.toHaveBeenCalled();
  });
});
