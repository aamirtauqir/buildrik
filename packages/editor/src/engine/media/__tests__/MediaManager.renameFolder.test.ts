import { describe, it, expect, vi } from "vitest";

vi.mock("../MediaOptimizer", () => ({
  MediaOptimizer: class {
    async checkFormatSupport() {
      return { webp: true, avif: true, jpeg: true, png: true };
    }
  },
  formatBytes: () => "0 B",
  getCompressionSavings: () => 0,
}));

import { MediaManager } from "../MediaManager";
import { MEDIA_EVENTS } from "@/shared/constants/media";

function makeManager() {
  const manager = new MediaManager();
  (manager as any).storage.saveFolder = vi.fn(async () => {});
  return manager;
}

function seed(manager: MediaManager, id: string, name: string) {
  (manager as any).state.folders.push({
    id,
    name,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

describe("MediaManager.renameFolder", () => {
  it("updates folder name in state.folders", async () => {
    const manager = makeManager();
    seed(manager, "f1", "Old Name");
    await manager.renameFolder("f1", "New Name");
    const updated = manager.getAllFolders().find((f) => f.id === "f1");
    expect(updated?.name).toBe("New Name");
  });

  it("emits FOLDER_UPDATED with the updated folder", async () => {
    const manager = makeManager();
    seed(manager, "f1", "Old");
    const listener = vi.fn();
    manager.on(MEDIA_EVENTS.FOLDER_UPDATED, listener);
    await manager.renameFolder("f1", "New");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]?.id).toBe("f1");
    expect(listener.mock.calls[0][0]?.name).toBe("New");
  });

  it("persists via storage.saveFolder", async () => {
    const manager = makeManager();
    seed(manager, "f1", "Old");
    await manager.renameFolder("f1", "New");
    expect((manager as any).storage.saveFolder).toHaveBeenCalledTimes(1);
    expect((manager as any).storage.saveFolder.mock.calls[0][0]?.name).toBe(
      "New"
    );
  });

  it("throws on missing folder id", async () => {
    const manager = makeManager();
    await expect(manager.renameFolder("does-not-exist", "X")).rejects.toThrow(
      /not found/i
    );
  });

  it("throws on empty / whitespace-only name", async () => {
    const manager = makeManager();
    seed(manager, "f1", "Old");
    await expect(manager.renameFolder("f1", "   ")).rejects.toThrow(/empty/i);
  });

  it("trims whitespace from new name", async () => {
    const manager = makeManager();
    seed(manager, "f1", "Old");
    await manager.renameFolder("f1", "  Trimmed  ");
    const updated = manager.getAllFolders().find((f) => f.id === "f1");
    expect(updated?.name).toBe("Trimmed");
  });
});
