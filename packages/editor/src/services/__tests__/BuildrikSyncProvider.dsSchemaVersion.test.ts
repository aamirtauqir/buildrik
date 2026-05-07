import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sitesGetQuery: vi.fn(),
  pagesListQuery: vi.fn(),
  siteDetailSettingsGetQuery: vi.fn(),
}));

vi.mock("@buildrik/shared", () => ({
  createBuildrikApiClient: vi.fn(() => ({
    sites: { get: { query: mocks.sitesGetQuery } },
    pages: { list: { query: mocks.pagesListQuery } },
    siteDetail: {
      settings: { get: { query: mocks.siteDetailSettingsGetQuery } },
    },
  })),
}));

import { loadProject } from "../BuildrikSyncProvider";

describe("loadProject · projectStyles + dsSchemaVersion hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pagesListQuery.mockResolvedValue([]);
    mocks.siteDetailSettingsGetQuery.mockResolvedValue(null);
  });

  it("populates styles from server projectStyles, not []", async () => {
    mocks.sitesGetQuery.mockResolvedValue({
      name: "test",
      projectStyles: [{ id: "color-x", value: "#fff" }],
      dsSchemaVersion: 0,
    });
    const data = await loadProject("site-1");
    expect(data.styles).toEqual([{ id: "color-x", value: "#fff" }]);
  });

  it("populates dsSchemaVersion from server", async () => {
    mocks.sitesGetQuery.mockResolvedValue({
      name: "test",
      projectStyles: [],
      dsSchemaVersion: 1,
    });
    const data = await loadProject("site-1");
    expect(data.dsSchemaVersion).toBe(1);
  });

  it("falls back to dsSchemaVersion=0 when server returns undefined", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ name: "test" });
    const data = await loadProject("site-1");
    expect(data.dsSchemaVersion).toBe(0);
  });

  it("falls back to styles=[] when server returns no projectStyles", async () => {
    mocks.sitesGetQuery.mockResolvedValue({ name: "test" });
    const data = await loadProject("site-1");
    expect(data.styles).toEqual([]);
  });
});
