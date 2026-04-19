#!/usr/bin/env node
/**
 * Codemod: replace INSPECTOR_TOKENS.X references with inline var(--buildrick-*) strings.
 * Decision 6: single-commit convergence — no dual-system drift.
 *
 * Run: node packages/editor/scripts/codemod-inspector-tokens.mjs
 *
 * @license BSD-3-Clause
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src");

// Map INSPECTOR_TOKENS.<key> → replacement value string.
// Values are the literal replacements (including outer quotes where needed).
const MAP = {
  accent: '"var(--buildrick-accent)"',
  accentAlpha08: '"rgba(45, 109, 255, 0.08)"',
  accentAlpha10: '"var(--buildrick-accent-subtle)"',
  accentAlpha20: '"rgba(45, 109, 255, 0.20)"',
  accentAlpha30: '"rgba(45, 109, 255, 0.30)"',
  surfaceInput: '"var(--buildrick-bg-input)"',
  surfaceOverlay: '"var(--buildrick-bg-panel)"',
  surfaceSubtle: '"var(--buildrick-bg-subtle)"',
  borderInput: '"var(--buildrick-border-medium)"',
  borderSubtle: '"var(--buildrick-border)"',
  textPrimary: '"var(--buildrick-text-primary)"',
  textSecondary: '"var(--buildrick-text-secondary)"',
  textTertiary: '"var(--buildrick-text-tertiary)"',
  textMuted: '"var(--buildrick-text-muted)"',
};

function walk(dir, collected = []) {
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

const files = walk(SRC);
let filesChanged = 0;
let totalReplacements = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("INSPECTOR_TOKENS")) continue;

  let content = original;
  let replacements = 0;

  // Replace INSPECTOR_TOKENS.X references in order of specificity
  // (longer keys first to avoid substring-of-longer issues).
  const keysByLength = Object.keys(MAP).sort((a, b) => b.length - a.length);
  for (const key of keysByLength) {
    const pattern = new RegExp(`INSPECTOR_TOKENS\\.${key}\\b`, "g");
    const before = content;
    content = content.replace(pattern, MAP[key]);
    if (content !== before) {
      const matchCount = (before.match(pattern) || []).length;
      replacements += matchCount;
    }
  }

  // Remove the INSPECTOR_TOKENS import line(s).
  // Handles: import { INSPECTOR_TOKENS } from "..."; and multi-import forms.
  content = content.replace(
    /import\s*\{\s*INSPECTOR_TOKENS\s*\}\s*from\s*["'][^"']+["']\s*;?\n?/g,
    ""
  );
  // Multi-import: import { INSPECTOR_TOKENS, Other } from "..."; → strip only INSPECTOR_TOKENS
  content = content.replace(
    /(import\s*\{\s*)INSPECTOR_TOKENS\s*,\s*([^}]+\}\s*from\s*["'][^"']+["']\s*;?)/g,
    "$1$2"
  );
  content = content.replace(
    /(import\s*\{\s*[^}]+?),\s*INSPECTOR_TOKENS(\s*\}\s*from\s*["'][^"']+["']\s*;?)/g,
    "$1$2"
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    const rel = path.relative(SRC, file);
    console.log(`  ${rel} (${replacements} replacements)`);
    totalReplacements += replacements;
    filesChanged++;
  }
}

console.log(`\nChanged ${filesChanged} files with ${totalReplacements} total replacements.`);
