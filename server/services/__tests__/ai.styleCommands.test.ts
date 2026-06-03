/**
 * Unit 2 — in-canvas AI command emission. Tests the parse + validate core that
 * turns raw model output into safe, in-scope set-style commands. The exact-id
 * guard, property allow-list, value block-list, and JSON repair are the
 * security-critical surface.
 */
import { describe, it, expect } from "vitest";
import { extractValidEditCommands } from "@server/services/ai.service";

const EL = "el-1";

describe("extractValidEditCommands", () => {
  it("parses a clean JSON array of valid commands", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#000000" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0].args).toEqual({ elementId: EL, property: "color", value: "#000000" });
  });

  it("strips markdown ```json fences", () => {
    const raw =
      '```json\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"padding","value":"24px"}}]\n```';
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("repairs prose-wrapped JSON (extracts the first array)", () => {
    const raw =
      'Sure! Here you go:\n[{"commandId":"set-style","args":{"elementId":"el-1","property":"font-size","value":"32px"}}]\nHope that helps.';
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("drops commands targeting a different element (exact-id scope guard)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: "other-el", property: "color", value: "#fff" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops a property outside the allow-list (e.g. pseudo-state)", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color:hover", value: "#f00" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it.each([
    "url(javascript:alert(1))",
    "expression(alert(1))",
    "url(data:text/html,x)",
  ])("drops an unsafe value: %s", (value) => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "background", value } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("returns [] for malformed / non-JSON output", () => {
    expect(extractValidEditCommands("not json at all", EL)).toEqual([]);
  });

  it("returns [] when the model returns a JSON object instead of an array", () => {
    expect(extractValidEditCommands('{"foo":"bar"}', EL)).toEqual([]);
  });

  it("keeps only the valid entries from a mixed batch", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#111" } },
      { commandId: "set-style", args: { elementId: "evil", property: "color", value: "#222" } },
      { commandId: "remove-element", args: { elementId: EL } },
      { commandId: "set-style", args: { elementId: EL, property: "border-radius", value: "8px" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(2);
    expect(r.map((c) => (c.commandId === "set-style" ? c.args.property : "?"))).toEqual([
      "color",
      "border-radius",
    ]);
  });

  it("accepts a valid set-text command", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "Welcome to Buildrik" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ commandId: "set-text", args: { elementId: EL, text: "Welcome to Buildrik" } });
  });

  it("drops set-text containing markup (angle brackets)", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "<script>alert(1)</script>" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops empty set-text", () => {
    const raw = JSON.stringify([
      { commandId: "set-text", args: { elementId: EL, text: "" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("handles a mixed style + text batch", () => {
    const raw = JSON.stringify([
      { commandId: "set-style", args: { elementId: EL, property: "color", value: "#fff" } },
      { commandId: "set-text", args: { elementId: EL, text: "Hello" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(2);
    expect(r.map((c) => c.commandId)).toEqual(["set-style", "set-text"]);
  });

  it("accepts a valid add-element command with text", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "button", text: "Buy now" } },
    ]);
    const r = extractValidEditCommands(raw, EL);
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({
      commandId: "add-element",
      args: { elementId: EL, elementType: "button", text: "Buy now" },
    });
  });

  it("accepts add-element without text (e.g. a container)", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "container" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(1);
  });

  it("drops add-element with a non-allow-listed type", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "image" } },
      { commandId: "add-element", args: { elementId: EL, elementType: "script" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });

  it("drops add-element whose text contains markup", () => {
    const raw = JSON.stringify([
      { commandId: "add-element", args: { elementId: EL, elementType: "heading", text: "<img src=x>" } },
    ]);
    expect(extractValidEditCommands(raw, EL)).toHaveLength(0);
  });
});
