import { describe, it, expect } from "vitest";

describe("VersionHistoryManager compareVersions performance", () => {
  it("flattens snapshots into Maps for O(n) comparison", async () => {
    const manager = new (await import("../VersionHistoryManager")).VersionHistoryManager({} as any);
    const snapshot = {
      pages: [{
        id: "p1",
        root: {
          id: "root",
          children: [
            { id: "a", children: [{ id: "a1" }, { id: "a2" }] },
            { id: "b", children: [{ id: "b1" }] },
          ],
        },
      }],
    } as any;
    const flat = (manager as any).flattenSnapshot(snapshot);
    expect(flat.get("root")?.id).toBe("root");
    expect(flat.get("a1")?.id).toBe("a1");
    expect(flat.get("b1")?.id).toBe("b1");
    expect(flat.size).toBe(6);
  });
});
