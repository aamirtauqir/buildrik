import { describe, it, expect, vi } from "vitest";
import { loadProject } from "../BuildrikSyncProvider";

vi.mock("@buildrik/shared", () => ({
  createBuildrikApiClient: vi.fn(() => ({
    sites: {
      get: {
        query: vi.fn().mockRejectedValue(new Error("network")),
      },
    },
    pages: {
      list: {
        query: vi.fn(),
      },
    },
  })),
}));

describe("loadProject error handling", () => {
  it("throws domain error on tRPC failure", async () => {
    await expect(loadProject("s1")).rejects.toThrow(
      "BuildrikSyncProvider.loadProject failed for site s1"
    );
  });
});
