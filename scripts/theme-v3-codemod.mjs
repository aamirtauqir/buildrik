#!/usr/bin/env node
// theme-v3-codemod: aqb-* → buildrick-* rename.
// Deleted in P8. See docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md.
// Pure stdlib — no child_process, no dependencies.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const MAPPING_PATH = 'scripts/theme-v3-mapping.json';
const DEFAULT_ROOTS = ['packages/editor/src', 'packages/editor/demo'];
const DOCS_ROOTS = [
  'packages/editor/src/docs',
  'packages/editor/src/project-documentation',
  'packages/editor/src/code-to-prd-output',
];

export function loadMapping() {
  return JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
}

export function walkFiles(roots, exts) {
  const out = [];
  for (const root of roots) {
    const queue = [root];
    while (queue.length) {
      const dir = queue.shift();
      try {
        for (const name of readdirSync(dir)) {
          if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
          const full = join(dir, name);
          const st = statSync(full);
          if (st.isDirectory()) queue.push(full);
          else if (exts.includes(extname(name))) out.push(full);
        }
      } catch { /* root doesn't exist — skip */ }
    }
  }
  return out;
}

const mode = process.argv[2] || 'dry-run';

if (mode === 'dry-run') runDryRun();
else if (mode === '--verify') runVerify();
else if (mode === '--apply') runApply();
else if (mode === '--docs') runDocsSweep();
else {
  console.error('Usage: node theme-v3-codemod.mjs [dry-run|--verify|--apply|--docs]');
  process.exit(2);
}

export function runDryRun() { console.log('TODO: Task 3+'); }
export function runVerify() { console.log('TODO: Task 5'); }
export function runApply() { console.log('TODO: Task 5'); }
export function runDocsSweep() { console.log('TODO: Task 10'); }
