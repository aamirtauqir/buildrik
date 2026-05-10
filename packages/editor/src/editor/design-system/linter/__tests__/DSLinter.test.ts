import { describe, it, expect } from "vitest";
import { DSLinter } from "../DSLinter";
import type { DesignToken, StylePreset, PresetBinding } from "../../types";

function makeColor(id: string, value: string, darkValue?: string): DesignToken {
  return {
    id, name: id, value,
    category: "colors", cssVar: `--bd-${id}`, type: "color", kind: "color",
    ...(darkValue !== undefined ? { darkValue } : {}),
  };
}

function bind(tokenId: string): PresetBinding {
  return { tokenId };
}

function makePreset(
  id: string,
  bindings: Record<string, PresetBinding>,
): StylePreset {
  return {
    id, friendlyName: id, category: "button", variant: "default", bindings,
  };
}

describe("DSLinter.lint", () => {
  it("returns empty array for compliant tokens", () => {
    const tokens: DesignToken[] = [
      makeColor("color-primary", "#2D6DFF", "#60A5FA"),
      makeColor("color-text", "#334155", "#E2E8F0"),
    ];
    expect(new DSLinter().lint(tokens)).toEqual([]);
  });

  it("flags banned indigo/violet/purple hex values", () => {
    const tokens = [
      makeColor("color-bad-indigo", "#6366F1"),
      makeColor("color-bad-violet", "#8B5CF6"),
      makeColor("color-bad-purple", "#A855F7"),
    ];
    const issues = new DSLinter().lint(tokens);
    const banned = issues.filter((i) => i.rule === "banned-hue");
    expect(banned).toHaveLength(3);
    expect(banned.every((i) => i.severity === "error")).toBe(true);
  });

  it("flags banned named CSS color keywords", () => {
    const tokens = [
      makeColor("color-named", "purple"),
    ];
    const issues = new DSLinter().lint(tokens);
    expect(issues.some((i) => i.rule === "banned-hue")).toBe(true);
  });

  it("flags banned hue inside darkValue", () => {
    const tokens = [
      makeColor("color-primary", "#2D6DFF", "#8B5CF6"),
    ];
    const issues = new DSLinter().lint(tokens);
    expect(issues.some((i) => i.rule === "banned-hue" && i.message.includes("darkValue"))).toBe(true);
  });

  it("flags pure black (#000, #000000, 'black')", () => {
    const tokens = [
      makeColor("color-bad-1", "#000"),
      makeColor("color-bad-2", "#000000"),
      makeColor("color-bad-3", "black"),
    ];
    const issues = new DSLinter().lint(tokens).filter((i) => i.rule === "pure-black");
    expect(issues).toHaveLength(3);
  });

  it("flags pure black inside darkValue", () => {
    const tokens = [
      makeColor("color-primary", "#fff", "#000000"),
    ];
    const issues = new DSLinter().lint(tokens);
    expect(issues.some((i) => i.rule === "pure-black" && i.message.includes("darkValue"))).toBe(true);
  });

  it("flags empty value (color token: warning, non-color token: error)", () => {
    const tokens: DesignToken[] = [
      makeColor("color-empty", ""),
      { id: "spacing-empty", name: "Spacing", value: "", category: "spacing", cssVar: "--bd-sp", type: "length" },
    ];
    const issues = new DSLinter().lint(tokens);
    const empty = issues.filter((i) => i.rule === "empty-value");
    expect(empty).toHaveLength(2);
    const colorIssue = empty.find((i) => i.tokenId === "color-empty");
    const spacingIssue = empty.find((i) => i.tokenId === "spacing-empty");
    expect(colorIssue?.severity).toBe("warning");
    expect(spacingIssue?.severity).toBe("error");
  });

  it("missing-dark: no warnings when project has zero dark intent", () => {
    const tokens = [
      makeColor("color-primary", "#fff"),
      makeColor("color-text", "#334155"),
    ];
    const issues = new DSLinter().lint(tokens);
    expect(issues.filter((i) => i.rule === "missing-dark")).toHaveLength(0);
  });

  it("missing-dark: warns on tokens missing darkValue when ANY token has darkValue", () => {
    const tokens = [
      makeColor("color-primary", "#2D6DFF", "#60A5FA"),
      makeColor("color-text", "#334155"),
      makeColor("color-muted", "#71717A"),
    ];
    const issues = new DSLinter().lint(tokens);
    const missing = issues.filter((i) => i.rule === "missing-dark");
    expect(missing.map((i) => i.tokenId).sort()).toEqual(["color-muted", "color-text"]);
    expect(missing.every((i) => i.severity === "warning")).toBe(true);
  });

  it("returns issues in deterministic per-token order", () => {
    const tokens = [
      makeColor("a", "#000"),
      makeColor("b", "#8B5CF6"),
    ];
    const issues = new DSLinter().lint(tokens);
    expect(issues[0].tokenId).toBe("a");
    expect(issues[1].tokenId).toBe("b");
  });
});

describe("DSLinter.lintPresets", () => {
  it("returns empty array when every binding resolves", () => {
    const tokens = [
      makeColor("color-primary", "#2D6DFF"),
      makeColor("color-on-primary", "#FFFFFF"),
    ];
    const presets = [
      makePreset("button-primary", {
        backgroundColor: bind("color-primary"),
        color: bind("color-on-primary"),
      }),
    ];
    expect(new DSLinter().lintPresets(presets, tokens)).toEqual([]);
  });

  it("flags one issue per unresolved binding (error severity)", () => {
    const tokens = [makeColor("color-primary", "#2D6DFF")];
    const presets = [
      makePreset("button-primary", {
        backgroundColor: bind("color-primary"),
        color: bind("color-ghost"),
        borderColor: bind("color-vanished"),
      }),
    ];
    const issues = new DSLinter().lintPresets(presets, tokens);
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.rule === "unresolved-binding")).toBe(true);
    expect(issues.every((i) => i.severity === "error")).toBe(true);
  });

  it("encodes preset.css in tokenId for UI row-scoping", () => {
    const presets = [
      makePreset("button-primary", { backgroundColor: bind("color-missing") }),
    ];
    const issues = new DSLinter().lintPresets(presets, []);
    expect(issues[0].tokenId).toBe("button-primary.backgroundColor");
    expect(issues[0].message).toContain("button-primary");
    expect(issues[0].message).toContain("backgroundColor");
    expect(issues[0].message).toContain("color-missing");
  });

  it("scans across multiple presets", () => {
    const tokens = [makeColor("color-primary", "#2D6DFF")];
    const presets = [
      makePreset("button-primary", { backgroundColor: bind("color-primary") }),
      makePreset("button-ghost", { borderColor: bind("color-orphaned") }),
      makePreset("card-elevated", { backgroundColor: bind("color-also-gone") }),
    ];
    const issues = new DSLinter().lintPresets(presets, tokens);
    expect(issues.map((i) => i.tokenId).sort()).toEqual([
      "button-ghost.borderColor",
      "card-elevated.backgroundColor",
    ]);
  });

  it("returns empty when presets array is empty (no false positives)", () => {
    expect(new DSLinter().lintPresets([], [])).toEqual([]);
  });
});

describe("DSLinter.errors", () => {
  it("filters to only error-severity issues", () => {
    const tokens = [
      makeColor("color-primary", "#2D6DFF", "#60A5FA"),
      makeColor("color-text", "#334155"), // missing-dark warning
      makeColor("color-bad", "#000"),     // pure-black error
    ];
    const errors = new DSLinter().errors(tokens);
    expect(errors).toHaveLength(1);
    expect(errors[0].rule).toBe("pure-black");
  });
});
