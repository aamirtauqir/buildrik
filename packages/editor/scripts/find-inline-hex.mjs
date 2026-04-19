#!/usr/bin/env node
/**
 * Find inline hex colors in chrome directories using pure node fs.
 * Used by Phase 3.11 to scope inline hex cleanup.
 *
 * Run: node packages/editor/scripts/find-inline-hex.mjs [--group-by-value]
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
  path.resolve(__dirname, "../src/features/design-system/ui"),
];

const HEX_STYLE =
  /(background|color|backgroundColor|borderColor|boxShadow|borderTop|borderBottom|borderLeft|borderRight|border):\s*["'`]?(#[0-9A-Fa-f]{3,8})/g;

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

const args = process.argv.slice(2);
const groupByValue = args.includes("--group-by-value");

const sites = [];
const byValue = new Map();

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("@lint-hex-policy:")) continue;
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      let match;
      HEX_STYLE.lastIndex = 0;
      while ((match = HEX_STYLE.exec(line)) !== null) {
        const hex = match[2].toUpperCase();
        sites.push({ file, line: i + 1, hex, snippet: line.trim() });
        if (!byValue.has(hex)) byValue.set(hex, []);
        byValue.get(hex).push(`${file}:${i + 1}`);
      }
    });
  }
}

if (groupByValue) {
  const sorted = [...byValue.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [hex, refs] of sorted) {
    console.log(`${hex.padEnd(10)} ${refs.length.toString().padStart(4)} sites`);
  }
  console.log(`\nTotal unique hex values: ${byValue.size}`);
  console.log(`Total sites: ${sites.length}`);
} else {
  for (const site of sites) {
    console.log(`${site.file}:${site.line}: ${site.hex}`);
  }
  console.log(`\nTotal inline hex sites in chrome: ${sites.length}`);
}
