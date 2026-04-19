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

export function applyOp1(content, mapping) {
  const csssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  return content.replace(/var\((--(?:aqb|ls|accent)-[a-z0-9-]+)(\s*,\s*[^)]+)?\)/g, (match, varName, fallback) => {
    const target = csssVars[varName];
    if (!target) throw new Error(`op1: unmapped CSS var ${varName}`);
    return `var(${target}${fallback || ''})`;
  });
}

export function applyOp1b(content, mapping) {
  const cssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  // Match --aqb-X / --ls-X / --accent-X NOT immediately followed by ${ (those are Category B manual).
  return content.replace(
    /(--(?:aqb|ls|accent)-[a-z0-9-]+)(?!\$\{)/g,
    (match, varName) => {
      const target = cssVars[varName];
      if (!target) return match; // leave for abort detection in verify step (not implemented here)
      return target;
    }
  );
}

export function applyOp2(content, mapping) {
  let out = content;
  for (const [oldName, target] of Object.entries(mapping.keyframes)) {
    if (typeof target === 'string') {
      out = out.replace(new RegExp(`@keyframes\\s+${oldName}\\b`, 'g'), `@keyframes ${target}`);
      out = out.replace(new RegExp(`animation-name:\\s*${oldName}\\b`, 'g'), `animation-name: ${target}`);
      out = out.replace(new RegExp(`(animation:\\s*)${oldName}\\b`, 'g'), `$1${target}`);
    } else if (target && target.action === 'delete') {
      const multi = new RegExp(`animation:\\s*${oldName}[^;]*,|,\\s*${oldName}\\b`);
      if (multi.test(out)) {
        throw new Error(`op2: multi-animation shorthand contains orphan ${oldName} — manual review required`);
      }
      out = out.replace(new RegExp(`^\\s*animation-name:\\s*${oldName}\\s*;\\s*\\n`, 'gm'), '');
      out = out.replace(new RegExp(`^\\s*animation:\\s*${oldName}[^,;]*;\\s*\\n`, 'gm'), '');
    }
  }
  return out;
}

export function applyOp4(content, mapping) {
  return content.replace(/data-aqb-[a-z-]+/g, (match) => {
    const target = mapping.data_attributes[match];
    if (!target) throw new Error(`op4: unmapped data attr ${match}`);
    return target;
  });
}

export function applyOp5(content, mapping) {
  let out = content;
  // Rule-block deletions first (before pattern rename)
  for (const [name, val] of Object.entries(mapping.classnames)) {
    if (val && typeof val === 'object' && val.action === 'delete-rule') {
      const ruleRe = new RegExp(`\\.${name}[^{]*\\{[^}]*\\}\\s*`, 'g');
      out = out.replace(ruleRe, '');
    }
  }
  // Pattern rename — stop at word-boundary (don't eat trailing hyphens before template expressions)
  out = out.replace(/\.?aqb-[a-z0-9]+(?:-[a-z0-9]+)*/g, (match) => {
    const hasDot = match.startsWith('.');
    const name = hasDot ? match.slice(1) : match;
    const target = mapping.classnames[name];
    if (!target) throw new Error(`op5: unmapped class ${name}`);
    if (typeof target === 'object') return match; // already handled by delete-rule
    return (hasDot ? '.' : '') + target;
  });
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
