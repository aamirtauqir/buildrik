import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sitesGetQuery: vi.fn(),
  pagesListQuery: vi.fn(),
  siteDetailSettingsGetQuery: vi.fn(),
}));

vi.mock("../api-client", () => ({
  createBuildrikApiClient: vi.fn(() => ({
    sites: {
      get: { query: mocks.sitesGetQuery },
      // One server snapshot; the mock composes the three reads it replaced.
      loadForEditor: {
        query: async ({ siteId }: { siteId: string }) => ({
          site: await mocks.sitesGetQuery({ id: siteId }),
          pages: await mocks.pagesListQuery({ siteId }),
          settings: await mocks.siteDetailSettingsGetQuery({ siteId }),
          lastEditedBy: null,
        }),
      },
    },
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
    const validStyle = {
      id: "color-x",
      selector: ".class",
      properties: { color: "#fff" },
    };
    mocks.sitesGetQuery.mockResolvedValue({
      name: "test",
      projectStyles: [validStyle],
      dsSchemaVersion: 0,
    });
    const data = await loadProject("site-1");
    expect(data.styles).toEqual([validStyle]);
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
