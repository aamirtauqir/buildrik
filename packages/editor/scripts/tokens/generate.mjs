#!/usr/bin/env node
/**
 * Design token generator — Figma is the source of truth.
 *
 * Reads scripts/tokens/figma-tokens.json (exported from the Buildrick Figma
 * file) and emits the ONLY two token artifacts the editor is allowed to read:
 *
 *   src/themes/tokens.generated.css  — CSS custom properties for all styling
 *   src/themes/tokens.generated.ts   — the same values for JS/TS consumers
 *
 * Both outputs are generated. Hand-editing them is a build failure (see
 * scripts/check-tokens-generated.mjs). To change a value, change it in Figma,
 * re-export, and re-run this script.
 *
 * Naming: every token is `--bk-*`. Two tiers only.
 *   Tier 1 palette   — raw scale steps (--bk-blue-700, --bk-gray-200)
 *   Tier 2 semantic  — role tokens that reference tier 1 (--bk-accent, --bk-ink)
 * There is no third alias tier. That tier is what rotted last time.
 *
 * Spacing is named by its pixel value (--bk-space-16 is 16px), which makes a
 * duplicate scale impossible to introduce by accident.
 *
 * @license BSD-3-Clause
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const SRC = join(ROOT, "src", "themes");

const tokens = JSON.parse(readFileSync(join(HERE, "figma-tokens.json"), "utf8"));

/** hex -> palette token name, so semantic tokens can reference tier 1 instead of repeating a literal */
const paletteByHex = new Map();
for (const [name, hex] of Object.entries(tokens.palette)) {
  const varName = `--bk-${name.replace("/", "-")}`;
  if (!paletteByHex.has(hex.toUpperCase())) paletteByHex.set(hex.toUpperCase(), varName);
}

/** A semantic value resolves to a palette reference when the hex exists in tier 1. */
function semanticValue(hex) {
  const ref = paletteByHex.get(hex.toUpperCase());
  return ref ? `var(${ref})` : hex;
}

const lines = [];
const push = (s = "") => lines.push(s);

push("/**");
push(" * GENERATED FILE — DO NOT EDIT.");
push(" *");
push(` * Source: Figma file ${tokens.source.fileKey} (${tokens.source.fileName})`);
push(` * Collections: ${tokens.source.collections.join(", ")}`);
push(` * Mode: ${tokens.source.mode}`);
push(" *");
push(" * Regenerate: node scripts/tokens/generate.mjs");
push(" * Change a value: edit the Figma variable, re-export, regenerate.");
push(" */");
push();
push(":root {");

push("  /* ── Tier 1 · palette ─────────────────────────────────────────── */");
let group = null;
for (const [name, hex] of Object.entries(tokens.palette)) {
  const [family] = name.split("/");
  if (family !== group) {
    push();
    group = family;
  }
  push(`  --bk-${name.replace("/", "-")}: ${hex};`);
}

push();
push("  /* ── Tier 2 · semantic roles ──────────────────────────────────── */");
push();
for (const [name, hex] of Object.entries(tokens.semantic)) {
  push(`  --bk-${name}: ${semanticValue(hex)};`);
}

push();
push("  /* ── Space · named by pixel value ─────────────────────────────── */");
push();
for (const n of tokens.space) push(`  --bk-space-${n}: ${n}px;`);

