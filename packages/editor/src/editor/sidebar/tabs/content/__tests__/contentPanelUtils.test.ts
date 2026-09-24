/**
 * contentPanelUtils tests — variable persistence + validation, condition
 * summaries (board 151:87 sub-lines), field defaults.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadLegacySiteVariables,
  variablesToSourceData,
  isValidVariableKey,
  conditionSummary,
  fieldDefault,
} from "../contentPanelUtils";
import type { CMSField } from "@/shared/types/cms";
import type { ConditionBinding } from "@/shared/types/data";

beforeEach(() => localStorage.clear());

describe("legacy site variables (localStorage, read once to migrate into the project)", () => {
  it("reads per project id", () => {
    localStorage.setItem("buildrick-site-variables-proj-a", JSON.stringify([{ key: "name", value: "Bella Cucina" }]));
    expect(loadLegacySiteVariables("proj-a")).toEqual([{ key: "name", value: "Bella Cucina" }]);
    expect(loadLegacySiteVariables("proj-b")).toEqual([]);
  });

  it("survives corrupt storage (returns [])", () => {
    localStorage.setItem("buildrick-site-variables-x", "{not json");
    expect(loadLegacySiteVariables("x")).toEqual([]);
    localStorage.setItem("buildrick-site-variables-x", JSON.stringify({ nope: 1 }));
    expect(loadLegacySiteVariables("x")).toEqual([]);
  });

  it("filters malformed entries", () => {
    localStorage.setItem(
      "buildrick-site-variables-x",
      JSON.stringify([{ key: "ok", value: "1" }, { key: 2 }, null]),
    );
    expect(loadLegacySiteVariables("x")).toEqual([{ key: "ok", value: "1" }]);
  });

  it("variablesToSourceData maps to a flat object", () => {
    expect(variablesToSourceData([{ key: "a", value: "1" }, { key: "b", value: "2" }])).toEqual({
      a: "1",
      b: "2",
    });
  });
});

describe("isValidVariableKey", () => {
  it("accepts letter-led keys with digits/dashes/underscores", () => {
    for (const k of ["name", "phone2", "open-hours", "a_b"]) expect(isValidVariableKey(k)).toBe(true);
  });
  it("rejects dots, spaces, leading digits, empties", () => {
    for (const k of ["", "2fast", "site.name", "with space", "{{x}}"]) expect(isValidVariableKey(k)).toBe(false);
  });
});

describe("conditionSummary", () => {
  const bind = (condition: ConditionBinding["condition"]): ConditionBinding => ({
    type: "condition",
    sourceId: "",
    path: "",
    condition,
  });

  it('renders "when available is false" for a simple expression', () => {
    expect(conditionSummary(bind({ operator: "==", left: "available", right: "false" }))).toBe(
      "when available is false",
    );
  });

  it("labels binding sides via sourceId.path", () => {
    expect(
      conditionSummary(
        bind({
          operator: ">",
          left: { type: "variable", sourceId: "site", path: "hours" } as never,
          right: 17,
        }),
      ),
    ).toBe("when site.hours > 17");
  });

  it("renders logic groups with their operator", () => {
    expect(
      conditionSummary(
        bind({
          operator: "AND",
          conditions: [
            { operator: "==", left: "a", right: "1" },
            { operator: "exists", left: "b" },
          ],
        }),
      ),
    ).toBe("when a is 1 and b exists");
  });
});

describe("fieldDefault", () => {
  const field = (over: Partial<CMSField>): CMSField =>
    ({ id: "f", name: "F", slug: "f", type: "text", order: 0, ...over }) as CMSField;

  it("honors explicit defaultValue", () => {
    expect(fieldDefault(field({ defaultValue: "x" }))).toBe("x");
  });
  it("types defaults: boolean false, number 0, multiselect [], text empty", () => {
    expect(fieldDefault(field({ type: "boolean" }))).toBe(false);
    expect(fieldDefault(field({ type: "number" }))).toBe(0);
    expect(fieldDefault(field({ type: "multiselect" }))).toEqual([]);
    expect(fieldDefault(field({ type: "text" }))).toBe("");
  });
});
