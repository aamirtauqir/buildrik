/**
 * exportUtils — pure export helpers for the Design System tab
 * @license BSD-3-Clause
 */

import type { DesignToken } from "../types";

export type ExportFormat = "css" | "tailwind" | "json";

// ============================================================================
// COMPATIBILITY SHIM (DS V1 Task 5.3)
// ============================================================================

/**
 * Alias retention entry. When a token is renamed, add one entry here:
 *   oldName: the deprecated --buildrick-design-* name (what user's deployed site uses)
 *   newName: the new canonical --buildrick-design-* name
 *   deprecatedIn: first version where rename happened
 *   removeIn: version where alias is dropped (deprecatedIn + 2 per policy)
 *
 * During the 2-major-version retention window, exported CSS includes the alias
 * so deployed user sites keep rendering correctly.
 */
interface AliasEntry {
  oldName: string;
  newName: string;
  deprecatedIn: number;
  removeIn: number;
}

const ALIAS_RETENTION: AliasEntry[] = [
  // DS V1 is baseline — no renames yet.
  // Example future entry:
  // {
  //   oldName: "--buildrick-design-color-primary",
  //   newName: "--buildrick-design-color-brand-primary",
  //   deprecatedIn: 2,
  //   removeIn: 4,
  // },
];

/**
 * Generate CSS compatibility shim aliases for the given schema version.
 *
 * For each deprecated alias still within its 2-version retention window,
 * emit an alias line. Prepended to exported design-tokens.css so user's
 * deployed sites keep working after editor upgrades rename tokens.
 *
 * At V1 (baseline, no renames yet), returns empty string.
 */
export function generateCompatibilityShim(fromVersion: number): string {
  const lines: string[] = [];
  for (const entry of ALIAS_RETENTION) {
    const inRetention =
      fromVersion >= entry.deprecatedIn && fromVersion < entry.removeIn;
    if (inRetention) {
      lines.push(`  ${entry.oldName}: var(${entry.newName});`);
    }
  }

  if (lines.length === 0) return "";

  return [
    "/* Buildrik DS compatibility aliases. 2-version retention policy. */",
    ":root {",
    ...lines,
    "}",
    "",
  ].join("\n");
}

export function generateColorTokenId(name: string): string {
  return `color-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function generateColorCssVar(name: string): string {
  return `--buildrick-design-color-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function buildExport(
  tokens: DesignToken[],
  format: ExportFormat,
  schemaVersion: number = 1
): { content: string; filename: string } {
  if (format === "css") {
    const colorVars = tokens.filter((t) => t.category === "colors");
    const typeVars = tokens.filter((t) => t.category === "typography");
    const spacingVars = tokens.filter((t) => t.category === "spacing");
    const otherVars = tokens.filter(
      (t) => !["colors", "typography", "spacing", "theme"].includes(t.category)
    );

    const toVar = (t: DesignToken) => `  ${t.cssVar}: ${t.value};`;

    const lines: string[] = [":root {"];
    if (colorVars.length) {
      lines.push("  /* === Brand & Surface Colors === */", ...colorVars.map(toVar));
    }
    if (typeVars.length) {
      lines.push("", "  /* === Typography === */", ...typeVars.map(toVar));
    }
    if (spacingVars.length) {
      lines.push("", "  /* === Spacing === */", ...spacingVars.map(toVar));
    }
    if (otherVars.length) {
      lines.push("", "  /* === Other === */", ...otherVars.map(toVar));
    }
    lines.push("}");

    // Prepend compatibility shim (empty at V1 baseline; populates when
    // future versions rename tokens within retention window).
    const shim = generateCompatibilityShim(schemaVersion);
    const content = shim + lines.join("\n");
    return { content, filename: "design-tokens.css" };
  }
  if (format === "json") {
    return { content: JSON.stringify(tokens, null, 2), filename: "design-tokens.json" };
  }
  const colorTokens = tokens.filter((t) => t.type === "color");
  const colors: Record<string, string> = {};
  colorTokens.forEach((t) => (colors[t.name.toLowerCase().replace(/\s+/g, "-")] = t.value));
  const content = `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 6)},\n    },\n  },\n};\n`;
  return { content, filename: "tailwind.config.js" };
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