push();
push("  /* ── Radius ───────────────────────────────────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.radius)) push(`  --bk-radius-${k}: ${v}px;`);

push();
push("  /* ── Size · the shell's committed numbers ─────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.size)) push(`  --bk-size-${k}: ${v}px;`);

push();
push("  /* ── Z-index ──────────────────────────────────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.z)) push(`  --bk-z-${k}: ${v};`);

push();
push("  /* ── Motion ───────────────────────────────────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.motion)) push(`  --bk-motion-${k}: ${v}ms;`);

push();
push("  /* ── Focus ────────────────────────────────────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.focus)) push(`  --bk-focus-${k}: ${v}px;`);

push();
push("  /* ── Typography · mirrors the 11 Figma text styles ────────────── */");
push();
for (const [k, v] of Object.entries(tokens.font)) push(`  --bk-font-${k}: ${v};`);
push();
for (const [k, v] of Object.entries(tokens.text)) push(`  --bk-text-${k}: ${v}px;`);
push();
for (const [k, v] of Object.entries(tokens.leading)) push(`  --bk-leading-${k}: ${v}px;`);
push();
for (const [k, v] of Object.entries(tokens.weight)) push(`  --bk-weight-${k}: ${v};`);
push();
for (const [k, v] of Object.entries(tokens.ease)) push(`  --bk-ease-${k}: ${v};`);
push();
for (const [k, v] of Object.entries(tokens.transition)) push(`  --bk-transition-${k}: ${v};`);
push();
for (const [k, v] of Object.entries(tokens.tracking)) push(`  --bk-tracking-${k}: ${v};`);
push();
for (const [k, v] of Object.entries(tokens.leadingRatio)) push(`  --bk-leading-${k}: ${v};`);

push();
push("  /* ── Elevation · mirrors the 3 Figma effect styles ─────────────── */");
push();
for (const [k, v] of Object.entries(tokens.shadow)) push(`  --bk-shadow-${k}: ${v};`);

push();
push("  /* ── Alpha · derived from the palette ─────────────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.alpha)) push(`  --bk-alpha-${k}: ${v};`);

push();
push("  /* ── Box-model overlay · canvas dev tooling ───────────────────── */");
push();
for (const [k, v] of Object.entries(tokens.boxmodel)) push(`  --bk-boxmodel-${k}: ${v};`);

push("}");
push();

const css = lines.join("\n");

/* ── TS output — same values, for code that can't read CSS vars ────────── */
const ts = [
  "/**",
  " * GENERATED FILE — DO NOT EDIT.",
  " *",
  ` * Source: Figma file ${tokens.source.fileKey} (${tokens.source.fileName})`,
  " * Regenerate: node scripts/tokens/generate.mjs",
  " */",
  "",
  "export const palette = {",
  ...Object.entries(tokens.palette).map(([k, v]) => `  "${k.replace("/", "-")}": "${v}",`),
  "} as const;",
  "",
  "export const color = {",
  ...Object.entries(tokens.semantic).map(([k, v]) => `  "${k}": "${v}",`),
  "} as const;",
  "",
  `export const space = [${tokens.space.join(", ")}] as const;`,
  "",
  "export const radius = {",
  ...Object.entries(tokens.radius).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export const size = {",
  ...Object.entries(tokens.size).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export const z = {",
  ...Object.entries(tokens.z).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export const motion = {",
  ...Object.entries(tokens.motion).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export const font = {",
  ...Object.entries(tokens.font).map(([k, v]) => `  "${k}": ${JSON.stringify(v)},`),
  "} as const;",
  "",
  "export const text = {",
  ...Object.entries(tokens.text).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export const weight = {",
  ...Object.entries(tokens.weight).map(([k, v]) => `  "${k}": ${v},`),
  "} as const;",
  "",
  "export type ColorToken = keyof typeof color;",
  "export type PaletteToken = keyof typeof palette;",
  "",
].join("\n");

mkdirSync(SRC, { recursive: true });
writeFileSync(join(SRC, "tokens.generated.css"), css);
writeFileSync(join(SRC, "tokens.generated.ts"), ts);

const count =
  Object.keys(tokens.palette).length +
  Object.keys(tokens.semantic).length +
  tokens.space.length +
  Object.keys(tokens.radius).length +
  Object.keys(tokens.size).length +
  Object.keys(tokens.z).length +
  Object.keys(tokens.motion).length +
  Object.keys(tokens.focus).length;

const sum = createHash("sha256").update(css).digest("hex").slice(0, 12);
console.log(`tokens.generated.css  ${count} tokens  sha256:${sum}`);
console.log(`tokens.generated.ts   ${Object.keys(tokens.semantic).length} semantic + ${Object.keys(tokens.palette).length} palette`);
