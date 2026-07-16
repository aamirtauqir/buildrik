/**
 * helpers.test.ts — collapseIdenticalChanges grouping logic.
 * groupByDate + ActivityView error state are covered in HistoryTab.test.tsx;
 * this file fills the remaining helper gap only.
 */

import { describe, it, expect } from "vitest";
import { collapseIdenticalChanges } from "../helpers";
import type { HistoryChange } from "@/engine/historyTypes";

function change(
  property: string,
  operation: HistoryChange["operation"],
  description = `${property} ${operation}`
): HistoryChange {
  return { property, operation, description };
}

describe("collapseIdenticalChanges", () => {
  it("returns empty array for no changes", () => {
    expect(collapseIdenticalChanges([])).toEqual([]);
  });

  it("collapses identical (property, operation) pairs into one row with a count", () => {
    const result = collapseIdenticalChanges([
      change("color", "replace"),
      change("color", "replace"),
      change("color", "replace"),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].property).toBe("color");
    expect(result[0].operation).toBe("replace");
    expect(result[0].count).toBe(3);
  });

  it("keeps the FIRST raw change of a group as the sample", () => {
    const first = change("color", "replace", "first edit");
    const result = collapseIdenticalChanges([
      first,
      change("color", "replace", "second edit"),
    ]);
    expect(result[0].sample).toBe(first);
    expect(result[0].sample.description).toBe("first edit");
  });

  it("does NOT merge same property with different operations", () => {
    const result = collapseIdenticalChanges([
      change("color", "add"),
      change("color", "remove"),
    ]);
    expect(result).toHaveLength(2);
    const ops = result.map((r) => r.operation).sort();
    expect(ops).toEqual(["add", "remove"]);
  });

  it("does NOT merge different properties even when classified as the same type", () => {
    // Both classify as "style" but property strings differ → separate rows.
    const result = collapseIdenticalChanges([
      change("color", "replace"),
      change("backgroundColor", "replace"),
    ]);
    expect(result).toHaveLength(2);
  });

  it("classifies properties via the engine classifier (style/text/other)", () => {
    const result = collapseIdenticalChanges([
      change("color", "replace"), // STYLE_PROPERTIES
      change("textContent", "replace"), // TEXT_PROPERTIES
      change("someUnknownProp", "replace"), // fallback
    ]);
    const byProp = new Map(result.map((r) => [r.property, r.type]));
    expect(byProp.get("color")).toBe("style");
    expect(byProp.get("textContent")).toBe("text");
    expect(byProp.get("someUnknownProp")).toBe("other");
  });

  it("strips the style./styles. prefix before classification", () => {
    const result = collapseIdenticalChanges([change("styles.color", "replace")]);
    expect(result[0].type).toBe("style");
    // The property string itself is preserved un-normalized for display.
    expect(result[0].property).toBe("styles.color");
  });

  it("defaults a missing operation to 'info'", () => {
    const raw = {
      property: "color",
      operation: undefined,
      description: "no-op field",
    } as unknown as HistoryChange;
    const result = collapseIdenticalChanges([raw]);
    expect(result[0].operation).toBe("info");
  });

  it("sorts groups by count descending (most-changed property first)", () => {
    const result = collapseIdenticalChanges([
      change("opacity", "replace"),
      change("color", "replace"),
      change("color", "replace"),
      change("color", "replace"),
      change("width", "replace"),
      change("width", "replace"),
    ]);
    expect(result.map((r) => [r.property, r.count])).toEqual([
      ["color", 3],
      ["width", 2],
      ["opacity", 1],
    ]);
  });
});
