#!/usr/bin/env node
/**
 * Verify design.css baseline values match DEFAULT_TOKENS in constants.ts.
 * Fails if any --buildrick-design-X CSS value differs from JS value.
 *
 * Run: node packages/editor/scripts/verify-design-baselines.mjs
 *
 * @license BSD-3-Clause
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Parse design.css
const css = fs.readFileSync(
  path.join(root, "src/themes/design-system/design.css"),
  "utf8"
);
const cssValues = {};
for (const line of css.split("\n")) {
  const match = line.match(/^\s*(--buildrick-design-[a-z0-9-]+)\s*:\s*([^;]+);/);
  if (match) cssValues[match[1]] = match[2].trim();
}

// Parse constants.ts DEFAULT_TOKENS. Each DesignToken object contains cssVar + value.
const ts = fs.readFileSync(
  path.join(root, "src/editor/design-system/constants.ts"),
  "utf8"
);
const tsValues = {};
const blockRegex = /\{[^{}]*\}/gs;
for (const block of ts.match(blockRegex) ?? []) {
  const cssVarMatch = block.match(/cssVar:\s*"(--buildrick-design-[a-z0-9-]+)"/);
  const valueMatch = block.match(/value:\s*"([^"]+)"/);
  if (cssVarMatch && valueMatch) {
    tsValues[cssVarMatch[1]] = valueMatch[1];
  }
}

// Normalize values for comparison: strip wrapping quotes, collapse whitespace.
function normalize(v) {
  if (v == null) return v;
  let n = v.trim();
  // Strip wrapping double quotes (CSS font-family values can be "Inter" while JS stores Inter).
  if (n.startsWith('"') && n.endsWith('"')) n = n.slice(1, -1);
  // Collapse any whitespace (handles rgba(0, 0, 0, 0.05) vs rgba(0,0,0,0.05)).
  n = n.replace(/\s+/g, "");
  return n;
}

// Compare
const allKeys = new Set([...Object.keys(cssValues), ...Object.keys(tsValues)]);
const mismatches = [];
for (const key of allKeys) {
  if (normalize(cssValues[key]) !== normalize(tsValues[key])) {
    mismatches.push({
      key,
      css: cssValues[key] ?? "(missing in CSS)",
      ts: tsValues[key] ?? "(missing in JS)",
    });
  }
}

if (mismatches.length > 0) {
  console.error("DS baseline parity FAILED:");
  for (const m of mismatches) {
    console.error(`  ${m.key}: CSS="${m.css}" vs JS="${m.ts}"`);
  }
  process.exit(1);
}

console.log(`DS baseline parity OK (${allKeys.size} tokens verified)`);
