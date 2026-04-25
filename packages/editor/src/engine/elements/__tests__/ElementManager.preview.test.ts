import { describe, it, expect, beforeEach, vi } from "vitest";
import { ElementManager } from "../ElementManager";

function makeComposer() {
  return {
    emit: vi.fn(),
    on: vi.fn(),
  } as unknown as ConstructorParameters<typeof ElementManager>[0];
}

describe("ElementManager preview API", () => {
  let manager: ElementManager;
  let composer: ReturnType<typeof makeComposer>;

  beforeEach(() => {
    composer = makeComposer();
    manager = new ElementManager(composer);
  });

  it("previewUpdate stores props in the preview layer", () => {
    manager.previewUpdate("el-1", { color: "red" });
    expect(manager.getPreview("el-1")).toEqual({ color: "red" });
    expect(manager.hasPreview("el-1")).toBe(true);
  });

  it("clearPreview removes a single preview", () => {
    manager.previewUpdate("el-1", { color: "red" });
    manager.clearPreview("el-1");
    expect(manager.hasPreview("el-1")).toBe(false);
  });

  it("emits element:preview:changed event with id on previewUpdate", () => {
    manager.previewUpdate("el-1", { color: "red" });
    expect(composer.emit).toHaveBeenCalledWith("element:preview:changed", "el-1");
  });

  it("emits element:preview:changed event with id on clearPreview", () => {
    manager.previewUpdate("el-1", { color: "red" });
    (composer.emit as ReturnType<typeof vi.fn>).mockClear();
    manager.clearPreview("el-1");
    expect(composer.emit).toHaveBeenCalledWith("element:preview:changed", "el-1");
  });
});
