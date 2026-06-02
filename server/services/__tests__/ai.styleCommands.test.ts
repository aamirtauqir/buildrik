/**
 * Unit 2 — in-canvas AI command emission. Tests the parse + validate core that
 * turns raw model output into safe, in-scope set-style commands. The exact-id
 * guard, property allow-list, value block-list, and JSON repair are the
 * security-critical surface.
 */
import { describe, it, expect } from "vitest";
import { extractValidStyleCommands } from "@server/services/ai.service";

const EL = "el-1";

describe("extractValidStyleCommands", () => {
  it("parses a clean JSON array of valid commands", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#000000" } },
    ]);
    const r = extractValidStyleCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0].args).toEqual({ elementId: EL, property: "color", value: "#000000" });
  });

  it("strips markdown ```json fences", () => {
    const raw =
      '```json\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"padding","value":"24px"}}]\n```';
    expect(extractValidStyleCommands(raw, EL)).toHaveLength(1);
  });

  it("repairs prose-wrapped JSON (extracts the first array)", () => {
    const raw =
      'Sure! Here you go:\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"font-size","value":"32px"}}]\nHope that helps.';
    expect(extractValidStyleCommands(raw, EL)).toHaveLength(1);
  });

  it("drops commands targeting a different element (exact-id scope guard)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: "other-el", property: "color", value: "#fff" } },
    ]);
    expect(extractValidStyleCommands(raw, EL)).toHaveLength(0);
  });

  it("drops a property outside the allow-list (e.g. pseudo-state)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color:hover", value: "#f00" } },
    ]);
    expect(extractValidStyleCommands(raw, EL)).toHaveLength(0);
  });

  it.each([
    "url(javascript:alert(1))",
    "expression(alert(1))",
    "url(data:text/html,x)",
  ])("drops an unsafe value: %s", (value) => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "background", value } },
    ]);
    expect(extractValidStyleCommands(raw, EL)).toHaveLength(0);
  });

  it("returns [] for malformed / non-JSON output", () => {
    expect(extractValidStyleCommands("not json at all", EL)).toEqual([]);
  });

  it("returns [] when the model returns a JSON object instead of an array", () => {
    expect(extractValidStyleCommands('{"foo":"bar"}', EL)).toEqual([]);
  });

  it("keeps only the valid entries from a mixed batch", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#111" } },
      { commandId: "set-style", args: { elementId: "evil", property: "color", value: "#222" } },
      { commandId: "remove-element", args: { elementId: EL } },
      { commandId: "set-style", args: { elementId: EL, property: "border-radius", value: "8px" } },
    ]);
    const r = extractValidStyleCommands(raw, EL);
    expect(r).toHaveLength(2);
    expect(r.map((c: { args: { property: string } }) => c.args.property)).toEqual([
      "color",
      "border-radius",
    ]);
  });
});
