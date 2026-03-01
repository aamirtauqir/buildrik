/**
 * exportUtils — pure export helpers for the Design System tab
 * @license BSD-3-Clause
 */

import type { DesignToken } from "../types";

export type ExportFormat = "css" | "tailwind" | "json";

export function generateColorTokenId(name: string): string {
  return `color-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function generateColorCssVar(name: string): string {
  return `--aqb-color-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

export function buildExport(
  tokens: DesignToken[],
  format: ExportFormat
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

    return { content: lines.join("\n"), filename: "design-tokens.css" };
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
