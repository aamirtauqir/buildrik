#!/usr/bin/env node
/**
 * Phase 3.11 — migrate chrome inline hex to --buildrick-* tokens.
 * Only touches property-colon-hex patterns in style contexts.
 * Does NOT touch SVG fills or data-definition objects.
 *
 * Run: node packages/editor/scripts/migrate-inline-hex.mjs
 * @license BSD-3-Clause
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(__dirname, "../src/editor"),
  path.resolve(__dirname, "../src/shared/ui"),
  path.resolve(__dirname, "../src/shared/forms"),
  path.resolve(__dirname, "../src/ai"),
];

// Safe mappings — only the most common, unambiguous hex values.
// Each entry: { hex: regex, tokens: { property: replacement } }
const MAPPINGS = [
  // White — context-dependent: text→on-accent, bg→bg-card
  { hex: /^#[fF]{3}$|^#[fF]{6}$/i, tokens: { color: "var(--buildrick-text-on-accent)", background: "var(--buildrick-bg-card)", backgroundColor: "var(--buildrick-bg-card)" } },
  { hex: /^#(64748B|64748b)$/, tokens: { color: "var(--buildrick-text-muted)", backgroundColor: "var(--buildrick-text-muted)" } },
  { hex: /^#(94A3B8|94a3b8)$/, tokens: { color: "var(--buildrick-text-tertiary)", borderColor: "var(--buildrick-border-light)" } },
  { hex: /^#(71717A|71717a)$/, tokens: { color: "var(--buildrick-text-tertiary)" } },
  { hex: /^#(0F172A|0f172a)$/, tokens: { color: "var(--buildrick-text-primary)" } },
  { hex: /^#(334155)$/, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#(475569)$/, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#(374151)$/, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#(52525B|52525b)$/, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#(6C7086|6c7086)$/, tokens: { color: "var(--buildrick-text-muted)" } },
  { hex: /^#(5C6370|5c6370)$/, tokens: { color: "var(--buildrick-text-muted)" } },
  // 3-digit greys (legacy)
  { hex: /^#999$/i, tokens: { color: "var(--buildrick-text-tertiary)", background: "var(--buildrick-text-tertiary)", backgroundColor: "var(--buildrick-text-tertiary)" } },
  { hex: /^#666$/i, tokens: { color: "var(--buildrick-text-muted)", background: "var(--buildrick-text-muted)", backgroundColor: "var(--buildrick-text-muted)" } },
  { hex: /^#555$/i, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#444$/i, tokens: { color: "var(--buildrick-text-secondary)" } },
  { hex: /^#333$/i, tokens: { color: "var(--buildrick-text-primary)" } },
  // Backgrounds
  { hex: /^#(F8FAFC|f8fafc)$/, tokens: { background: "var(--buildrick-bg-panel)", backgroundColor: "var(--buildrick-bg-panel)" } },
  { hex: /^#(F8F9FA|f8f9fa)$/, tokens: { background: "var(--buildrick-bg-panel)", backgroundColor: "var(--buildrick-bg-panel)" } },
  { hex: /^#(F1F5F9|f1f5f9)$/, tokens: { background: "var(--buildrick-bg-subtle)", backgroundColor: "var(--buildrick-bg-subtle)" } },
  { hex: /^#(FAFAFA|fafafa)$/, tokens: { background: "var(--buildrick-bg-panel)", backgroundColor: "var(--buildrick-bg-panel)" } },
  // Borders
  { hex: /^#(E4E4E7|e4e4e7)$/, tokens: { borderColor: "var(--buildrick-border-medium)", border: "var(--buildrick-border-medium)" } },
  { hex: /^#(E2E8F0|e2e8f0)$/, tokens: { borderColor: "var(--buildrick-border-medium)", border: "var(--buildrick-border-medium)" } },
  // Semantic colors
  { hex: /^#(F59E0B|f59e0b)$/, tokens: { color: "var(--buildrick-warning)", backgroundColor: "var(--buildrick-warning)", background: "var(--buildrick-warning)" } },
  { hex: /^#(EF4444|ef4444)$/, tokens: { color: "var(--buildrick-error)", backgroundColor: "var(--buildrick-error)", background: "var(--buildrick-error)" } },
  { hex: /^#(22C55E|22c55e)$/, tokens: { color: "var(--buildrick-success)", backgroundColor: "var(--buildrick-success)", background: "var(--buildrick-success)" } },
  { hex: /^#(10B981|10b981)$/, tokens: { color: "var(--buildrick-success)", backgroundColor: "var(--buildrick-success)", background: "var(--buildrick-success)" } },
  // Cobalt / accent family
  { hex: /^#(3B82F6|3b82f6)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  { hex: /^#(2563EB|2563eb)$/, tokens: { color: "var(--buildrick-accent-hover)", background: "var(--buildrick-accent-hover)", backgroundColor: "var(--buildrick-accent-hover)" } },
  { hex: /^#(0073E6|0073e6)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  // Category D: Indigo / violet — DESIGN.md BANNED, migrate to cobalt
  { hex: /^#(667EEA|667eea)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  { hex: /^#(A5B4FC|a5b4fc)$/, tokens: { color: "var(--buildrick-accent-subtle)", backgroundColor: "var(--buildrick-accent-subtle)", background: "var(--buildrick-accent-subtle)" } },
  { hex: /^#(7C6DFA|7c6dfa)$/, tokens: { color: "var(--buildrick-accent-hover)", backgroundColor: "var(--buildrick-accent-hover)", background: "var(--buildrick-accent-hover)" } },
  { hex: /^#(6366F1|6366f1)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  { hex: /^#(8B5CF6|8b5cf6)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  { hex: /^#(60A5FA|60a5fa)$/, tokens: { color: "var(--buildrick-accent-subtle)", backgroundColor: "var(--buildrick-accent-subtle)", background: "var(--buildrick-accent-subtle)" } },
  { hex: /^#(7C3AED|7c3aed)$/, tokens: { color: "var(--buildrick-accent)", backgroundColor: "var(--buildrick-accent)", background: "var(--buildrick-accent)" } },
  // Category E: Near-black — NO BLACK rule (DESIGN.md)
  { hex: /^#(111827)$/, tokens: { color: "var(--buildrick-text-primary)", background: "var(--buildrick-text-primary)", backgroundColor: "var(--buildrick-text-primary)" } },
  { hex: /^#(0A0A0A|0a0a0a)$/, tokens: { color: "var(--buildrick-text-primary)", background: "var(--buildrick-text-primary)", backgroundColor: "var(--buildrick-text-primary)" } },
  { hex: /^#(1A1A1A|1a1a1a)$/, tokens: { color: "var(--buildrick-text-primary)", background: "var(--buildrick-text-primary)", backgroundColor: "var(--buildrick-text-primary)" } },
  { hex: /^#000$/i, tokens: { color: "var(--buildrick-text-primary)", background: "var(--buildrick-text-primary)", backgroundColor: "var(--buildrick-text-primary)" } },
];

// Match: property: "#hex" or property: '#hex' — inside a style object
// Returns: replacement or null if not mappable
function replaceHex(property, hex) {
  for (const mapping of MAPPINGS) {
    if (mapping.hex.test(hex)) {
      const token = mapping.tokens[property];
      if (token) return `"${token}"`;
    }
  }
  return null;
}

function walk(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, collected);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

// Match property-colon-quoted-hex in style contexts.
// Example: color: "#FFF"  → matches
// Example: { id: "white", hex: "#ffffff" }  → "hex" is not in our property list, NOT matched
const STYLE_HEX_REGEX =
  /\b(background|color|backgroundColor|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|boxShadow):\s*(["'])(#[0-9A-Fa-f]{3,8})\2/g;

let totalReplacements = 0;
let filesChanged = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const original = fs.readFileSync(file, "utf8");
    if (original.includes("@lint-hex-policy:")) continue;

    let changed = 0;
    const updated = original.replace(STYLE_HEX_REGEX, (match, property, quote, hex) => {
      const replacement = replaceHex(property, hex);
      if (replacement) {
        changed++;
        return `${property}: ${replacement}`;
      }
      return match;
    });

    if (updated !== original) {
      fs.writeFileSync(file, updated);
      const rel = path.relative(path.resolve(__dirname, ".."), file);
      console.log(`  ${rel} (${changed} replacements)`);
      totalReplacements += changed;
      filesChanged++;
    }
  }
}

console.log(`\nChanged ${filesChanged} files with ${totalReplacements} total replacements.`);
