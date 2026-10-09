/**
 * L5-013: the server cannot know an element's current value, so every row
 * arrived with `from: ""` and the user approved blind ("text → AI rewritten
 * heading"). The client fills the before value from the live element.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { Composer } from "@/engine";
import { withBeforeValues } from "../hooks/aiScopeContext";
import type { ServerEdit } from "../hooks/runPromptOnce";

const heading = {
  getContent: () => "<b>Old</b>   heading",
  getStyle: (p: string) => (p === "color" ? "#111111" : undefined),
  getAttribute: (a: string) => (a === "title" ? "Hero" : undefined),
};
const composer = { elements: { getElement: (id: string) => (id === "h1" ? heading : null) } } as unknown as Composer;

const edit = (commands: unknown[], rows: ServerEdit["rows"]): ServerEdit => ({
  target: "h1",
  summary: "",
  rows,
  applyOps: { preview: {}, commit: { commands } },
});

describe("withBeforeValues", () => {
  it("fills text, style and attribute rows from the element", () => {
    const out = withBeforeValues(
      composer,
      edit(
        [
          { commandId: "set-text", args: { elementId: "h1", text: "New heading" } },
          { commandId: "set-style", args: { elementId: "h1", property: "color", value: "#ff0000" } },
          { commandId: "set-attribute", args: { elementId: "h1", attribute: "title", value: "Top" } },
        ],
        [
          { field: "text", from: "", to: "New heading" },
          { field: "color", from: "", to: "#ff0000" },
          { field: "title", from: "", to: "Top" },
        ],
      ),
    );
    expect(out.rows.map((r) => r.from)).toEqual(["Old heading", "#111111", "Hero"]);
  });

  it("leaves rows alone when they do not line up with the commands", () => {
    const e = edit([], [{ field: "text", from: "", to: "x" }]);
    expect(withBeforeValues(composer, e)).toEqual(e);
  });
});
