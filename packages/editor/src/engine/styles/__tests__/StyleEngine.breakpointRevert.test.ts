/**
 * P-9b — reverting a breakpoint override clears it from the element too.
 *
 * setBreakpointStyle writes two places: the media-query rule (the canvas) and
 * the element's own `breakpointStyles` (serialisation, and what ReactExporter
 * reads). removeBreakpointStyleProperty — the Inspector's per-field reset and
 * "Revert all" — only emptied the rule, so the element kept the override and
 * the React export still shipped it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ReactExporter } from "../../export/ReactExporter";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "../../__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  const heading = c.elements.createElement("heading", { content: "Title" });
  c.elements.addElement(heading, page.root.id);
  const id = heading.getId();
  c.styles.setBreakpointStyle(id, "tablet", { color: "rgb(255, 0, 0)", "font-size": "20px" });
  c.styles.setBreakpointStyle(id, "mobile", { color: "rgb(0, 0, 255)" });
  return { c, id };
}

describe("P-9b — removeBreakpointStyleProperty updates element.breakpointStyles", () => {
  it("removing one override drops it from the element's breakpointStyles", () => {
    const { c, id } = setup();
    c.styles.removeBreakpointStyleProperty(id, "tablet", "color");
    expect(c.elements.getElement(id)!.getData().breakpointStyles?.tablet).toEqual({ "font-size": "20px" });
  });

  it("removing every override (Revert all) leaves no stale breakpoint on the element", () => {
    const { c, id } = setup();
    c.styles.removeBreakpointStyleProperty(id, "tablet", "color");
    c.styles.removeBreakpointStyleProperty(id, "tablet", "font-size");
    const bp = c.elements.getElement(id)!.getData().breakpointStyles;
    expect(bp?.tablet).toBeUndefined();
    expect(bp?.mobile).toEqual({ color: "rgb(0, 0, 255)" });
  });

  it("the React export no longer carries the reverted override", () => {
    const { c, id } = setup();
    c.styles.removeBreakpointStyleProperty(id, "tablet", "color");
    c.styles.removeBreakpointStyleProperty(id, "tablet", "font-size");
    const result = new ReactExporter(c).export();
    expect(result.success).toBe(true);
    const all = (result.files ?? []).map((f) => f.content).join("\n");
    expect(all).toContain("rgb(0, 0, 255)");
    expect(all).not.toContain("rgb(255, 0, 0)");
  });
});
