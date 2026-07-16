/**
 * HistoryFormatter tests — patch -> label/change-list formatting.
 * All functions are pure; assertions use exact expected strings.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  buildHistoryDisplayEntries,
  generateLabelFromEntry,
  formatTransactionLabel,
  formatPropertyName,
  formatPatchChanges,
  formatSingleChange,
  formatValue,
} from "../HistoryFormatter";
import type { CheckpointEntry, PatchEntry } from "../historyTypes";
import type { Patch, PatchOperation, PatchOperationType } from "../utils/JsonPatch";
import type { ProjectData } from "../../shared/types";

function checkpoint(overrides: Partial<CheckpointEntry> = {}): CheckpointEntry {
  return {
    type: "checkpoint",
    timestamp: 1000,
    snapshot: {} as ProjectData,
    ...overrides,
  };
}

function patchEntry(patch: Patch, overrides: Partial<PatchEntry> = {}): PatchEntry {
  return {
    type: "patch",
    timestamp: 2000,
    patch,
    reversePatch: [],
    ...overrides,
  };
}

const REPLACE_COLOR: PatchOperation = {
  op: "replace",
  path: "/elements/0/styles/color",
  oldValue: "red",
  value: "blue",
};

describe("buildHistoryDisplayEntries", () => {
  it("returns empty for an empty stack", () => {
    expect(buildHistoryDisplayEntries([])).toEqual([]);
  });

  it("skips index 0 (initial state)", () => {
    expect(buildHistoryDisplayEntries([checkpoint()])).toEqual([]);
  });

  it("returns entries newest-first with ids/indices matching stack positions", () => {
    const stack = [
      checkpoint({ timestamp: 100 }),
      patchEntry([REPLACE_COLOR], { label: "style-change", timestamp: 200 }),
      patchEntry([{ op: "add", path: "/pages/1", value: { id: "p" } }], { timestamp: 300 }),
    ];

    const entries = buildHistoryDisplayEntries(stack);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "undo-2",
      index: 2,
      timestamp: 300,
      label: "Added page",
      type: "patch",
      userId: null,
    });
    expect(entries[1]).toMatchObject({
      id: "undo-1",
      index: 1,
      timestamp: 200,
      label: "Changed style",
      type: "patch",
    });
  });

  it("formats patch changes for patch entries", () => {
    const entries = buildHistoryDisplayEntries([checkpoint(), patchEntry([REPLACE_COLOR])]);
    expect(entries[0].changes).toEqual([
      {
        property: "color",
        operation: "replace",
        oldValue: "red",
        newValue: "blue",
        description: '"red" → "blue"',
      },
    ]);
  });

  it("gives checkpoint entries an empty change list and the Checkpoint label", () => {
    const entries = buildHistoryDisplayEntries([checkpoint(), checkpoint({ timestamp: 5 })]);
    expect(entries[0].label).toBe("Checkpoint");
    expect(entries[0].changes).toEqual([]);
    expect(entries[0].type).toBe("checkpoint");
  });

  it("an explicit label wins over checkpoint-type labelling", () => {
    const entries = buildHistoryDisplayEntries([
      checkpoint(),
      checkpoint({ label: "manual-save" }),
    ]);
    expect(entries[0].label).toBe("Manual Save");
  });

  it("preserves userId when present", () => {
    const entries = buildHistoryDisplayEntries([
      checkpoint(),
      patchEntry([REPLACE_COLOR], { userId: "user-7" }),
    ]);
    expect(entries[0].userId).toBe("user-7");
  });

  it("empty-string label falls back to generated label", () => {
    const entries = buildHistoryDisplayEntries([
      checkpoint(),
      patchEntry([{ op: "remove", path: "/elements/3", oldValue: {} }], { label: "" }),
    ]);
    expect(entries[0].label).toBe("Removed element");
  });
});

describe("generateLabelFromEntry", () => {
  it("checkpoint always yields 'Checkpoint' (even when labelled)", () => {
    expect(generateLabelFromEntry(checkpoint())).toBe("Checkpoint");
    expect(generateLabelFromEntry(checkpoint({ label: "style-change" }))).toBe("Checkpoint");
  });

  it("patch with a label formats the label", () => {
    expect(generateLabelFromEntry(patchEntry([REPLACE_COLOR], { label: "move-layer" }))).toBe(
      "Moved layer"
    );
  });

  it("empty patch yields 'No changes'", () => {
    expect(generateLabelFromEntry(patchEntry([]))).toBe("No changes");
  });

  describe("elements / children paths", () => {
    it("add -> Added element", () => {
      expect(generateLabelFromEntry(patchEntry([{ op: "add", path: "/elements/0", value: {} }])))
        .toBe("Added element");
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "add", path: "/pages/0/root/children/2", value: {} }])
        )
      ).toBe("Added element");
    });

    it("remove -> Removed element", () => {
      expect(
        generateLabelFromEntry(patchEntry([{ op: "remove", path: "/elements/0", oldValue: {} }]))
      ).toBe("Removed element");
    });

    it("replace on a style property names the property", () => {
      expect(
        generateLabelFromEntry(
          patchEntry([
            { op: "replace", path: "/elements/0/styles/backgroundColor", value: "#fff" },
          ])
        )
      ).toBe("Changed background color");
    });

    it("replace on singular 'style' path also names the property", () => {
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/elements/0/style/color", value: "#000" }])
        )
      ).toBe("Changed text color");
    });

    it("replace on the styles object itself -> Changed style", () => {
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/elements/0/styles", value: {} }])
        )
      ).toBe("Changed style");
    });

    it("replace on content/text -> Edited text", () => {
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/elements/0/content", value: "hi" }])
        )
      ).toBe("Edited text");
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/elements/0/text", value: "hi" }])
        )
      ).toBe("Edited text");
    });

    it("other element replace -> Updated element", () => {
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/elements/0/tagName", value: "div" }])
        )
      ).toBe("Updated element");
    });
  });

  describe("pages paths", () => {
    it("add/remove/replace", () => {
      expect(generateLabelFromEntry(patchEntry([{ op: "add", path: "/pages/0", value: {} }])))
        .toBe("Added page");
      expect(
        generateLabelFromEntry(patchEntry([{ op: "remove", path: "/pages/0", oldValue: {} }]))
      ).toBe("Removed page");
      expect(
        generateLabelFromEntry(patchEntry([{ op: "replace", path: "/pages/0/name", value: "x" }]))
      ).toBe("Updated page");
    });
  });

  describe("components paths", () => {
    it("add/remove/replace", () => {
      expect(generateLabelFromEntry(patchEntry([{ op: "add", path: "/components/0", value: {} }])))
        .toBe("Created component");
      expect(
        generateLabelFromEntry(patchEntry([{ op: "remove", path: "/components/0", oldValue: {} }]))
      ).toBe("Removed component");
      expect(
        generateLabelFromEntry(
          patchEntry([{ op: "replace", path: "/components/0/name", value: "x" }])
        )
      ).toBe("Updated component");
    });
  });

  it("selection path -> Changed selection", () => {
    expect(
      generateLabelFromEntry(patchEntry([{ op: "replace", path: "/selection", value: [] }]))
    ).toBe("Changed selection");
  });

  it("unrecognized paths fall back to a change count with pluralization", () => {
    const op: PatchOperation = { op: "replace", path: "/meta/title", value: "x" };
    expect(generateLabelFromEntry(patchEntry([op]))).toBe("1 change");
    expect(generateLabelFromEntry(patchEntry([op, op]))).toBe("2 changes");
  });

  it("only the FIRST op determines the label", () => {
    const entry = patchEntry([
      { op: "add", path: "/pages/2", value: {} },
      { op: "add", path: "/elements/0", value: {} },
    ]);
    expect(generateLabelFromEntry(entry)).toBe("Added page");
  });
});

describe("formatTransactionLabel", () => {
  it("maps all known transaction labels", () => {
    const expectations: Array<[string, string]> = [
      ["apply-template", "Applied template"],
      ["insert-block-sidebar", "Added block"],
      ["style-change", "Changed style"],
      ["style-batch", "Changed styles"],
      ["import-html-to-active-page", "Imported HTML"],
      ["insert-html-to-element", "Inserted HTML"],
      ["variant-change", "Changed variant"],
      ["instance-sync", "Synced component"],
      ["move-layer", "Moved layer"],
      ["Add Element", "Added element"],
    ];
    for (const [input, output] of expectations) {
      expect(formatTransactionLabel(input)).toBe(output);
    }
  });

  it("title-cases unknown kebab-case labels", () => {
    expect(formatTransactionLabel("delete-element")).toBe("Delete Element");
  });

  it("title-cases unknown snake_case labels", () => {
    expect(formatTransactionLabel("my_custom_label")).toBe("My Custom Label");
  });

  it("normalizes mixed-case words", () => {
    expect(formatTransactionLabel("FOO-bAr")).toBe("Foo Bar");
  });

  it("capitalizes a single word", () => {
    expect(formatTransactionLabel("publish")).toBe("Publish");
  });

  it("returns empty string for empty input", () => {
    expect(formatTransactionLabel("")).toBe("");
  });
});

describe("formatPropertyName", () => {
  it("maps known CSS properties to friendly names", () => {
    const expectations: Array<[string, string]> = [
      ["backgroundColor", "background color"],
      ["fontSize", "font size"],
      ["fontFamily", "font"],
      ["textAlign", "text alignment"],
      ["boxShadow", "shadow"],
      ["color", "text color"],
      ["justifyContent", "alignment"],
      ["alignItems", "alignment"],
      ["width", "width"],
    ];
    for (const [input, output] of expectations) {
      expect(formatPropertyName(input)).toBe(output);
    }
  });

  it("splits unknown camelCase into lowercase words", () => {
    expect(formatPropertyName("borderTopLeftRadius")).toBe("border top left radius");
    expect(formatPropertyName("zIndex")).toBe("z index");
  });

  it("passes through already-lowercase names", () => {
    expect(formatPropertyName("float")).toBe("float");
  });
});

describe("formatPatchChanges", () => {
  const op = (i: number): PatchOperation => ({
    op: "replace",
    path: `/elements/0/styles/prop${i}`,
    oldValue: i,
    value: i + 1,
  });

  it("returns empty for an empty patch", () => {
    expect(formatPatchChanges([])).toEqual([]);
  });

  it("formats every op when under the cap", () => {
    const changes = formatPatchChanges([op(1), op(2), op(3)]);
    expect(changes).toHaveLength(3);
    expect(changes[0]).toMatchObject({ property: "prop1", operation: "replace" });
  });

  it("exactly 10 ops produce 10 changes with no overflow row", () => {
    const changes = formatPatchChanges(Array.from({ length: 10 }, (_, i) => op(i)));
    expect(changes).toHaveLength(10);
    expect(changes.every((c) => c.operation !== "info")).toBe(true);
  });

  it("caps at 10 and appends an info row with the remainder count", () => {
    const changes = formatPatchChanges(Array.from({ length: 12 }, (_, i) => op(i)));
    expect(changes).toHaveLength(11);
    expect(changes[10]).toEqual({
      property: "...",
      operation: "info",
      description: "and 2 more changes",
    });
  });

  it("11 ops yield the (current) 'and 1 more changes' wording", () => {
    const changes = formatPatchChanges(Array.from({ length: 11 }, (_, i) => op(i)));
    expect(changes[10].description).toBe("and 1 more changes");
  });
});

describe("formatSingleChange", () => {
  it("replace: property from styles path, arrow description, old/new carried", () => {
    expect(formatSingleChange(REPLACE_COLOR)).toEqual({
      property: "color",
      operation: "replace",
      oldValue: "red",
      newValue: "blue",
      description: '"red" → "blue"',
    });
  });

  it("add on a children path -> 'child element' with + description", () => {
    const change = formatSingleChange({
      op: "add",
      path: "/pages/0/root/children/3",
      value: { tag: "div", id: "x" },
    });
    expect(change.property).toBe("child element");
    expect(change.operation).toBe("add");
    expect(change.description).toBe("+ {tag, id}");
  });

  it("remove on an elements path -> element[index] with - description", () => {
    const change = formatSingleChange({ op: "remove", path: "/elements/2", oldValue: "gone" });
    expect(change.property).toBe("element[2]");
    expect(change.description).toBe('- "gone"');
  });

  it("elements as the final segment keeps the raw property name", () => {
    const change = formatSingleChange({ op: "replace", path: "/elements", value: [] });
    expect(change.property).toBe("elements");
  });

  it("styles branch wins over children branch", () => {
    const change = formatSingleChange({
      op: "replace",
      path: "/children/0/styles/fontSize",
      oldValue: "12px",
      value: "14px",
    });
    expect(change.property).toBe("fontSize");
  });

  it("children branch wins over elements branch", () => {
    const change = formatSingleChange({
      op: "replace",
      path: "/elements/0/children/1",
      value: {},
    });
    expect(change.property).toBe("child element");
  });

  it("empty and root paths fall back to 'root'", () => {
    expect(formatSingleChange({ op: "add", path: "", value: 5 })).toMatchObject({
      property: "root",
      description: "+ 5",
    });
    expect(formatSingleChange({ op: "add", path: "/", value: 5 }).property).toBe("root");
  });

  it("replace with missing values renders null on both sides", () => {
    const change = formatSingleChange({ op: "replace", path: "/foo" });
    expect(change.description).toBe("null → null");
  });

  // Cast is required to reach the uncovered default: op values outside the
  // union leave the description empty (no default case in the switch).
  it("unknown op yields an empty description", () => {
    const change = formatSingleChange({
      op: "move" as PatchOperationType,
      path: "/elements/0",
    });
    expect(change.description).toBe("");
    expect(change.property).toBe("element[0]");
  });
});

describe("formatValue", () => {
  it("null and undefined render as 'null'", () => {
    expect(formatValue(null)).toBe("null");
    expect(formatValue(undefined)).toBe("null");
  });

  it("quotes short strings", () => {
    expect(formatValue("hi")).toBe('"hi"');
    expect(formatValue("")).toBe('""');
  });

  it("keeps a 20-char string intact (boundary)", () => {
    const s = "a".repeat(20);
    expect(formatValue(s)).toBe(`"${s}"`);
  });

  it("truncates 21+ char strings to 17 chars + ellipsis", () => {
    expect(formatValue("abcdefghijklmnopqrstu")).toBe('"abcdefghijklmnopq..."');
  });

  it("renders numbers and booleans verbatim", () => {
    expect(formatValue(42)).toBe("42");
    expect(formatValue(0)).toBe("0");
    expect(formatValue(true)).toBe("true");
    expect(formatValue(false)).toBe("false");
    expect(formatValue(NaN)).toBe("NaN");
  });

  it("summarizes arrays by length", () => {
    expect(formatValue([])).toBe("[0 items]");
    expect(formatValue([1, 2, 3])).toBe("[3 items]");
  });

  it("stringifies other primitives via the final fallback", () => {
    expect(formatValue(BigInt(10))).toBe("10");
    expect(formatValue(Symbol("x"))).toBe("Symbol(x)");
  });

  it("summarizes objects by their first keys", () => {
    expect(formatValue({})).toBe("{}");
    expect(formatValue({ a: 1 })).toBe("{a}");
    expect(formatValue({ a: 1, b: 2 })).toBe("{a, b}");
    expect(formatValue({ a: 1, b: 2, c: 3 })).toBe("{a, b...}");
    expect(formatValue({ a: 1, b: 2, c: 3, d: 4 })).toBe("{a, b...}");
  });
});
