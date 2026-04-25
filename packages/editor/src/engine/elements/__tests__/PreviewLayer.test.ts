import { describe, it, expect, beforeEach } from "vitest";
import { PreviewLayer } from "../PreviewLayer";

describe("PreviewLayer", () => {
  let layer: PreviewLayer;
  beforeEach(() => { layer = new PreviewLayer(); });

  it("set + get round-trips a preview value", () => {
    layer.set("el-1", { color: "red" });
    expect(layer.get("el-1")).toEqual({ color: "red" });
  });

  it("get returns undefined for unknown ids", () => {
    expect(layer.get("nope")).toBeUndefined();
  });

  it("has returns true only when id has a preview", () => {
    layer.set("el-1", { color: "red" });
    expect(layer.has("el-1")).toBe(true);
    expect(layer.has("el-2")).toBe(false);
  });

  it("clear removes a single id", () => {
    layer.set("el-1", { color: "red" });
    layer.set("el-2", { color: "blue" });
    layer.clear("el-1");
    expect(layer.has("el-1")).toBe(false);
    expect(layer.has("el-2")).toBe(true);
  });

  it("clearAll removes every id", () => {
    layer.set("el-1", { color: "red" });
    layer.set("el-2", { color: "blue" });
    layer.clearAll();
    expect(layer.has("el-1")).toBe(false);
    expect(layer.has("el-2")).toBe(false);
  });

  it("set replaces previous value for same id", () => {
    layer.set("el-1", { color: "red" });
    layer.set("el-1", { color: "blue" });
    expect(layer.get("el-1")).toEqual({ color: "blue" });
  });

  it("emits a change event on set, clear, and clearAll", () => {
    const events: string[] = [];
    layer.on((id) => events.push(id ?? "*"));
    layer.set("el-1", { color: "red" });
    layer.clear("el-1");
    layer.clearAll();
    expect(events).toEqual(["el-1", "el-1", "*"]);
  });
});
