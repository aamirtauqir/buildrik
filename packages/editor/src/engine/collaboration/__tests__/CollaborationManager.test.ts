import { describe, it, expect, vi } from "vitest";
import { CollaborationManager } from "../CollaborationManager";

describe("CollaborationManager", () => {
  it("emits sync:error for invalid project payload", () => {
    const cm = new CollaborationManager({} as any);
    const emitSpy = vi.spyOn(cm, "emit");
    (cm as any).handleSyncResponse({ payload: { project: { bad: true }, version: 1 } });
    expect(emitSpy).toHaveBeenCalledWith("sync:error", expect.objectContaining({ type: "invalid-payload" }));
  });
});
