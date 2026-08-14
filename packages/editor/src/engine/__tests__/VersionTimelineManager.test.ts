import { describe, it, expect, vi } from "vitest";

describe("VersionTimelineManager compareVersions performance", () => {
  it("flattens snapshots into Maps for O(n) comparison", async () => {
    const manager = new (await import("../VersionTimelineManager")).VersionTimelineManager({} as any);
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

/* restoreVersion used to call importProject directly. importProject clears
   every element and style before loading the snapshot, so a restore destroyed
   whatever was open with no version holding it — unrecoverable, and nothing
   listens for VERSION_RESTORED to put it back. Board 163:220 states the
   promise on screen ("Saving your current work as v4 first"), which makes it a
   contract. */
describe("VersionTimelineManager.restoreVersion — the open work survives", () => {
  async function makeManager() {
    const emitted: Array<{ event: string; payload: unknown }> = [];
    const composer = {
      on: () => {},
      off: () => {},
      emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
      importProject: vi.fn(),
      elements: { getPages: () => [], getElement: () => null },
      styles: { exportStyles: () => [] },
    };
    const { VersionTimelineManager } = await import("../VersionTimelineManager");
    const m = new VersionTimelineManager(composer as never);
    return { m, composer, emitted };
  }

  it("creates a safety version BEFORE importing, and names it in the event", async () => {
    const { m, composer, emitted } = await makeManager();
    const order: string[] = [];
    const target = { id: "v1", name: "Launch", snapshot: { pages: [] } };
    vi.spyOn(m, "getVersion").mockResolvedValue(target as never);
    vi.spyOn(m, "createVersion").mockImplementation(async (name: string) => {
      order.push("save");
      return { id: "safety", name } as never;
    });
    (composer.importProject as ReturnType<typeof vi.fn>).mockImplementation(() => order.push("import"));

    const ok = await m.restoreVersion("v1");

    expect(ok).toBe(true);
    expect(order).toEqual(["save", "import"]);
    const restoring = emitted.find((e) => e.event === "version:restoring");
    expect(restoring?.payload).toMatchObject({ targetName: "Launch" });
    expect((restoring?.payload as { savedAs: string }).savedAs).toContain("Launch");
  });

  it("aborts the restore when the safety save fails — losing the work is the failure mode", async () => {
    const { m, composer } = await makeManager();
    vi.spyOn(m, "getVersion").mockResolvedValue({ id: "v1", name: "Launch", snapshot: {} } as never);
    vi.spyOn(m, "createVersion").mockRejectedValue(new Error("quota"));

    const ok = await m.restoreVersion("v1");

    expect(ok).toBe(false);
    expect(composer.importProject).not.toHaveBeenCalled();
  });
});
